CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Table" ADD COLUMN "code" TEXT;

UPDATE "Table"
SET "code" = CHR(65 + (("number" - 1) / 8)) || ((("number" - 1) % 8) + 1)::TEXT;

ALTER TABLE "Table" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Table_code_key" ON "Table"("code");

ALTER TABLE "Reservation"
ADD COLUMN "createdByAdminId" TEXT,
ADD COLUMN "cancelledByUserId" TEXT,
ADD COLUMN "cancellationReason" TEXT;

CREATE INDEX "Reservation_createdByAdminId_idx" ON "Reservation"("createdByAdminId");

CREATE TABLE "Equipment" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");
CREATE UNIQUE INDEX "Equipment_name_key" ON "Equipment"("name");

CREATE TABLE "TableEquipment" (
  "tableId" INTEGER NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedByAdminId" TEXT,
  CONSTRAINT "TableEquipment_pkey" PRIMARY KEY ("tableId", "equipmentId")
);

CREATE INDEX "TableEquipment_equipmentId_idx" ON "TableEquipment"("equipmentId");

CREATE TABLE "TableAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tableId" INTEGER NOT NULL,
  "startsOn" DATE NOT NULL,
  "endsOn" DATE,
  "createdByAdminId" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokedByAdminId" TEXT,
  "revocationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TableAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TableAssignment_userId_startsOn_endsOn_idx" ON "TableAssignment"("userId", "startsOn", "endsOn");
CREATE INDEX "TableAssignment_tableId_startsOn_endsOn_idx" ON "TableAssignment"("tableId", "startsOn", "endsOn");

CREATE TABLE "UserRestriction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startsOn" DATE NOT NULL,
  "endsOn" DATE NOT NULL,
  "reason" TEXT,
  "createdByAdminId" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokedByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserRestriction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserRestriction_userId_startsOn_endsOn_idx" ON "UserRestriction"("userId", "startsOn", "endsOn");
CREATE UNIQUE INDEX "UserRestriction_one_active_per_user_key"
ON "UserRestriction"("userId") WHERE "revokedAt" IS NULL;

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "relatedEntityType" TEXT,
  "relatedEntityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TableEquipment" ADD CONSTRAINT "TableEquipment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TableEquipment" ADD CONSTRAINT "TableEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TableEquipment" ADD CONSTRAINT "TableEquipment_assignedByAdminId_fkey" FOREIGN KEY ("assignedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_revokedByAdminId_fkey" FOREIGN KEY ("revokedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserRestriction" ADD CONSTRAINT "UserRestriction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserRestriction" ADD CONSTRAINT "UserRestriction_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserRestriction" ADD CONSTRAINT "UserRestriction_revokedByAdminId_fkey" FOREIGN KEY ("revokedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
