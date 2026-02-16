/*
  Warnings:

  - You are about to drop the column `description` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `sub` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `answer` on the `Faq` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `Faq` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `buttonText` on the `SubBanner` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `SubBanner` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `SubBanner` table. All the data in the column will be lost.
  - Made the column `name` on table `CategoryLocale` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `ProductLocale` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CategoryLocale" DROP CONSTRAINT "CategoryLocale_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProductLocale" DROP CONSTRAINT "ProductLocale_productId_fkey";

-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "description",
DROP COLUMN "sub",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "CategoryLocale" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "Faq" DROP COLUMN "answer",
DROP COLUMN "question";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "description",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "ProductLocale" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "SubBanner" DROP COLUMN "buttonText",
DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "FaqLocale" (
    "id" TEXT NOT NULL,
    "faqId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,

    CONSTRAINT "FaqLocale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubBannerLocale" (
    "id" TEXT NOT NULL,
    "subBannerId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL,

    CONSTRAINT "SubBannerLocale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaqLocale_faqId_locale_key" ON "FaqLocale"("faqId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SubBannerLocale_subBannerId_locale_key" ON "SubBannerLocale"("subBannerId", "locale");

-- AddForeignKey
ALTER TABLE "CategoryLocale" ADD CONSTRAINT "CategoryLocale_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLocale" ADD CONSTRAINT "ProductLocale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqLocale" ADD CONSTRAINT "FaqLocale_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "Faq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubBannerLocale" ADD CONSTRAINT "SubBannerLocale_subBannerId_fkey" FOREIGN KEY ("subBannerId") REFERENCES "SubBanner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
