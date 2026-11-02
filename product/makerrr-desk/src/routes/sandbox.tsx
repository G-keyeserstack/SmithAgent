import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { classifyCommand, reviewLists, type Verdict } from "@/lib/controls";
import { useAgent } from "@/lib/agent-store";

export const Route = createFileRoute("/sandbox")({ component: SandboxPage });

const MEANING: Record<Verdict, string> = {
  block: "Refused. The command does not run.",
  allow: "Allowed. It can run after the job is started and the mode is Act.",
  sandbox: "Sandboxed. The desk records the command and does not write the file or open the network.",
  ask: "Not on either list. Add it to the allow list, or turn auto-run on, before it can run.",
};

function SandboxPage() {
  const allow = useAgent((state) => state.project.allow);
  const block = useAgent((state) => state.project.block);
  const pending = useAgent((state) => state.project.pendingCommand);
  const output = useAgent((state) => state.session.shellOutput);
  const setList = useAgent((state) => state.setList);
  const setCommand = useAgent((state) => state.setCommand);
  const approveShell = useAgent((state) => state.approveShell);
  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState<"allow" | "block">("allow");
  const verdict = classifyCommand(pending, allow, block);
  const notes = reviewLists(allow, block);

  function add() {
    const next = draft.trim();
    if (!next) return;
    const current = target === "allow" ? allow : block;
    setList(target, [...current, next].join("\n"));
    setDraft("");
  }

  function remove(key: "allow" | "block", item: string) {
    const current = key === "allow" ? allow : block;
    setList(key, current.filter((entry) => entry !== item).join("\n"));
  }

  return (
    <SiteFrame>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-medium tracking-tight">Sandbox settings</h1>
        <p className="mt-3 text-sm leading-6 text-mute">
          These lists are the shell rules for this desk. They are not an operating-system container. A blocked command is refused. A sandboxed command is not executed.
        </p>
        <ol className="mt-6 space-y-3 text-sm leading-6">
          <li><strong>Block list first.</strong> If the command contains any blocked phrase, it is refused. This wins even when the same command also matches the allow list.</li>
          <li><strong>Allow list second.</strong> A matching phrase may run, but only after the job has started and the mode is Act. A short phrase matches too much, so keep entries specific, such as <span className="font-mono">bun test</span>.</li>
          <li><strong>Risky commands third.</strong> <span className="font-mono">curl</span>, <span className="font-mono">npm publish</span>, <span className="font-mono">git push --force</span>, <span className="font-mono">rm</span>, <span className="font-mono">sudo</span>, and a pipe into <span className="font-mono">sh</span> stay in the sandbox unless the block list already refused them.</li>
          <li><strong>Everything else asks.</strong> The command waits. It does not run on its own.</li>
        </ol>
        <section className="mt-8 rounded-2xl border border-line bg-paper p-4">
          <h2 className="text-lg font-medium">Try a command</h2>
          <textarea value={pending} onChange={(event) => setCommand(event.target.value)} className="mt-3 h-20 w-full rounded-lg border border-line bg-white p-2 font-mono text-xs" />
          <p className="mt-3 text-sm"><span className="font-medium capitalize">{verdict}.</span> {MEANING[verdict]}</p>
          <button type="button" onClick={() => approveShell("desktop")} className="mt-3 h-10 rounded-full bg-ink px-4 text-sm text-bone">Apply this verdict</button>
          {output ? <pre className="mt-3 overflow-x-auto text-xs text-mute">{output}</pre> : null}
        </section>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <List title="Allow list" items={allow} onRemove={(item) => remove("allow", item)} />
          <List title="Block list" items={block} onRemove={(item) => remove("block", item)} />
        </div>
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); add(); }}>
          <select value={target} onChange={(event) => setTarget(event.target.value as "allow" | "block")} className="h-10 rounded-full border border-line bg-white px-3 text-sm">
            <option value="allow">Allow</option>
            <option value="block">Block</option>
          </select>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="bun test" className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-3 text-sm" />
          <button type="submit" className="h-10 rounded-full border border-ink px-4 text-sm">Add</button>
        </form>
        {notes.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-clay">
            {notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        ) : <p className="mt-4 text-sm text-mute">The lists look specific, and the block list still wins a clash.</p>}
        <p className="mt-8 text-sm"><Link to="/controls" className="text-ink">Other desk controls</Link></p>
      </main>
    </SiteFrame>
  );
}

function List({ title, items, onRemove }: { title: string; items: string[]; onRemove: (item: string) => void }) {
  return (
    <section className="rounded-2xl border border-line p-4">
      <h2 className="font-medium">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? <li className="text-sm text-mute">Empty.</li> : null}
        {items.map((item) => (
          <li key={item} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-mono">{item}</span>
            <button type="button" onClick={() => onRemove(item)} className="text-mute">Remove</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
