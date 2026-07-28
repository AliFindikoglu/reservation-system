const fs = require("fs");
const path = require("path");

function loadEnvironmentFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env bulunamadı.");
  }

  const environment = {};
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator > 0) {
      const key = line.slice(0, separator).trim();
      const value = line
        .slice(separator + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      environment[key] = value;
    }
  }

  return environment;
}

function createTestEnvironment() {
  const fileEnvironment = loadEnvironmentFile();
  if (!fileEnvironment.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL .env içinde tanımlanmalıdır.");
  }

  return {
    ...process.env,
    ...fileEnvironment,
    NODE_ENV: "test",
    DATABASE_URL: fileEnvironment.TEST_DATABASE_URL,
    PORT: fileEnvironment.TEST_PORT ?? "3001",
    JWT_SECRET:
      fileEnvironment.TEST_JWT_SECRET ?? fileEnvironment.JWT_SECRET,
    JWT_EXPIRES_IN:
      fileEnvironment.TEST_JWT_EXPIRES_IN ??
      fileEnvironment.JWT_EXPIRES_IN ??
      "1h",
    CHECKPOINT_DISABLE: "1",
  };
}

module.exports = { createTestEnvironment, loadEnvironmentFile };
