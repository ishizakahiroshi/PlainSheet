// @vitest-environment node
import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

describe("optional Node 24 relay entry point", () => {
  it("starts and stops only a loopback synthetic-test relay without a build or dependency", async () => {
    const reservation = createServer();
    await new Promise<void>((resolve) => reservation.listen(0, "127.0.0.1", resolve));
    const port = (reservation.address() as AddressInfo).port;
    await new Promise<void>((resolve) => reservation.close(() => resolve()));
    const child = spawn(process.execPath, ["server/run.mjs"], {
      cwd: fileURLToPath(new URL("../../", import.meta.url)),
      env: {
        PLAINSHEET_ALLOWED_ORIGINS: "http://localhost:1420",
        PLAINSHEET_RELAY_PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    const exited = once(child, "exit");
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`Synthetic relay did not start: ${output}`)),
          5000,
        );
        child.stdout.on("data", (chunk) => {
          output += chunk.toString();
          if (output.includes("listening on loopback")) {
            clearTimeout(timer);
            resolve();
          }
        });
        child.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.once("exit", (code) => {
          clearTimeout(timer);
          reject(new Error(`Relay exited ${code}: ${output}`));
        });
      });
      const response = await fetch(`http://127.0.0.1:${port}/rooms`, {
        method: "POST",
        headers: { Origin: "http://localhost:1420", "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [["synthetic fixture only"]], displayName: "Test Owner" }),
      });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.snapshot.document.revision).toBe(0);
    } finally {
      child.kill("SIGTERM");
      await exited;
    }
    expect(output).not.toContain("Bearer");
    expect(child.exitCode).toBe(0);
  }, 10_000);
});
