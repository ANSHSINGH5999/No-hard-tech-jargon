CREATE TABLE IF NOT EXISTS "liquidity_oracle_observations" (
  "id" SERIAL PRIMARY KEY,
  "observed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reserve_xlm" BIGINT NOT NULL,
  "reserve_sxlm" BIGINT NOT NULL,
  "total_lp_supply" BIGINT NOT NULL DEFAULT 0,
  "spot_price" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'lp_pool'
);

CREATE INDEX IF NOT EXISTS "idx_liquidity_oracle_observations_observed_at"
ON "liquidity_oracle_observations" ("observed_at" DESC);

CREATE TABLE IF NOT EXISTS "liquidity_mining_programs" (
  "id" SERIAL PRIMARY KEY,
  "program_key" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reward_asset" TEXT NOT NULL DEFAULT 'sXLM',
  "reward_per_day" BIGINT NOT NULL,
  "start_at" TIMESTAMPTZ NOT NULL,
  "end_at" TIMESTAMPTZ NOT NULL,
  "min_lp_tokens" BIGINT NOT NULL DEFAULT 0,
  "total_rewards" BIGINT,
  "distributed_rewards" BIGINT NOT NULL DEFAULT 0,
  "proposal_id" INTEGER,
  "dexes" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_liquidity_mining_programs_status_window"
ON "liquidity_mining_programs" ("status", "start_at", "end_at");
