import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { DexIntegrationService } from "../../dex-integration/service.js";
import { DexTokenSymbol } from "../../dex-integration/index.js";

const quoteQuerySchema = z.object({
  tokenIn: z.enum(["XLM", "sXLM"]),
  amount: z.coerce.number().positive(),
  slippageBps: z.coerce.number().int().min(0).max(5_000).default(50),
});

const oracleQuerySchema = z.object({
  windowSeconds: z.coerce.number().int().min(60).max(86_400).default(900),
});

export const dexRoutes: FastifyPluginAsync<{ dexIntegrationService: DexIntegrationService }> =
  async (fastify, opts) => {
    const { dexIntegrationService } = opts;

    fastify.get("/dex/markets", async () => dexIntegrationService.getMarkets());

    fastify.get("/dex/oracle", async (request, reply) => {
      try {
        const query = oracleQuerySchema.parse(request.query);
        return await dexIntegrationService.getOracleSnapshot(query.windowSeconds);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load oracle";
        reply.status(400).send({ error: message });
      }
    });

    fastify.get("/dex/quote", async (request, reply) => {
      try {
        const query = quoteQuerySchema.parse(request.query);
        return await dexIntegrationService.getQuote({
          tokenIn: query.tokenIn as DexTokenSymbol,
          amount: query.amount,
          slippageBps: query.slippageBps,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to build quote";
        reply.status(400).send({ error: message });
      }
    });

    fastify.get("/dex/route", async (request, reply) => {
      try {
        const query = quoteQuerySchema.parse(request.query);
        return await dexIntegrationService.getRoutes({
          tokenIn: query.tokenIn as DexTokenSymbol,
          amount: query.amount,
          slippageBps: query.slippageBps,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to build route";
        reply.status(400).send({ error: message });
      }
    });
  };
