import { createFileRoute, Link } from "@tanstack/react-router";
import { BillingLine, SiteFrame } from "@/components/chrome";
import { DiffView, ModeSwitch, SessionActions } from "@/components/session-desk";
import { useAgent } from "@/lib/agent-store";

export const Route = createFileRoute("/cloud")({ component: CloudPage });

function CloudPage() {
  const session = useAgent((state) => state.session);
  const startJob = useAgent((state) => state.startJob);
  const notice = useAgent((state) => state.project.notice);

  return (
    <SiteFrame>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-widest text-mute">Default job</p>
          <h1 className="mt-2 font-display text-4xl leading-none">{session.title}</h1>
          <p className="mt-3 text-sm text-mute">{session.brief}</p>
          <p className="mt-3 text-sm font-semibold">Johannesburg</p>
          <div className="mt-4">
            <BillingLine />
          </div>
          <button
            type="button"
            onClick={() => startJob("cloud")}
            className="mt-5 h-11 w-full bg-ink text-sm text-bone"
          >
            {session.column !== "queued" ? "Open the diff" : "Start task"}
          </button>
          {notice ? <p className="mt-3 text-sm text-clay">{notice}</p> : null}
          <Link to="/board" className="mt-3 inline-flex h-11 items-center text-sm text-clay">
            View it on the board
          </Link>
        </aside>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <ModeSwitch surface="cloud" />
            <SessionActions surface="cloud" />
          </div>
          <DiffView />
          {!session.openDiff ? (
            <p className="text-sm text-mute">
              Start the task to open the checkout diff and move this session onto the Johannesburg board.
            </p>
          ) : null}
        </section>
      </main>
    </SiteFrame>
  );
}
