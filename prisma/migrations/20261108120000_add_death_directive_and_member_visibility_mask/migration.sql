-- CreateEnum
CREATE TYPE "MemberVisibilityMask" AS ENUM ('STANDARD', 'MASKED');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "visibilityMask" "MemberVisibilityMask" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deathDirective" TEXT;
