import { acceptProposal } from "../../src/review.js";
import { MemoryStore } from "../../src/store.js";

const [root, proposalId] = process.argv.slice(2);
const store = new MemoryStore(root);
try {
  await acceptProposal(store, proposalId);
  process.stdout.write("ok\n");
  process.exit(0);
} catch (err) {
  process.stdout.write(`err:${(err as Error).name}:${(err as Error).message}\n`);
  process.exit(1);
}
