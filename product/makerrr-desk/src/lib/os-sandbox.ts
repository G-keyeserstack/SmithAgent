import { createServerFn } from "@tanstack/react-start";
import { classifyCommand } from "@/lib/controls";

export const runIsolated = createServerFn({ method: "POST" })
  .validator((input: { command: string; allow: string[]; block: string[] }) => ({
    command: String(input.command ?? "").slice(0, 500),
    allow: Array.isArray(input.allow) ? input.allow.map(String).slice(0, 40) : [],
    block: Array.isArray(input.block) ? input.block.map(String).slice(0, 40) : [],
  }))
  .handler(async ({ data }) => {
    const verdict = classifyCommand(data.command, data.allow, data.block);
    if (verdict === "block") return { code: 126, output: "Refused by the block list. The operating system did not start it." };
    if (verdict === "ask") return { code: 126, output: "Not on the allow list. Add the phrase, or it will not start." };
    if (!data.command.trim()) return { code: 126, output: "There is no command to run." };
    const { executeIsolated } = await import("./os-sandbox.runtime");
    return executeIsolated(data.command);
  });
