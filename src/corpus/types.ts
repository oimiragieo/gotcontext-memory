export type ToolEvent = {
  name: string;
  isError?: boolean;
  transcript_id: string;
};

export type SkillInvocation = {
  skill: string;
  ts: string;
  transcript_id: string;
};

export type TranscriptTurn = {
  role: string;
  text: string;
  ts?: string;
  tool_events?: ToolEvent[];
  skill_invocations?: SkillInvocation[];
};

export type Transcript = {
  id: string;
  source: string;
  path: string;
  scope: "user" | "project";
  projectKey?: string;
  turns: TranscriptTurn[];
};

export type ScanLabel = "OK" | "EMPTY" | "PARTIAL" | "PARTIAL — no dogfood receipts";

export type ScanResult = {
  transcripts: Transcript[];
  scanned: number;
  included: number;
  excluded_permission: number;
  malformed: number;
  errors: Array<{ path: string; message: string }>;
  label: ScanLabel;
};

/** Honesty: OK only when at least one transcript was included. */
export function corpusScanLabel(scanned: number, included: number): ScanLabel {
  if (scanned === 0) return "EMPTY";
  if (included === 0) return "PARTIAL";
  return "OK";
}

export type ScanOpts = {
  cwd?: string;
  scope: "user" | "project";
  projectKey?: string;
  roots: string[];
};

export interface CorpusSource {
  name: string;
  scan(opts: ScanOpts): Promise<ScanResult>;
}
