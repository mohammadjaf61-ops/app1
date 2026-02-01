ALTER TABLE "order"
  ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "order_idempotency_key_key" ON "order" ("idempotency_key");
