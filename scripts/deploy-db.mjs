import { spawnSync } from "node:child_process";
import path from "node:path";

const baselineName = "20260918120000_postgresql_baseline";
const baselineFile = path.join("prisma", "migrations", baselineName, "migration.sql");
const prismaCommand = path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");

function runPrisma(args) {
  const result = spawnSync(prismaCommand, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? `\n${result.error.message}\n` : ""}`;
  process.stdout.write(output);
  return { status: result.status ?? 1, output };
}

const deploy = runPrisma(["migrate", "deploy"]);
if (deploy.status === 0) process.exit(0);
if (!deploy.output.includes("P3005")) process.exit(deploy.status);

console.log("Existing PostgreSQL schema detected. Applying the AstroNum baseline...");
const applyBaseline = runPrisma(["db", "execute", "--file", baselineFile]);
if (applyBaseline.status !== 0) process.exit(applyBaseline.status);

const resolveBaseline = runPrisma(["migrate", "resolve", "--applied", baselineName]);
if (
  resolveBaseline.status !== 0 &&
  !resolveBaseline.output.includes("P3008") &&
  !resolveBaseline.output.toLowerCase().includes("already applied")
) {
  process.exit(resolveBaseline.status);
}

console.log("PostgreSQL schema is ready.");
