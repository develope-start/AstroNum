import { spawnSync } from "node:child_process";
import process from "node:process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function runNpm(args) {
  const result = spawnSync(npmCommand, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw new Error(`Failed to run npm ${args.join(" ")}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
  runNpm(["run", "db:deploy"]);
}

runNpm(["run", "build"]);
