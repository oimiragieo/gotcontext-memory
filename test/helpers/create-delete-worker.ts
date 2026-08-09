import { BASE_ABSENT, CasConflict, MemoryStore } from "../../src/store.js";

const [root, mode, baseHash, body] = process.argv.slice(2);
const store = new MemoryStore(root);
const rel = "memory/race-cd.md";
try {
  if (mode === "create") {
    await store.commitCanonical({
      relativePath: rel,
      body: body ?? "created\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "agent", source: "create-delete-worker" },
    });
  } else if (mode === "delete") {
    await store.deleteCanonical({
      relativePath: rel,
      baseHash: baseHash ?? BASE_ABSENT,
      provenance: { authored_by: "agent", source: "create-delete-worker" },
    });
  } else if (mode === "update") {
    await store.commitCanonical({
      relativePath: rel,
      body: body ?? "updated\n",
      baseHash: baseHash ?? BASE_ABSENT,
      provenance: { authored_by: "agent", source: "create-delete-worker" },
    });
  } else {
    process.stderr.write(`unknown mode ${mode}\n`);
    process.exit(2);
  }
  process.stdout.write("ok\n");
  process.exit(0);
} catch (err) {
  if (err instanceof CasConflict) {
    process.stdout.write("conflict\n");
    process.exit(1);
  }
  console.error(err);
  process.exit(2);
}
