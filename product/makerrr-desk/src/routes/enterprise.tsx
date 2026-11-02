import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { useAgent } from "@/lib/agent-store";
import { planById } from "@/lib/plans";

export const Route = createFileRoute("/enterprise")({ component: EnterprisePage });

function EnterprisePage() {
  const account = useAgent((state) => state.account);
  const setFlag = useAgent((state) => state.setFlag);
  const setPlan = useAgent((state) => state.setPlan);
  const plan = planById(account.planId);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState("");

  function toggle(key: "privacy" | "autoRun" | "network" | "mcp" | "privateDeploy") {
    const result = setFlag(key, !account[key]);
    setSent(result);
  }

  return (
    <SiteFrame>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-5xl font-medium tracking-tight">Enterprise</h1>
        <p className="mt-3 text-sm text-mute">
          {plan.name} {plan.controls ? "can change auto-run, network, and MCP." : "cannot change those controls. Switch to Enterprise to turn them on."}
        </p>
        <div className="mt-8 space-y-3">
          {(
            [
              ["privacy", "Privacy mode", "Redact prompts in the call log."],
              ["autoRun", "Auto-run", "After a cloud or agent start in Act, run the test without a second click."],
              ["network", "Network", "Allow the test command. Off keeps the shell closed."],
              ["mcp", "MCP", "Allow file reads and writes from the agent."],
              ["privateDeploy", "Private deployment", "Keeps the shell on this desk. Quoted separately from the seat price."],
            ] as const
          ).map(([key, label, body]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className="flex w-full items-center justify-between gap-4 border border-line bg-paper px-4 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-mute">{body}</span>
              </span>
              <span className="text-sm">{account[key] ? "On" : "Off"}</span>
            </button>
          ))}
        </div>
        {sent ? <p className="mt-4 text-sm">{sent}</p> : null}
        <button type="button" onClick={() => setPlan("corporate-enterprise")} className="mt-6 h-11 bg-ink px-4 text-sm text-bone">
          Use Enterprise on this desk
        </button>
        <form
          className="mt-10 border border-line bg-paper p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!note.trim()) return;
            setSent(`Saved for the Johannesburg desk: ${note.trim()}`);
            setNote("");
          }}
        >
          <h2 className="text-lg font-medium">Request a demo</h2>
          <label className="mt-3 block text-sm" htmlFor="demo">
            What should the desk cover?
          </label>
          <textarea id="demo" value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-2 w-full border border-line p-2 text-sm" />
          <button type="submit" className="mt-3 h-11 border border-ink px-4 text-sm">
            Send
          </button>
        </form>
      </main>
    </SiteFrame>
  );
}
