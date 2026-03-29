ALTER TABLE "governance_proposals"
ADD COLUMN IF NOT EXISTS "chainProposalId" INTEGER,
ADD COLUMN IF NOT EXISTS "appliedAt" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS "governance_proposals_chainProposalId_key"
ON "governance_proposals" ("chainProposalId")
WHERE "chainProposalId" IS NOT NULL;
