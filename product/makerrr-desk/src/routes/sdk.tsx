import { createFileRoute } from "@tanstack/react-router";
import { BillingLine, SiteFrame } from "@/components/chrome";
import { useAgent } from "@/lib/agent-store";

export const Route = createFileRoute("/sdk")({ component: SdkPage });

const CALLS: { label: string; run: "start" | "plan" | "act" | "diff" | "accept" | "approve" | "hold" | "finish" | "ask" | "review" }[] =
  [
    { label: 'agent.startJob()', run: "start" },
    { label: 'agent.setMode("plan")', run: "plan" },
    { label: 'agent.setMode("act")', run: "act" },
    { label: "agent.composer()", run: "ask" },
    { label: "agent.openDiff()", run: "diff" },
    { label: "agent.acceptDiff()", run: "accept" },
    { label: "agent.approveShell()", run: "approve" },
    { label: "agent.review()", run: "review" },
    { label: "agent.hold()", run: "hold" },
    { label: "agent.finish()", run: "finish" },
  ];

function SdkPage() {
  const calls = useAgent((state) => state.calls);
  const api = useAgent();

  function run(kind: (typeof CALLS)[number]["run"]) {
    if (kind === "start") api.startJob("sdk");
    if (kind === "plan") api.setMode("plan", "sdk");
    if (kind === "act") api.setMode("act", "sdk");
    if (kind === "diff") api.openDiff("sdk");
    if (kind === "accept") api.acceptDiff("sdk");
    if (kind === "approve") api.approveShell("sdk");
    if (kind === "hold") api.hold("sdk");
    if (kind === "finish") api.finish("sdk");
    if (kind === "ask") api.composer("Add an idempotency key on the Rosebank charge", "sdk");
    if (kind === "review") api.runReview("sdk");
  }

  return (
    <SiteFrame>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-5xl leading-none">SDK</h1>
        <p className="mt-2 max-w-xl text-sm text-mute">
          These are the same calls Desktop, IDE, CLI, and Cloud already use. The transcript updates from every surface.
        </p>
        <div className="mt-4">
          <BillingLine />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {CALLS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => run(item.run)}
              className="h-11 border border-line bg-paper px-3 text-left font-mono text-xs"
            >
              {item.label}
            </button>
          ))}
        </div>
        <ol className="mt-6 space-y-2">
          {calls.length === 0 ? (
            <li className="text-sm text-mute">No calls yet. Start the job here or from Cloud.</li>
          ) : (
            calls.map((entry) => (
              <li key={entry.id} className="border border-line bg-paper p-3 text-sm">
                <p className="font-mono text-xs text-clay">
                  {entry.surface} · {entry.call}
                </p>
                <p className="mt-1">{entry.detail}</p>
              </li>
            ))
          )}
        </ol>
      </main>
    </SiteFrame>
  );
}
