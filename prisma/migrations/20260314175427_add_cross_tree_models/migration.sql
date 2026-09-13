-- CreateEnum
CREATE TYPE "SuggestionConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('NEW', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConnectionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REFUSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CrossTreeSuggestion" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "targetTreeId" TEXT NOT NULL,
    "targetMemberId" TEXT NOT NULL,
    "confidence" "SuggestionConfidence" NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrossTreeSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossTreeConnectionRequest" (
    "id" TEXT NOT NULL,
    "requesterTreeId" TEXT NOT NULL,
    "requesterMemberId" TEXT NOT NULL,
    "targetTreeId" TEXT NOT NULL,
    "targetMemberId" TEXT NOT NULL,
    "initiatedByUserId" TEXT NOT NULL,
    "status" "ConnectionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,

    CONSTRAINT "CrossTreeConnectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossTreeLink" (
    "id" TEXT NOT NULL,
    "tree1Id" TEXT NOT NULL,
    "member1Id" TEXT NOT NULL,
    "tree2Id" TEXT NOT NULL,
    "member2Id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrossTreeLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrossTreeSuggestion_treeId_status_idx" ON "CrossTreeSuggestion"("treeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CrossTreeSuggestion_memberId_targetMemberId_key" ON "CrossTreeSuggestion"("memberId", "targetMemberId");

-- CreateIndex
CREATE INDEX "CrossTreeConnectionRequest_targetTreeId_status_idx" ON "CrossTreeConnectionRequest"("targetTreeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CrossTreeConnectionRequest_requesterMemberId_targetMemberId_key" ON "CrossTreeConnectionRequest"("requesterMemberId", "targetMemberId");

-- CreateIndex
CREATE INDEX "CrossTreeLink_tree1Id_idx" ON "CrossTreeLink"("tree1Id");

-- CreateIndex
CREATE INDEX "CrossTreeLink_tree2Id_idx" ON "CrossTreeLink"("tree2Id");

-- CreateIndex
CREATE UNIQUE INDEX "CrossTreeLink_member1Id_member2Id_key" ON "CrossTreeLink"("member1Id", "member2Id");

-- AddForeignKey
ALTER TABLE "CrossTreeSuggestion" ADD CONSTRAINT "CrossTreeSuggestion_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossTreeSuggestion" ADD CONSTRAINT "CrossTreeSuggestion_targetTreeId_fkey" FOREIGN KEY ("targetTreeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossTreeConnectionRequest" ADD CONSTRAINT "CrossTreeConnectionRequest_requesterTreeId_fkey" FOREIGN KEY ("requesterTreeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossTreeConnectionRequest" ADD CONSTRAINT "CrossTreeConnectionRequest_targetTreeId_fkey" FOREIGN KEY ("targetTreeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossTreeConnectionRequest" ADD CONSTRAINT "CrossTreeConnectionRequest_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossTreeLink" ADD CONSTRAINT "CrossTreeLink_tree1Id_fkey" FOREIGN KEY ("tree1Id") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossTreeLink" ADD CONSTRAINT "CrossTreeLink_tree2Id_fkey" FOREIGN KEY ("tree2Id") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
