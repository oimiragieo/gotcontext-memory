import YAML from "yaml";

export type Frontmatter = Record<string, unknown>;

export function parseFrontmatter(raw: string): {
  frontmatter: Frontmatter;
  body: string;
} {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) {
    return { frontmatter: {}, body: raw };
  }
  const end = raw.indexOf("\n---", 4);
  if (end < 0) return { frontmatter: {}, body: raw };
  const yamlBlock = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const parsed = (YAML.parse(yamlBlock) ?? {}) as Frontmatter;
  return { frontmatter: parsed, body };
}

export function serializeFrontmatter(frontmatter: Frontmatter, body: string): string {
  const yaml = YAML.stringify(frontmatter).trimEnd();
  return `---\n${yaml}\n---\n${body.startsWith("\n") ? body : `\n${body}`}`;
}
