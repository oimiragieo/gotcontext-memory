import { MemoryStore, BASE_ABSENT, CasConflict } from "../dist/store.js";

const [root, baseHash, body] = process.argv.slice(2);
const store = new MemoryStore(root);
try {
  await store.commitCanonical({
    relativePath: "memory/race.md",
    body,
    baseHash,
    provenance: { authored_by: "agent", source: "cas-worker" },
  });
  process.stdout.write("ok\n");
  process.exit(0);
} catch (err) {
  if (err instanceof CasConflict || err?.name === "CasConflict") {
    process.stdout.write("conflict\n");
    process.exit(1);
  }
  console.error(err);
  process.exit(2);
}
