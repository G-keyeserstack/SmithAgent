import { useEffect, useRef, useState } from "react";
import { BillingLine, ColumnPill, ModelPicker } from "@/components/chrome";
import { CheckpointList, ModeSwitch, SessionActions, ShellCard } from "@/components/session-desk";
import { fileByPath, useAgent, type Surface } from "@/lib/agent-store";
import { chargeIsSafe, PAY_PATH, planById, tabGhost } from "@/lib/plans";

type Pane = "editor" | "preview" | "review";

export function Workbench({ surface, compact = false }: { surface: Surface; compact?: boolean }) {
  const session = useAgent((state) => state.session);
  const project = useAgent((state) => state.project);
  const account = useAgent((state) => state.account);
  const api = useAgent();
  const plan = planById(account.planId);
  const file = fileByPath(project.files, project.activePath || PAY_PATH);
  const ghost = tabGhost(file.text, plan.tab);
  const [pane, setPane] = useState<Pane>("editor");
  const [prompt, setPrompt] = useState("Add an idempotency key on the Rosebank charge");
  const [inline, setInline] = useState("");
  const [inlineOpen, setInlineOpen] = useState(false);
  const [mention, setMention] = useState("");
  const [heard, setHeard] = useState("");
  const [voice, setVoice] = useState<"idle" | "listening" | "speaking">("idle");
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setInlineOpen(true);
      }
      if (meta && event.key.toLowerCase() === "i") {
        event.preventDefault();
        document.getElementById("composer")?.focus();
      }
      if (meta && event.key.toLowerCase() === "l") {
        event.preventDefault();
        document.getElementById("composer")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setHeard("This browser cannot speak. The reply is still in the chat.");
      return;
    }
    const clean = text.replace(/\s+/g, " ").trim().slice(0, 420);
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const pick =
      voices.find((item) => item.lang === "en-ZA") ||
      voices.find((item) => item.lang.startsWith("en")) ||
      null;
    if (pick) utter.voice = pick;
    utter.rate = 1;
    utter.onstart = () => setVoice("speaking");
    utter.onend = () => setVoice("idle");
    utter.onerror = () => setVoice("idle");
    setVoice("speaking");
    window.speechSynthesis.speak(utter);
  }

  function stopVoice() {
    recRef.current?.stop?.();
    recRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setVoice("idle");
  }

  function listen() {
    const Host = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const Recognition = Host.SpeechRecognition || Host.webkitSpeechRecognition;
    if (!Recognition) {
      setHeard("This browser has no microphone recognition. Type the task, then use Read reply.");
      return;
    }
    stopVoice();
    const rec = new Recognition();
    recRef.current = rec;
    rec.lang = "en-ZA";
    rec.onresult = (event) => {
      const said = event.results[0]?.[0]?.transcript ?? "";
      setPrompt(said);
      setHeard(said);
      setVoice("idle");
      const full = mention ? `${said}\n${mention}` : said;
      const result = api.composer(full, surface);
      speak(result);
    };
    rec.onerror = () => {
      setVoice("idle");
      setHeard("Could not hear a task. Type it instead.");
    };
    rec.onend = () => {
      if (recRef.current === rec) recRef.current = null;
    };
    setVoice("listening");
    rec.start();
  }

  function runComposer() {
    const full = mention ? `${prompt}\n${mention}` : prompt;
    const result = api.composer(full, surface);
    speak(result);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-[#f7f6f2] shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1" aria-hidden="true">
            <i className="size-2.5 rounded-full bg-[#c9b2a6]" />
            <i className="size-2.5 rounded-full bg-line" />
            <i className="size-2.5 rounded-full bg-line" />
          </span>
          <p className="text-xs text-mute">Makerrr · {session.location}</p>
        </div>
        <ColumnPill column={session.column} />
      </header>
      <div className={`grid ${compact ? "" : "lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1.1fr)]"}`}>
        {compact ? null : (
          <aside className="border-b border-line p-3 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-semibold tracking-wide text-mute">
              {session.column === "done" || session.column === "held" ? "READY FOR REVIEW" : "IN PROGRESS"}
            </p>
            <button
              type="button"
              onClick={() => api.startJob(surface)}
              className="mt-2 w-full rounded-md bg-white px-2 py-2 text-left text-sm hover:bg-bone"
            >
              <span className="block font-medium">{session.title}</span>
              <span className="text-xs text-mute">{session.column}</span>
            </button>
            <p className="mt-4 text-[11px] font-semibold tracking-wide text-mute">FILES</p>
            <ul className="mt-2 space-y-1">
              {project.files.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => api.openFile(item.path)}
                    className={`w-full truncate rounded px-2 py-1 text-left text-xs ${item.path === file.path ? "bg-white" : ""}`}
                  >
                    {item.path.split("/").pop()}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => api.indexRepo(surface)} className="mt-4 h-10 w-full border border-line text-xs">
              {project.indexed ? "Reindex codebase" : "Index codebase"}
            </button>
            <p className="mt-2 text-[11px] text-mute">{project.indexed ? "Index is on." : "Search still scans files."}</p>
          </aside>
        )}
        <div className="border-b border-line p-3 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-2">
            <ModeSwitch surface={surface} />
            <ModelPicker surface={surface} />
          </div>
          <div className={`mt-3 space-y-2 overflow-auto ${compact ? "max-h-40" : "max-h-64"}`}>
            {(project.chat ?? []).length === 0 ? (
              <p className="text-sm text-mute">
                Agent is ready. Ask where payment is handled, or tell it to fix the charge. Ctrl+I focuses the composer.
              </p>
            ) : (
              (project.chat ?? []).slice(-8).map((line) => (
                <p key={line.id} className="whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-sm">
                  <span className="text-xs uppercase tracking-wide text-mute">{line.role}</span>
                  <span className="mt-1 block">{line.text}</span>
                </p>
              ))
            )}
          </div>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              runComposer();
            }}
          >
            <label className="sr-only" htmlFor="composer">
              Task
            </label>
            <textarea
              id="composer"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={compact ? 2 : 3}
              className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-1">
              {["@Files", "@Codebase", "@Docs", "@Git", "@Web"].map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setMention(token === "@Git" ? `@Git checkpoints:${session.checkpoints.length}` : token)}
                  className={`h-8 rounded-full border px-2 text-xs ${mention === token || (token === "@Git" && mention.startsWith("@Git")) ? "border-ink" : "border-line"}`}
                >
                  {token}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="h-11 bg-ink px-4 text-sm text-bone">
                Run agent
              </button>
              <button type="button" onClick={listen} className="h-11 border border-line px-3 text-sm">
                {voice === "listening" ? "Listening…" : "Voice"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const last = [...(project.chat ?? [])].reverse().find((line) => line.role === "agent");
                  speak(last?.text || "Nothing to read yet. Run the agent first.");
                }}
                className="h-11 border border-line px-3 text-sm"
              >
                {voice === "speaking" ? "Speaking…" : "Read reply"}
              </button>
              {voice !== "idle" ? (
                <button type="button" onClick={stopVoice} className="h-11 border border-line px-3 text-sm">
                  Stop
                </button>
              ) : null}
              <button type="button" onClick={() => api.composer("/security-audit", surface)} className="h-11 border border-line px-3 text-sm">
                /security-audit
              </button>
              <button type="button" onClick={() => setHeard(api.sandboxRun(surface))} className="h-11 border border-line px-3 text-sm">
                Sandbox
              </button>
              <button type="button" onClick={() => setHeard(api.delegateTests(surface))} className="h-11 border border-line px-3 text-sm">
                Subagent
              </button>
            </div>
            {heard ? <p className="text-xs text-mute">{heard}</p> : null}
            {project.notice ? <p className="text-sm text-clay">{project.notice}</p> : null}
          </form>
          {compact ? null : <div className="mt-3"><BillingLine /></div>}
        </div>
        <div className="p-3">
          <div className="flex gap-2">
            {(["editor", "preview", "review"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPane(item)}
                className={`h-9 px-2 text-xs ${pane === item ? "border-b-2 border-ink" : "text-mute"}`}
              >
                {item === "editor" ? file.path.split("/").pop() : item === "preview" ? "Browser" : "Review"}
              </button>
            ))}
          </div>
          {pane === "editor" ? (
            <div className="mt-2">
              {inlineOpen ? (
                <form
                  className="mb-2 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setHeard(api.inlineEdit(inline, surface));
                    setInlineOpen(false);
                  }}
                >
                  <input
                    value={inline}
                    onChange={(event) => setInline(event.target.value)}
                    placeholder="Inline edit the charge"
                    className="h-11 min-w-0 flex-1 border border-line bg-white px-2 text-sm"
                  />
                  <button type="submit" className="h-11 bg-ink px-3 text-sm text-bone">
                    Apply
                  </button>
                </form>
              ) : (
                <button type="button" onClick={() => setInlineOpen(true)} className="mb-2 text-xs text-mute">
                  Ctrl+K inline edit
                </button>
              )}
              <p className="mb-2 text-xs text-mute">
                The agent does not guess a whole file. It finds <span className="font-mono">gateway.charge(order.total)</span> and
                writes the idempotency key onto that line. Tab does the same insert. A webhook request adds a second file.
              </p>
              {ghost ? (
                <p className="mb-2 rounded bg-white px-2 py-1 font-mono text-xs text-mute">
                  Tab inserts <span className="text-clay">{ghost}</span>
                </p>
              ) : null}
              <textarea
                value={file.text}
                spellCheck={false}
                onChange={(event) => api.updateFile(file.path, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Tab" && ghost) {
                    event.preventDefault();
                    setHeard(api.acceptTab(surface));
                  }
                }}
                className="h-48 w-full resize-none rounded-lg border border-line bg-[#1c1b19] p-3 font-mono text-xs leading-5 text-[#f3f0e7]"
              />
              <div className="mt-2">
                <SessionActions surface={surface} />
              </div>
            </div>
          ) : null}
          {pane === "preview" ? <BrowserPane source={fileByPath(project.files, PAY_PATH).text} log={session.shellOutput} /> : null}
          {pane === "review" ? (
            <div className="mt-3 space-y-2 text-sm">
              <button type="button" onClick={() => api.runReview(surface)} className="h-11 border border-line px-3">
                Run review
              </button>
              {project.reviews.length === 0 ? (
                <p className="text-mute">No open notes.</p>
              ) : (
                project.reviews.map((note) => (
                  <article key={note.id} className="border border-line bg-white p-3">
                    <p className="text-xs text-mute">
                      {note.path}:{note.line}
                    </p>
                    <p className="mt-1">{note.text}</p>
                    <button type="button" className="mt-2 text-clay" onClick={() => api.acceptDiff(surface)}>
                      Apply fix
                    </button>
                  </article>
                ))
              )}
              <p className="text-xs text-mute">PR #18 · Rosebank checkout · review posts here, not to GitHub.</p>
            </div>
          ) : null}
        </div>
      </div>
      {compact ? null : (
        <div className="grid gap-3 border-t border-line p-3 lg:grid-cols-3">
          <ShellCard surface={surface} />
          <CheckpointList surface={surface} />
          <RulesPane />
        </div>
      )}
    </section>
  );
}

function BrowserPane({ source, log }: { source: string; log: string }) {
  const safe = chargeIsSafe(source);
  return (
    <div className="mt-3 space-y-3">
      <div className="flex h-9 items-center rounded-full border border-line bg-white px-3 text-xs text-mute">
        http://localhost:3000
      </div>
      <div className="rounded-lg border border-line bg-white p-4">
        <p className="font-display text-3xl leading-none">Rosebank</p>
        <p className="mt-2 text-sm text-mute">Order rosebank-18 · R240</p>
        <p className="mt-3 text-sm">{safe ? "Settle is idempotent." : "A retry can charge this order twice."}</p>
        <button type="button" className="mt-4 h-11 bg-ink px-4 text-sm text-bone" disabled>
          Pay
        </button>
      </div>
      <div>
        <p className="text-xs font-semibold text-mute">Network</p>
        <pre className="mt-1 overflow-x-auto bg-[#1c1b19] p-2 text-xs text-[#f3f0e7]">
          {safe ? "POST /charge  idempotencyKey=rosebank-18" : "POST /charge  (no key)"}
        </pre>
      </div>
      <div>
        <p className="text-xs font-semibold text-mute">Console</p>
        <pre className="mt-1 whitespace-pre-wrap text-xs text-mute">{log || "No test output yet."}</pre>
      </div>
    </div>
  );
}

function RulesPane() {
  const rules = useAgent((state) => state.project.rules);
  const setRules = useAgent((state) => state.setRules);
  const formatHook = useAgent((state) => state.project.formatHook);
  const secretHook = useAgent((state) => state.project.secretHook);
  const setHook = useAgent((state) => state.setHook);
  const installRule = useAgent((state) => state.installRule);
  const [pack, setPack] = useState("Name money in rand. Do not invent a second charge call.");
  return (
    <section className="border border-line bg-white p-3">
      <h3 className="text-sm font-semibold">Rules and hooks</h3>
      <textarea
        value={rules}
        onChange={(event) => setRules(event.target.value)}
        rows={5}
        className="mt-2 w-full border border-line p-2 font-mono text-xs"
      />
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={formatHook} onChange={(event) => setHook("formatHook", event.target.checked)} />
        Format after edit
      </label>
      <label className="mt-1 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={secretHook} onChange={(event) => setHook("secretHook", event.target.checked)} />
        Block secrets in prompts
      </label>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          installRule(pack, "ide");
        }}
      >
        <input value={pack} onChange={(event) => setPack(event.target.value)} className="h-11 min-w-0 flex-1 border border-line px-2 text-xs" />
        <button type="submit" className="h-11 border border-line px-2 text-xs">
          Install
        </button>
      </form>
    </section>
  );
}

type SpeechRec = {
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void;
  onerror: () => void;
  onend: () => void;
};
