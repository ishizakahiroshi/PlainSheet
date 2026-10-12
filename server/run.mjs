// Node 24 supports erasable TypeScript natively. Resolve only this relay's own
// extensionless relative imports; no third-party loader/package is installed.
import { registerHooks } from "node:module";
import { URL } from "node:url";

const roots = [
  new URL("./", import.meta.url).href,
  new URL("../src/lib/collaboration/", import.meta.url).href,
];
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL &&
      roots.some((root) => context.parentURL.startsWith(root)) &&
      specifier.startsWith(".") &&
      !/\.[a-z]+$/i.test(specifier)
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
await import("./serve.ts");
