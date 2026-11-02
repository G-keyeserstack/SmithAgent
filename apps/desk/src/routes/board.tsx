import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/chrome";
import { formatUsd, modelById, sessionCost, useAgent, type Column } from "@/lib/agent-store";

export const Route = createFileRoute("/board")({ component: BoardPage });

const COLUMNS: { id: Column; label: string }[] = [
  { id: "queued", label: "Queued" },
  { id: "running", label: "Running" },
  { id: "held", label: "Held" },
  { id: "done", label: "Done" },
];

function BoardPage() {
  const session = useAgent((state) => state.session);
  const model = modelById(session.modelId);
  const cost = sessionCost(session);

  return (
    <SiteFrame>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-5xl leading-none">Board</h1>
        <p className="mt-2 text-sm text-mute">
          Finish or hold the task from any surface and it moves. The card keeps the model that session bills.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => {
            const here = session.column === column.id;
            return (
              <section key={column.id} className="min-h-48 border border-line bg-paper p-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-mute">{column.label}</h2>
                {here ? (
                  <article className="mt-3 border border-ink bg-bone p-3">
                    <p className="text-xs uppercase tracking-wide text-clay">{session.location}</p>
                    <h3 className="mt-1 font-display text-2xl leading-none">{session.title}</h3>
                    <p className="mt-3 text-sm">{model.label}</p>
                    <p className="text-sm font-semibold">{formatUsd(cost)}</p>
                    <p className="mt-2 text-xs text-mute">
                      {session.mode === "plan" ? "Plan" : "Act"} · {session.surface}
                    </p>
                  </article>
                ) : (
                  <p className="mt-6 text-xs text-mute">Empty</p>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </SiteFrame>
  );
}
