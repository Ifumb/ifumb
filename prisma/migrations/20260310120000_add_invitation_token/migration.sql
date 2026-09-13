-- AlterTable: Add token and expiresAt to Invitation
ALTER TABLE "Invitation" ADD COLUMN "token" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- CreateIndex: unique token
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
