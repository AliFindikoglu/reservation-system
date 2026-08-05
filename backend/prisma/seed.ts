import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ISTANBUL_OFFICE_ID = '00000000-0000-4000-8000-000000000001';
const IZMIR_OFFICE_ID = '00000000-0000-4000-8000-000000000002';

function tableData(officeId: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    officeId,
    number: index + 1,
    code: `${String.fromCharCode(65 + Math.floor(index / 8))}${(index % 8) + 1}`,
  }));
}

async function main() {
  await prisma.office.upsert({
    where: { id: ISTANBUL_OFFICE_ID },
    create: {
      id: ISTANBUL_OFFICE_ID,
      name: 'Istanbul Office',
      city: 'Istanbul',
    },
    update: { name: 'Istanbul Office', city: 'Istanbul', isActive: true },
  });

  await prisma.office.upsert({
    where: { id: IZMIR_OFFICE_ID },
    create: {
      id: IZMIR_OFFICE_ID,
      name: 'Izmir Office',
      city: 'Izmir',
    },
    update: { name: 'Izmir Office', city: 'Izmir', isActive: true },
  });

  await prisma.table.createMany({
    data: [
      ...tableData(ISTANBUL_OFFICE_ID, 32),
      ...tableData(IZMIR_OFFICE_ID, 16),
    ],
    skipDuplicates: true,
  });

  await prisma.equipment.createMany({
    data: [
      { code: "MONITOR", name: "Monitor" },
      { code: "DUAL_MONITOR", name: "Dual Monitor" },
      { code: "DOCK_STATION", name: "Dock Station" },
      { code: "ETHERNET_PORT", name: "Ethernet Port" },
      { code: "WEBCAM", name: "Webcam" },
      { code: "HEADSET", name: "Headset" },
      { code: "EXTERNAL_KEYBOARD", name: "External Keyboard" },
      { code: "EXTERNAL_MOUSE", name: "External Mouse" },
      { code: "USB_C_CHARGER", name: "USB-C Charger" },
      { code: "IP_PHONE", name: "IP Phone" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
