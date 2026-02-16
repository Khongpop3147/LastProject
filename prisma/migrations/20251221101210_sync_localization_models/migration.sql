-- CreateTable
CREATE TABLE "CategoryLocale" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CategoryLocale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLocale" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductLocale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryLocale_categoryId_locale_key" ON "CategoryLocale"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLocale_productId_locale_key" ON "ProductLocale"("productId", "locale");

-- AddForeignKey
ALTER TABLE "CategoryLocale" ADD CONSTRAINT "CategoryLocale_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLocale" ADD CONSTRAINT "ProductLocale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
