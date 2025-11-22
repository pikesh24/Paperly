/*
  Warnings:

  - You are about to drop the column `currentStreak` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `lastPostedAt` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `longestStreak` on the `Note` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Note" DROP COLUMN "currentStreak",
DROP COLUMN "lastPostedAt",
DROP COLUMN "longestStreak";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastPostedAt" TIMESTAMP(3),
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0;
