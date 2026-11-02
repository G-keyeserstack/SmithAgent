import { fileByPath, SHELL_COMMAND, useAgent, type Surface } from "@/lib/agent-store";
import { PAY_PATH, proposedDiff } from "@/lib/plans";
import { BillingLine, ColumnPill, ModelPicker } from "@/components/chrome";

export function DiffView() {
  const open = useAgent((state) => state.session.openDiff);
  const files = useAgent((state) => state.project.files);
  const source = fileByPath(files, PAY_PATH).text;
  const lines = proposedDiff(source);
  if (!open) {
    return (
      <div className="border border-dashed border-line bg-bone p-6 text-sm text-mute">
        The diff is closed. Start the Johannesburg job to open src/checkout/pay.ts.
      </div>
    );
  }
  return (
    <div className="overflow-hidden border border-line bg-ink text-bone">
      <div className="flex items-center justify-between gap-3 border-b border-line/40 px-3 py-2 text-xs">
        <span className="font-medium">src/checkout/pay.ts</span>
        <span>{source.includes("idempotencyKey") ? "In the file" : "Proposed"}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-6">
        {lines.map((line, index) => (
          <div
            key={`${line.kind}-${index}`}
            className={
              line.kind === "add" ? "bg-clay/30" : line.kind === "del" ? "bg-bone/10 line-through" : ""
            }
          >
            {line.kind === "add" ? "+ " : line.kind === "del" ? "- " : "  "}
            {line.text}
          </div>
        ))}
      </pre>
    </div>
  );
}

export function ShellCard({ surface }: { surface: Surface }) {
  const session = useAgent((state) => state.session);
  const approveShell = useAgent((state) => state.approveShell);
  const denyShell = useAgent((state) => state.denyShell);
  const locked = session.mode !== "act" || session.column === "queued";
  return (
    <section className="border border-line bg-paper p-3">
      <h3 className="text-sm font-semibold">Shell approval</h3>
      <pre className="mt-2 overflow-x-auto bg-ink p-3 text-xs text-bone">{SHELL_COMMAND}</pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={locked}
          onClick={() => approveShell(surface)}
          className="h-11 bg-ink px-4 text-sm text-bone disabled:opacity-40"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => denyShell(surface)}
          className="h-11 border border-line px-4 text-sm disabled:opacity-40"
        >
          Deny
        </button>
      </div>
      {session.shellOutput ? (
        <pre className="mt-3 whitespace-pre-wrap text-xs text-ink">{session.shellOutput}</pre>
      ) : (
        <p className="mt-3 text-xs text-mute">
          {session.mode === "plan" ? "Plan mode will not run this." : "Waiting for approval."}
        </p>
      )}
    </section>
  );
}

export function CheckpointList({ surface }: { surface: Surface }) {
  const checkpoints = useAgent((state) => state.session.checkpoints);
  const checkpoint = useAgent((state) => state.checkpoint);
  const restore = useAgent((state) => state.restore);
  return (
    <section className="border border-line bg-paper p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Checkpoints</h3>
        <button
          type="button"
          className="h-11 border border-line px-3 text-sm"
          onClick={() => checkpoint("before next edit", surface)}
        >
          Save checkpoint
        </button>
      </div>
      {checkpoints.length === 0 ? (
        <p className="mt-2 text-xs text-mute">None yet. A checkpoint can be restored from any surface.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {checkpoints.map((point) => (
            <li key={point.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {point.label}
                <span className="ml-2 text-xs text-mute">{point.id}</span>
              </span>
              <button type="button" className="h-11 px-2 text-clay" onClick={() => restore(point.id, surface)}>
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ModeSwitch({ surface }: { surface: Surface }) {
  const mode = useAgent((state) => state.session.mode);
  const setMode = useAgent((state) => state.setMode);
  return (
    <div className="flex h-11 overflow-hidden border border-line">
      {(["plan", "act"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => setMode(value, surface)}
          className={
            mode === value ? "bg-ink px-4 text-sm text-bone" : "bg-paper px-4 text-sm text-ink"
          }
        >
          {value === "plan" ? "Plan" : "Act"}
        </button>
      ))}
    </div>
  );
}

export function SessionActions({ surface }: { surface: Surface }) {
  const column = useAgent((state) => state.session.column);
  const hold = useAgent((state) => state.hold);
  const finish = useAgent((state) => state.finish);
  const resume = useAgent((state) => state.resume);
  const acceptDiff = useAgent((state) => state.acceptDiff);
  const mode = useAgent((state) => state.session.mode);
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={mode !== "act" || column === "queued"}
        onClick={() => acceptDiff(surface)}
        className="h-11 bg-clay px-4 text-sm text-bone disabled:opacity-40"
      >
        Accept diff
      </button>
      {column === "held" || column === "done" ? (
        <button type="button" onClick={() => resume(surface)} className="h-11 border border-line px-4 text-sm">
          Resume
        </button>
      ) : (
        <button
          type="button"
          disabled={column === "queued"}
          onClick={() => hold(surface)}
          className="h-11 border border-line px-4 text-sm disabled:opacity-40"
        >
          Hold
        </button>
      )}
      <button
        type="button"
        disabled={column === "queued" || column === "done"}
        onClick={() => finish(surface)}
        className="h-11 border border-ink px-4 text-sm disabled:opacity-40"
      >
        Finish
      </button>
    </div>
  );
}

export function SessionDesk({ surface, title }: { surface: Surface; title: string }) {
  const session = useAgent((state) => state.session);
  return (
    <section className="border border-line bg-paper">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-mute">{title}</p>
          <h2 className="font-display text-3xl leading-none">{session.title}</h2>
        </div>
        <ColumnPill column={session.column} />
      </header>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <div className="space-y-3">
          <p className="text-sm text-mute">{session.brief}</p>
          {session.mode === "plan" ? (
            <p className="border border-line bg-bone p-3 text-sm">
              Plan: add an idempotency key on the Rosebank charge so a retried checkout cannot double-settle.
              Act is required before the diff or the test command can run.
            </p>
          ) : null}
          <DiffView />
        </div>
        <div className="space-y-3">
          <BillingLine />
          <div className="flex flex-wrap items-center gap-2">
            <ModeSwitch surface={surface} />
            <ModelPicker surface={surface} />
          </div>
          <SessionActions surface={surface} />
          <ShellCard surface={surface} />
          <CheckpointList surface={surface} />
        </div>
      </div>
    </section>
  );
}
