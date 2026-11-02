export type Verdict = "allow" | "ask" | "sandbox" | "block";

const RISKY = [/curl\s+\S+/i, /\bnpm\s+publish\b/, /\bgit\s+push\s+--force\b/, /\brm\b/, /\bsudo\b/, /\|\s*sh\b/];

export function classifyCommand(command: string, allow: string[], block: string[]): Verdict {
  const text = command.trim();
  if (block.some((item) => item.trim() && text.includes(item.trim()))) return "block";
  if (allow.some((item) => item.trim() && text.includes(item.trim()))) return "allow";
  if (RISKY.some((pattern) => pattern.test(text))) return "sandbox";
  return "ask";
}

export function ruleApplies(rules: string, path: string): boolean {
  const globs = [...rules.matchAll(/^globs:\s*(.+)$/gm)].map((match) => match[1].trim());
  if (globs.length === 0) return true;
  return globs.some((glob) => {
    const prefix = glob.replace(/\*.*$/, "").replace(/\/$/, "");
    return prefix.length === 0 || path.startsWith(prefix);
  });
}

export function readFlow(source: string): { from: string; to: string }[] {
  return [...source.matchAll(/([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/g)].map((match) => ({
    from: match[1],
    to: match[2],
  }));
}

export const FLOW = `flowchart TD
  Charge --> Key
  Key --> Settle
  Settle --> Receipt`;

export const TOUR = [
  { path: "src/checkout/pay.ts", title: "The charge", body: "This is the file the agent edits. The idempotency key stops a retry from settling twice." },
  { path: "src/checkout/pay.test.ts", title: "The test", body: "The shell runs this test. A blocked command never reaches it." },
  { path: ".makerrrrules", title: "The rules", body: "A glob can limit a rule to src/checkout. Other files do not inherit it." },
];

export function reclaim(lines: { id: string }[], keep = 2) {
  const removed = Math.max(0, lines.length - keep);
  return { kept: lines.slice(-keep), removed };
}

export function readSettings(raw: string): { theme: string; keys: number } | { error: string } {
  try {
    const parsed = JSON.parse(raw) as { "workbench.colorTheme"?: string; keybindings?: unknown[] };
    const theme = typeof parsed["workbench.colorTheme"] === "string" ? parsed["workbench.colorTheme"] : "Default Dark+";
    const keys = Array.isArray(parsed.keybindings) ? parsed.keybindings.length : 0;
    return { theme, keys };
  } catch {
    return { error: "That is not VS Code settings JSON." };
  }
}
