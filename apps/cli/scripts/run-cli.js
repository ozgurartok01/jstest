#!/usr/bin/env node
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const distCli = path.join(projectRoot, "dist", "cli.js");

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { stdio: "inherit", ...options });
  return res.status ?? (res.error ? 1 : 0);
}

function ensureBuilt() {
  const needBuild = process.env.FORCE_BUILD === "1" || !fs.existsSync(distCli);
  if (!needBuild) return 0;

  const tscBin = path.join(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tsc.cmd" : "tsc",
  );

  return run(tscBin, [], {
    cwd: projectRoot,
    shell: process.platform === "win32",
  });
}

const rc = ensureBuilt();
if (rc !== 0) {
  process.exit(rc);
}

const args = process.argv.slice(2);
const code = run(process.execPath, [distCli, ...args]);
process.exit(code);
