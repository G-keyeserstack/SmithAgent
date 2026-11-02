import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { classifyCommand, FLOW, readFlow, ruleApplies, TOUR } from "@/lib/controls";
import { useAgent } from "@/lib/agent-store";
import { PAY_PATH } from "@/lib/plans";

export const Route = createFileRoute("/controls")({ component: ControlsPage });

function ControlsPage() {
  const project = useAgent((state) => state.project);
  const fleet = useAgent((state) => state.fleet);
  const session = useAgent((state) => state.session);
  const setCommand = useAgent((state) => state.setCommand);
  const setList = useAgent((state) => state.setList);
  const approveShell = useAgent((state) => state.approveShell);
  const steer = useAgent((state) => state.steer);
  const reclaimChats = useAgent((state) => state.reclaimChats);
  const toggleMotion = useAgent((state) => state.toggleMotion);
  const importSettings = useAgent((state) => state.importSettings);
  const tourNext = useAgent((state) => state.tourNext);
  const attachImage = useAgent((state) => state.attachImage);
  const spawnAgent = useAgent((state) => state.spawnAgent);
  const checkpoint = useAgent((state) => state.checkpoint);
  const restore = useAgent((state) => state.restore);
  const [steerText, setSteerText] = useState("");
  const [settings, setSettings] = useState('{"workbench.colorTheme":"Default Dark+","keybindings":[{"key":"ctrl+i"}]}');
  const [note, setNote] = useState("");
  const verdict = classifyCommand(project.pendingCommand, project.allow, project.block);
  const edges = readFlow(FLOW);
  const tour = TOUR[project.tourStep] ?? TOUR[0];
  const scoped = ruleApplies(`${project.rules}\nglobs: src/checkout/**`, PAY_PATH);

  function listen() {
    const speech = (window as unknown as { SpeechRecognition?: new () => { lang: string; onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null; start: () => void }; webkitSpeechRecognition?: new () => { lang: string; onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null; start: () => void } }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null; start: () => void } }).webkitSpeechRecognition;
    if (!speech) {
      setNote("This browser has no speech recognition.");
      return;
    }
    const heard = new speech();
    heard.lang = "en-ZA";
    heard.onresult = (event) => setSteerText(event.results[0][0].transcript);
    heard.start();
  }

  return (
    <SiteFrame>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-4xl font-medium tracking-tight">Desk controls</h1>
        <p className="mt-3 max-w-2xl text-sm text-mute">These change the same session as the IDE. A blocked command does not run. A sandboxed command does not write the file.</p>
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-lg font-medium">Terminal</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-mute">{verdict}</p>
            <textarea value={project.pendingCommand} onChange={(event) => setCommand(event.target.value)} className="mt-3 h-20 w-full rounded-lg border border-line bg-white p-2 font-mono text-xs" />
            <label className="mt-3 block text-xs text-mute">Allow, one prefix per line</label>
            <textarea value={project.allow.join("\n")} onChange={(event) => setList("allow", event.target.value)} className="mt-1 h-16 w-full rounded-lg border border-line bg-white p-2 text-xs" />
            <label className="mt-3 block text-xs text-mute">Block</label>
            <textarea value={project.block.join("\n")} onChange={(event) => setList("block", event.target.value)} className="mt-1 h-16 w-full rounded-lg border border-line bg-white p-2 text-xs" />
            <button type="button" onClick={() => setNote(approveShell("desktop"))} className="mt-3 h-10 rounded-full bg-ink px-4 text-sm text-bone">Run</button>
            <pre className="mt-3 overflow-x-auto text-xs text-mute">{session.shellOutput || "No output yet."}</pre>
          </article>
          <article className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-lg font-medium">Worktrees</h2>
            <p className="mt-1 text-sm text-mute">{fleet.length} of 8 branches. Each one keeps its own copy of the files.</p>
            <button type="button" onClick={() => setNote(spawnAgent("API refactor", "desktop"))} className="mt-3 h-10 rounded-full border border-ink px-4 text-sm">Open a worktree</button>
            <ul className="mt-3 space-y-1 text-sm">
              {fleet.map((job) => <li key={job.id}>{job.branch} · {job.column}</li>)}
            </ul>
            <h2 className="mt-6 text-lg font-medium">Steer and checkpoints</h2>
            <textarea value={steerText} onChange={(event) => setSteerText(event.target.value)} placeholder="Keep the key, but do not change the test." className="mt-2 h-16 w-full rounded-lg border border-line bg-white p-2 text-sm" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={listen} className="h-10 rounded-full border border-line px-3 text-sm">Voice</button>
              <button type="button" onClick={() => setNote(steer(steerText, "desktop"))} className="h-10 rounded-full bg-ink px-3 text-sm text-bone">Steer</button>
              <button type="button" onClick={() => setNote(checkpoint("before steer", "desktop"))} className="h-10 rounded-full border border-line px-3 text-sm">Checkpoint</button>
              <button type="button" onClick={() => setNote(restore(session.checkpoints[0]?.id ?? "", "desktop"))} className="h-10 rounded-full border border-line px-3 text-sm">Roll back</button>
            </div>
          </article>
          <article className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-lg font-medium">Rules and tour</h2>
            <p className="mt-2 text-sm">{scoped ? "The checkout glob matches pay.ts." : "This rule does not apply to the open file."}</p>
            <p className="mt-3 text-sm font-medium">{tour.title}</p>
            <p className="text-sm text-mute">{tour.body}</p>
            <button type="button" onClick={() => setNote(tourNext())} className="mt-3 h-10 rounded-full border border-ink px-4 text-sm">Next step</button>
            <h2 className="mt-6 text-lg font-medium">Charge flow</h2>
            <svg viewBox="0 0 360 80" className="mt-3 w-full" role="img" aria-label="Charge then key then settle">
              {edges.map((edge, index) => (
                <g key={`${edge.from}-${edge.to}`}>
                  <rect x={index * 120} y="16" width="88" height="36" rx="8" fill="#fff" stroke="#d8d2c6" />
                  <text x={index * 120 + 44} y="38" textAnchor="middle" fontSize="12">{edge.from}</text>
                </g>
              ))}
            </svg>
          </article>
          <article className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-lg font-medium">Import, image, and cleanup</h2>
            <textarea value={settings} onChange={(event) => setSettings(event.target.value)} className="mt-2 h-20 w-full rounded-lg border border-line bg-white p-2 font-mono text-xs" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setNote(importSettings(settings))} className="h-10 rounded-full bg-ink px-3 text-sm text-bone">Import VS Code JSON</button>
              <button type="button" onClick={() => setNote(reclaimChats())} className="h-10 rounded-full border border-line px-3 text-sm">Delete old chats</button>
              <button type="button" onClick={() => toggleMotion()} className="h-10 rounded-full border border-line px-3 text-sm">{project.reduceMotion ? "Motion off" : "Reduce motion"}</button>
            </div>
            <p className="mt-3 text-sm">{project.themeName ? `Theme: ${project.themeName}` : "No theme imported."}</p>
            <label className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-full border border-line px-3 text-sm">
              Attach an image
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => setNote(attachImage(event.target.files?.[0]?.name ?? ""))} />
            </label>
            <p className="mt-2 text-sm text-mute">{project.imageNote || "No image attached."}</p>
          </article>
        </section>
        {note ? <p className="mt-4 text-sm">{note}</p> : null}
      </main>
    </SiteFrame>
  );
}
