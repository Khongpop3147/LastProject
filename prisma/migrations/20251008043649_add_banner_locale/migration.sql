-- CreateTable
CREATE TABLE "BannerLocale" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "sub" TEXT,
    "bannerId" TEXT NOT NULL,

    CONSTRAINT "BannerLocale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BannerLocale_bannerId_locale_key" ON "BannerLocale"("bannerId", "locale");

-- AddForeignKey
ALTER TABLE "BannerLocale" ADD CONSTRAINT "BannerLocale_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
