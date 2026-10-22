import { spawn } from "node:child_process";

const bundled =
  process.env.IMPORT_BUNDLE === "1" || process.env.NODE_ENV === "production";
const args = bundled
  ? ["--env-file-if-exists=.env", "dist/import.mjs", ...process.argv.slice(2)]
  : [
      "--env-file-if-exists=.env",
      "--import",
      "tsx",
      "scripts/import-dataset.ts",
      ...process.argv.slice(2),
    ];

const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
