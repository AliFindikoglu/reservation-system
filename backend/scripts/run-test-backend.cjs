const path = require("path");
const { spawnSync } = require("child_process");
const { createTestEnvironment } = require("./load-env.cjs");

const projectRoot = path.join(__dirname, "..");
const nestCli = require.resolve("@nestjs/cli/bin/nest.js");
const result = spawnSync(
  process.execPath,
  [nestCli, "start", "--watch"],
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
