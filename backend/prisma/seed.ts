import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.table.createMany({
    data: Array.from({ length: 32 }, (_, index) => ({
      number: index + 1,
      code: `${String.fromCharCode(65 + Math.floor(index / 8))}${(index % 8) + 1}`,
    })),
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
