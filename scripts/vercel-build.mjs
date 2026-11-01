import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

function runNodeScript(script, args = []) {
  const command = path.join(process.cwd(), script);
  const result = spawnSync(process.execPath, [command, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw new Error(`Failed to run ${script}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
  runNodeScript("scripts/deploy-db.mjs");
}

runNodeScript("node_modules/prisma/build/index.js", ["generate"]);
runNodeScript("node_modules/next/dist/bin/next", ["build"]);
