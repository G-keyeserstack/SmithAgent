import { chargeIsSafe, PAY_PATH, runCheckoutTest } from "@/lib/plans";
import type { ProjectFile } from "@/lib/agent-store";

export const PACKS = [
  {
    id: "checkout-guard",
    name: "Checkout guard",
    kind: "Rules",
    body: "globs: src/checkout/**\nA retried charge must send the same idempotency key.",
  },
  {
    id: "format-hook",
    name: "Format hook",
    kind: "Hook",
    body: "hook: format\nFormat the file before it is written.",
  },
  {
    id: "secret-hook",
    name: "Secret hook",
    kind: "Hook",
    body: "hook: secret\nRefuse to write a line that looks like a live key.",
  },
] as const;

export const HUBS = ["Netlify", "DigitalOcean", "Docker", "Turso"] as const;

export function shadowResult(files: ProjectFile[], rules: string) {
  const file = files.find((item) => item.path === PAY_PATH);
  const result = runCheckoutTest(file?.text ?? "", rules);
  return `Shadow workspace\n${result.output}\nThe open editor was not changed.`;
}

export function reviewPull(files: ProjectFile[]) {
  const file = files.find((item) => item.path === PAY_PATH);
  if (chargeIsSafe(file?.text ?? "")) return "Low risk. The charge is idempotent, so this change can be approved.";
  return "Needs a reviewer. A retry can settle the charge twice. The agent will not auto-approve it.";
}

export function triageLog(output: string, safe: boolean) {
  if (!output.trim()) return "No build log yet. Run the shell or the shadow workspace first.";
  if (safe && !/fail|error/i.test(output)) return "The last run is green. Nothing to patch.";
  return "The log fails the double-settle case. Add the idempotency key in src/checkout/pay.ts and run the test again.";
}
