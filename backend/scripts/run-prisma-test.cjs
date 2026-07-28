const path = require("path");
const { spawnSync } = require("child_process");
const { createTestEnvironment } = require("./load-env.cjs");

const prismaArguments = process.argv.slice(2);
if (prismaArguments.length === 0) {
  throw new Error("Çalıştırılacak Prisma komutu belirtilmelidir.");
}

const projectRoot = path.join(__dirname, "..");
const prismaCli = require.resolve("prisma/build/index.js");
const result = spawnSync(
  process.execPath,
  [prismaCli, ...prismaArguments],
  {
    cwd: projectRoot,
    env: createTestEnvironment(),
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);
