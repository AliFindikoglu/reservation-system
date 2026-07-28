const { PrismaClient } = require("@prisma/client");
const { loadEnvironmentFile } = require("./load-env.cjs");

async function main() {
  const environment = loadEnvironmentFile();
  const adminUrl = environment.TEST_DATABASE_ADMIN_URL;
  if (!adminUrl) {
    throw new Error(
      "TEST_DATABASE_ADMIN_URL .env içinde tanımlanmalıdır.",
    );
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: adminUrl } },
  });

  try {
    const databases = await prisma.$queryRawUnsafe(
      "SELECT 1 FROM pg_database WHERE datname = 'reservation_test_db'",
    );
    if (databases.length === 0) {
      await prisma.$executeRawUnsafe("CREATE DATABASE reservation_test_db");
      console.log("reservation_test_db oluşturuldu.");
    } else {
      console.log("reservation_test_db zaten var.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
