/*
  Warnings:

  - Made the column `description` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;
