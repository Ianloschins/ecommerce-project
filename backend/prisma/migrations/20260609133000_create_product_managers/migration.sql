CREATE TABLE "ProductManager" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductManager_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductManager_userId_key" ON "ProductManager"("userId");

INSERT INTO "ProductManager" ("userId")
SELECT "id"
FROM "User"
WHERE "super_user" = true
ON CONFLICT ("userId") DO NOTHING;

ALTER TABLE "ProductManager" ADD CONSTRAINT "ProductManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" DROP COLUMN "super_user";
