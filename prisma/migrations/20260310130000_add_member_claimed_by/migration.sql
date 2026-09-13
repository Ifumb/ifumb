-- AlterTable: Add claimedByUserId to Member
ALTER TABLE "Member" ADD COLUMN "claimedByUserId" TEXT;

-- CreateIndex: unique constraint
CREATE UNIQUE INDEX "Member_claimedByUserId_key" ON "Member"("claimedByUserId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_claimedByUserId_fkey"
  FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
