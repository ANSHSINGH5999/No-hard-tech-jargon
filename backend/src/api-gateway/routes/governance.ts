import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  rpc,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { config } from "../../config/index.js";
import { PrismaClient } from "@prisma/client";
import { DexIntegrationService } from "../../dex-integration/service.js";
import {
  listCachedGovernanceProposals,
  syncGovernanceProposals,
} from "../../governance-sync/index.js";

const createProposalSchema = z.object({
  userAddress: z.string().min(56).max(56),
  paramKey: z.string().min(1),
  newValue: z.string().min(1),
});

const voteSchema = z.object({
  userAddress: z.string().min(56).max(56),
  proposalId: z.number().int().min(0),
  support: z.boolean(),
});

const executeSchema = z.object({
  userAddress: z.string().min(56).max(56),
  proposalId: z.number().int().min(0),
});

async function buildContractTx(
  server: rpc.Server,
  contractId: string,
  method: string,
  args: any[],
  userAddress: string
) {
  const contract = new Contract(contractId);
  const op = contract.call(method, ...args);

  const account = await server.getAccount(userAddress);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.stellar.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(300)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    const errStr = String(simResult.error);
    if (errStr.includes("UnreachableCodeReached")) {
      if (method === "vote") {
        throw new Error("You need sXLM to vote. Stake XLM first to receive sXLM, then vote.");
      }
      if (method === "create_proposal") {
        throw new Error("You need at least 100 sXLM to create a proposal. Stake XLM first.");
      }
      if (method === "execute_proposal") {
        throw new Error("Proposal cannot be executed — voting period may not be over, quorum not met, or it already executed.");
      }
    }
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  return {
    xdr: preparedTx.toXDR(),
    networkPassphrase: config.stellar.networkPassphrase,
  };
}

async function queryContractView(
  server: rpc.Server,
  contractId: string,
  method: string,
  args: any[]
) {
  const contract = new Contract(contractId);
  const op = contract.call(method, ...args);

  const account = await server.getAccount(config.admin.publicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.stellar.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
    return scValToNative(simResult.result.retval);
  }
  return null;
}

export const governanceRoutes: FastifyPluginAsync<{
  prisma: PrismaClient;
  dexIntegrationService: DexIntegrationService;
}> = async (
  fastify,
  opts
) => {
  const { prisma, dexIntegrationService } = opts;
  const server = new rpc.Server(config.stellar.rpcUrl);
  const govContractId = config.contracts.governanceContractId;

  /**
   * POST /governance/create-proposal
   * Build unsigned tx: create a new governance proposal.
   */
  fastify.post("/governance/create-proposal", async (request, reply) => {
    try {
      const body = createProposalSchema.parse(request.body);

      const result = await buildContractTx(
        server,
        govContractId,
        "create_proposal",
        [
          new Address(body.userAddress).toScVal(),
          nativeToScVal(body.paramKey, { type: "string" }),
          nativeToScVal(body.newValue, { type: "string" }),
        ],
        body.userAddress
      );
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Create proposal failed";
      reply.status(400).send({ error: message });
    }
  });

  /**
   * POST /governance/vote
   * Build unsigned tx: vote on a proposal.
   */
  fastify.post("/governance/vote", async (request, reply) => {
    try {
      const body = voteSchema.parse(request.body);

      // Pre-flight: check user has sXLM to vote with
      const sxlmRaw = await queryContractView(
        server,
        config.contracts.sxlmTokenContractId,
        "balance",
        [new Address(body.userAddress).toScVal()]
      );
      const sxlmBalance = BigInt(sxlmRaw ?? 0);
      if (sxlmBalance <= BigInt(0)) {
        return reply.status(400).send({
          error: "You have no sXLM to vote with. Stake XLM first to receive sXLM, then vote.",
        });
      }

      const result = await buildContractTx(
        server,
        govContractId,
        "vote",
        [
          new Address(body.userAddress).toScVal(),
          nativeToScVal(BigInt(body.proposalId), { type: "u64" }),
          nativeToScVal(body.support, { type: "bool" }),
        ],
        body.userAddress
      );

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Vote failed";
      reply.status(400).send({ error: message });
    }
  });

  /**
   * POST /governance/execute
   * Build unsigned tx: execute a passed proposal.
   */
  fastify.post("/governance/execute", async (request, reply) => {
    try {
      const body = executeSchema.parse(request.body);

      const result = await buildContractTx(
        server,
        govContractId,
        "execute_proposal",
        [nativeToScVal(BigInt(body.proposalId), { type: "u64" })],
        body.userAddress
      );
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Execution failed";
      reply.status(400).send({ error: message });
    }
  });

  /**
   * GET /governance/proposals
   * Fetch proposals from on-chain + DB.
   */
  fastify.get("/governance/proposals", async () => {
    try {
      const proposals = await syncGovernanceProposals(prisma, dexIntegrationService);
      if (proposals.length === 0) {
        const dbProposals = await listCachedGovernanceProposals(prisma);
        return {
          proposals: dbProposals,
          total: dbProposals.length,
        };
      }

      return { proposals, total: proposals.length };
    } catch {
      // Fallback to DB
      const dbProposals = await listCachedGovernanceProposals(prisma);
      return {
        proposals: dbProposals,
        total: dbProposals.length,
      };
    }
  });

  /**
   * GET /governance/proposals/:id
   */
  fastify.get("/governance/proposals/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const proposalId = parseInt(id, 10);

    try {
      const proposals = await syncGovernanceProposals(
        prisma,
        dexIntegrationService,
        proposalId
      );
      if (proposals.length === 0) {
        return reply.status(404).send({ error: "Proposal not found" });
      }
      return proposals[0];
    } catch {
      // Fallback to DB
      const dbProposal = (await listCachedGovernanceProposals(prisma)).find(
        (proposal) => proposal.id === proposalId
      );
      if (!dbProposal) {
        return reply.status(404).send({ error: "Proposal not found" });
      }
      return dbProposal;
    }
  });

  /**
   * GET /governance/params
   * Get current governable parameters.
   */
  fastify.get("/governance/params", async () => {
    const paramKeys = [
      { key: "protocol_fee_bps", defaultValue: "1000", description: "Protocol fee in basis points (10% = 1000)" },
      { key: "cooldown_period", defaultValue: "17280", description: "Withdrawal cooldown in ledgers (~24h)" },
      { key: "collateral_factor", defaultValue: "7000", description: "Lending collateral factor in bps (70%)" },
      { key: "borrow_rate_bps", defaultValue: "400", description: "Lending borrow rate in basis points (4% = 400)" },
      { key: "liquidation_threshold", defaultValue: "8000", description: "Liquidation threshold in bps (80% = 8000)" },
      { key: "lp_protocol_fee_bps", defaultValue: "5", description: "LP pool protocol fee in basis points (5 = 0.05% of swap input)" },
      { key: "buffer_safety_factor", defaultValue: "250", description: "Liquidity buffer safety factor (2.5x)" },
      {
        key: "liquidity_mining_program",
        defaultValue:
          "{\"programId\":\"ecosystem-bootstrap\",\"title\":\"sXLM/XLM Ecosystem Bootstrap\",\"status\":\"active\",\"rewardAsset\":\"sXLM\",\"rewardPerDayRaw\":\"250000000\",\"startAt\":\"2026-04-01T00:00:00.000Z\",\"endAt\":\"2026-06-30T00:00:00.000Z\",\"minLpTokensRaw\":\"0\",\"dexes\":[\"StellarX\",\"Lumenswap\"]}",
        description: "JSON program definition used to distribute LP rewards via governance execution",
      },
    ];

    const params = await Promise.all(
      paramKeys.map(async ({ key, defaultValue, description }) => {
        let currentValue = defaultValue;
        try {
          const onChainValue = await queryContractView(
            server,
            govContractId,
            "get_param",
            [nativeToScVal(key, { type: "string" })]
          );
          if (onChainValue && String(onChainValue) !== "") {
            currentValue = String(onChainValue);
          }
        } catch {
          // Use default if on-chain query fails
        }
        return { key, currentValue, description };
      })
    );

    return { params };
  });
};
