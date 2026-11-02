import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BillingLine, SiteFrame } from "@/components/chrome";
import { modelById, useAgent, type ModelId } from "@/lib/agent-store";

export const Route = createFileRoute("/cli")({ component: CliPage });

const MODELS: Record<string, ModelId> = {
  kimi: "kimi-k3.1-pro",
  grok: "grok-4",
  codestral: "codestral",
  ollama: "ollama-local",
};

function CliPage() {
  const session = useAgent((state) => state.session);
  const api = useAgent();
  const [line, setLine] = useState("");
  const [history, setHistory] = useState<string[]>([
    "makerrr — same agent as Desktop, IDE, Cloud, and the SDK",
    "try: start · plan · act · ask · diff · approve · review · hold · finish · status",
  ]);

  function push(text: string) {
    setHistory((items) => [...items, text].slice(-16));
  }

  function run(raw: string) {
    const text = raw.trim();
    if (!text) return;
    push(`$ ${text}`);
    const [command, ...rest] = text.split(/\s+/);
    const arg = rest.join(" ");
    const key = command.toLowerCase();
    if (key === "start") {
      api.startJob("cli");
      push("started Johannesburg session");
    } else if (key === "plan" || key === "act") {
      api.setMode(key, "cli");
      push(`mode ${key}`);
    } else if (key === "ask" || key === "edit") {
      push(api.composer(arg || "Add an idempotency key on the Rosebank charge", "cli"));
    } else if (key === "review") {
      push(api.runReview("cli"));
    } else if (key === "diff") {
      api.openDiff("cli");
      push("src/checkout/pay.ts");
    } else if (key === "approve") {
      push(api.approveShell("cli"));
    } else if (key === "deny") {
      push(api.denyShell("cli"));
    } else if (key === "hold") {
      api.hold("cli");
      push("moved to held");
    } else if (key === "finish") {
      api.finish("cli");
      push("moved to done");
    } else if (key === "resume") {
      api.resume("cli");
      push("running");
    } else if (key === "accept") {
      push(api.acceptDiff("cli"));
    } else if (key === "checkpoint") {
      const id = api.checkpoint(arg || "cli checkpoint", "cli");
      push(id);
    } else if (key === "restore") {
      push(api.restore(arg, "cli"));
    } else if (key === "model") {
      const id = MODELS[arg.toLowerCase()];
      if (!id) {
        push("model kimi | grok | codestral | ollama");
      } else {
        api.setModel(id, "cli");
        push(`billing ${modelById(id).label}`);
      }
    } else if (key === "status") {
      push(`${session.column} · ${session.mode} · ${session.location} · ${modelById(session.modelId).label}`);
    } else if (key === "help") {
      push("start plan act ask diff accept approve deny review checkpoint restore hold finish resume model status");
    } else {
      push(`unknown command: ${command}`);
    }
    setLine("");
  }

  return (
    <SiteFrame>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-5xl leading-none">CLI</h1>
        <p className="mt-2 text-sm text-mute">Commands hit the same Johannesburg session as every other surface.</p>
        <div className="mt-4">
          <BillingLine />
        </div>
        <div className="mt-4 border border-line bg-ink p-4 text-sm text-bone">
          <div className="space-y-1 font-mono text-xs leading-6">
            {history.map((entry, index) => (
              <p key={`${entry}-${index}`}>{entry}</p>
            ))}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(line);
            }}
          >
            <label className="sr-only" htmlFor="cli">
              Command
            </label>
            <input
              id="cli"
              value={line}
              onChange={(event) => setLine(event.target.value)}
              className="h-11 min-w-0 flex-1 bg-transparent font-mono text-sm text-bone outline-none"
              placeholder="start"
              autoComplete="off"
            />
            <button type="submit" className="h-11 bg-bone px-4 text-sm text-ink">
              Run
            </button>
          </form>
        </div>
      </main>
    </SiteFrame>
  );
}
