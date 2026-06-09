ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = COALESCE(NULLIF(split_part("email", '@', 1), ''), 'user') || '_' || "id"
WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

ALTER TABLE "Product" ADD COLUMN "sellerId" INTEGER;

ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
