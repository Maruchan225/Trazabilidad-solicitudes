ALTER TABLE "User" ADD COLUMN "rut" TEXT;

CREATE UNIQUE INDEX "User_rut_key" ON "User"("rut");
