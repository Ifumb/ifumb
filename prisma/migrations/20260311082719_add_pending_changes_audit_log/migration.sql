-- CreateEnum
CREATE TYPE "PendingTargetType" AS ENUM ('MEMBER', 'UNION');

-- CreateEnum
CREATE TYPE "PendingAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('MEMBER_CREATED', 'MEMBER_UPDATED', 'MEMBER_DELETED', 'UNION_CREATED', 'UNION_UPDATED', 'UNION_DELETED', 'INVITATION_SENT', 'INVITATION_ACCEPTED', 'INVITATION_REJECTED', 'INVITATION_REVOKED', 'ROLE_CHANGED', 'TREE_UPDATED', 'PENDING_CHANGE_APPROVED', 'PENDING_CHANGE_REJECTED', 'MEMBER_CLAIMED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PENDING_CHANGE_CREATED', 'CHANGE_REJECTED', 'CHANGE_APPROVED');

-- AlterTable
ALTER TABLE "Tree" ADD COLUMN     "pendingNotifLastSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PendingChange" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetType" "PendingTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "PendingAction" NOT NULL,
    "snapshotBefore" JSONB,
    "snapshotAfter" JSONB,
    "status" "PendingStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionComment" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "diff" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "pendingChangeId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_treeId_createdAt_idx" ON "AuditLog"("treeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_treeId_authorId_idx" ON "AuditLog"("treeId", "authorId");

-- CreateIndex
CREATE INDEX "AuditLog_treeId_action_idx" ON "AuditLog"("treeId", "action");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "PendingChange" ADD CONSTRAINT "PendingChange_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingChange" ADD CONSTRAINT "PendingChange_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingChange" ADD CONSTRAINT "PendingChange_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_pendingChangeId_fkey" FOREIGN KEY ("pendingChangeId") REFERENCES "PendingChange"("id") ON DELETE SET NULL ON UPDATE CASCADE;
