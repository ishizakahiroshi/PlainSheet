// Optional self-host entry point. Run explicitly with the project's Bun runtime.
// No public endpoint, default origin, hosted service, or credential is bundled.
import { createCollaborationRelay } from "./relay";

const allowedOrigins = (process.env.PLAINSHEET_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const port = Number(process.env.PLAINSHEET_RELAY_PORT ?? 8787);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid relay port.");
const { server } = createCollaborationRelay({ allowedOrigins });
server.listen(port, "127.0.0.1", () => {
  process.stdout.write(
    `PlainSheet relay listening on loopback port ${port}; TLS reverse proxy required for remote access.\n`,
  );
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    server.close();
    server.closeAllConnections();
  });
