/**
 * scripts/generate-samples.mjs
 * Regenerates the curated sample itineraries in data/samples/.
 *
 * Run locally: npm run generate:samples
 *
 * The planner lives in TypeScript, so this boots Vite in middleware mode and
 * loads it through `ssrLoadModule`. That reuses the Vite already present as a
 * dev dependency rather than adding a separate TypeScript runner.
 *
 * The test suite never writes these files; it only checks that the committed
 * output still matches what the planner produces. Run this script whenever a
 * planner, cost or geo change legitimately alters the samples.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SAMPLES_DIR = path.join(ROOT, "data", "samples");

async function main() {
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: "error",
    server: { middlewareMode: true },
    appType: "custom",
    resolve: {
      alias: { "@": path.join(ROOT, "src") },
    },
  });

  try {
    const { buildSamplePlan, serializeSamplePlan, normalizeEol } =
      await server.ssrLoadModule("/scripts/build-samples.ts");
    const { SAMPLE_CONFIGS } = await server.ssrLoadModule("/scripts/sample-configs.ts");

    await fs.mkdir(SAMPLES_DIR, { recursive: true });

    let changed = 0;
    for (const config of SAMPLE_CONFIGS) {
      const filePath = path.join(SAMPLES_DIR, config.file);
      const next = serializeSamplePlan(buildSamplePlan(config));
      const previous = await fs.readFile(filePath, "utf-8").catch(() => null);

      // Compare normalized text so a CRLF checkout is not rewritten needlessly
      if (previous !== null && normalizeEol(previous) === normalizeEol(next)) {
        console.log(`  unchanged  data/samples/${config.file}`);
        continue;
      }

      await fs.writeFile(filePath, next, "utf-8");
      changed += 1;
      console.log(`  ${previous === null ? "created  " : "updated  "}  data/samples/${config.file}`);
    }

    console.log(
      changed === 0
        ? "\nSamples are already up to date."
        : `\nRegenerated ${changed} sample file${changed === 1 ? "" : "s"}. Review the diff before committing.`
    );
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error("\nFailed to generate samples:\n", err);
  process.exitCode = 1;
});
