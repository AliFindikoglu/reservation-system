const { createTestEnvironment } = require("../scripts/load-env.cjs");

Object.assign(process.env, createTestEnvironment());
