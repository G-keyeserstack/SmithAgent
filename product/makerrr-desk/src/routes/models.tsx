import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/chrome";
import { MODELS, useAgent, type ModelId } from "@/lib/agent-store";
import { planById } from "@/lib/plans";

export const Route = createFileRoute("/models")({ component: ModelsPage });

const GROUPS: { title: string; body: string; id?: ModelId }[] = [
  { title: "Grok", body: "Default on Developer and above. Used for the agent and for Tab on this desk.", id: "grok-4" },
  { title: "Claude", body: "Sonnet for multi-file plans. Billed at list price on Pro and above.", id: "claude-sonnet" },
  { title: "GPT", body: "GPT-4o for the same composer. Billed at list price on Pro and above.", id: "gpt-4o" },
  { title: "Third-party", body: "Kimi bills at list price, outside the monthly plan.", id: "kimi-k3.1-pro" },
  { title: "Fast local", body: "Codestral is the open stand-in for a small completion model.", id: "codestral" },
  { title: "Ollama", body: "On-device. Free includes this and nothing else.", id: "ollama-local" },
  { title: "Bring your own key", body: "No key is sent from this desk. Pick a model and the session bills its list rate." },
];

function ModelsPage() {
  const setModel = useAgent((state) => state.setModel);
  const current = useAgent((state) => state.session.modelId);
  const plan = planById(useAgent((state) => state.account.planId));
  const notice = useAgent((state) => state.project.notice);
  return (
    <SiteFrame>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-5xl font-medium tracking-tight">Models</h1>
        <p className="mt-3 text-sm text-mute">
          {plan.name} can bill {plan.models.map((id) => MODELS.find((model) => model.id === id)?.label).join(", ")}.
        </p>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {GROUPS.map((group) => (
            <div key={group.title} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <h2 className="text-lg font-medium">{group.title}</h2>
                <p className="mt-1 max-w-lg text-sm text-mute">{group.body}</p>
              </div>
              {group.id ? (
                <button
                  type="button"
                  onClick={() => setModel(group.id as ModelId, "desktop")}
                  className="h-11 border border-line px-4 text-sm"
                >
                  {current === group.id ? "Billing now" : "Use"}
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {notice ? <p className="mt-4 text-sm text-clay">{notice}</p> : null}
      </main>
    </SiteFrame>
  );
}
