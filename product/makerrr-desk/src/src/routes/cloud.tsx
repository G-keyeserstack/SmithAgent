import { createFileRoute, Link } from "@tanstack/react-router";
import { BillingLine, SiteFrame } from "@/components/chrome";
import { DiffView, ModeSwitch, SessionActions } from "@/components/session-desk";
import { useAgent } from "@/lib/agent-store";
import { planById } from "@/lib/plans";

export const Route = createFileRoute("/cloud")({ component: CloudPage });

const FAN = ["Webhook handler", "Cover the charge with a test", "Review the Rosebank settle"];

function CloudPage() {
  const session = useAgent((state) => state.session);
  const fleet = useAgent((state) => state.fleet);
  const notice = useAgent((state) => state.project.notice);
  const plan = planById(useAgent((state) => state.account.planId));
  const startJob = useAgent((state) => state.startJob);
  const spawnAgent = useAgent((state) => state.spawnAgent);
  const focusAgent = useAgent((state) => state.focusAgent);
  const cards = [
    { id: session.id, title: session.title, column: session.column, live: true },
    ...fleet.map((job) => ({ id: job.id, title: job.title, column: job.column, live: false })),
  ];

  return (
    <SiteFrame>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-mute">Mission control</p>
            <h1 className="mt-1 text-4xl font-medium tracking-tight">Cloud agents</h1>
          </div>
          <p className="text-sm text-mute">
            {plan.name} runs {plan.parallel} at a time. {cards.length} on the desk.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (!card.live) focusAgent(card.id, "cloud");
              }}
              className={`border p-4 text-left ${card.live ? "border-ink bg-paper" : "border-line bg-white"}`}
            >
              <p className="text-xs uppercase tracking-wide text-mute">{card.column}</p>
              <h2 className="mt-2 text-lg font-medium">{card.title}</h2>
              <p className="mt-2 text-xs text-mute">{card.live ? "Focused" : card.id}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {FAN.map((title) => (
            <button key={title} type="button" onClick={() => spawnAgent(title, "cloud")} className="h-11 border border-line px-3 text-sm">
              Fan out · {title}
            </button>
          ))}
          <button type="button" onClick={() => startJob("cloud")} className="h-11 bg-ink px-4 text-sm text-bone">
            {session.column === "queued" ? "Start focused task" : "Open the diff"}
          </button>
        </div>
        {notice ? <pre className="mt-4 whitespace-pre-wrap text-sm text-clay">{notice}</pre> : null}
        <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="border border-line bg-paper p-4">
            <p className="text-xs uppercase tracking-widest text-mute">Focused agent</p>
            <h2 className="mt-2 font-display text-3xl leading-none">{session.title}</h2>
            <p className="mt-3 text-sm text-mute">{session.brief}</p>
            <div className="mt-4">
              <BillingLine />
            </div>
            <Link to="/board" className="mt-4 inline-flex h-11 items-center text-sm text-clay">
              Board
            </Link>
          </aside>
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <ModeSwitch surface="cloud" />
              <SessionActions surface="cloud" />
            </div>
            <DiffView />
          </section>
        </div>
      </main>
    </SiteFrame>
  );
}
