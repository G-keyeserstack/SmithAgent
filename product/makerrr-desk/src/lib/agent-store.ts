import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DOCS, polish, searchProject, WEBHOOK_PATH, WEBHOOK_SOURCE } from "@/lib/search";
import {
  applyIdempotency,
  PAY_ORIGINAL,
  PAY_PATH,
  planById,
  reviewFile,
  RULES_DEFAULT,
  rulesBlockEdit,
  runCheckoutTest,
  TEST_PATH,
  TEST_SOURCE,
  type ModelId,
  type PlanId,
  type Region,
  type ReviewNote,
} from "@/lib/plans";

export type { ModelId };
export type Mode = "plan" | "act" | "ask";
export type Column = "queued" | "running" | "held" | "done";
export type ShellStatus = "pending" | "approved" | "denied";
export type Surface = "cloud" | "desktop" | "ide" | "cli" | "sdk";
export type DeskOs = "mac" | "windows" | "linux";

export const MODELS: {
  id: ModelId;
  label: string;
  inputPerM: number;
  outputPerM: number;
  kind: "grok" | "local" | "third-party";
}[] = [
  { id: "kimi-k3.1-pro", label: "Kimi K3.1 Pro", inputPerM: 2.4, outputPerM: 8, kind: "third-party" },
  { id: "grok-4", label: "Grok 4", inputPerM: 3, outputPerM: 15, kind: "grok" },
  { id: "codestral", label: "Codestral", inputPerM: 0.3, outputPerM: 0.9, kind: "third-party" },
  { id: "ollama-local", label: "Ollama local", inputPerM: 0, outputPerM: 0, kind: "local" },
];

export const SHELL_COMMAND = "bun test src/checkout/pay.test.ts";

export type ProjectFile = { path: string; text: string };

export type Checkpoint = {
  id: string;
  label: string;
  at: number;
  mode: Mode;
  shellStatus: ShellStatus;
  diffAccepted: boolean;
  column: Column;
  files: ProjectFile[];
  rules: string;
};

export type CallLog = {
  id: string;
  at: number;
  surface: Surface;
  call: string;
  detail: string;
};

export type Session = {
  id: string;
  title: string;
  brief: string;
  location: string;
  column: Column;
  modelId: ModelId;
  mode: Mode;
  surface: Surface;
  openDiff: boolean;
  diffAccepted: boolean;
  inputTokens: number;
  outputTokens: number;
  shellStatus: ShellStatus;
  shellOutput: string;
  checkpoints: Checkpoint[];
  charged: { start: boolean; diff: boolean; shell: boolean };
};

export type Account = {
  signedIn: boolean;
  name: string;
  planId: PlanId;
  region: Region;
  teamSeats: number;
  requestsUsed: number;
  privacy: boolean;
  autoRun: boolean;
  network: boolean;
  mcp: boolean;
  privateDeploy: boolean;
};

export type FleetJob = {
  id: string;
  title: string;
  brief: string;
  column: Column;
  mode: Mode;
  branch: string;
  files: ProjectFile[];
  surface: Surface;
};

export type ChatLine = { id: string; role: "you" | "agent"; text: string };

export type Project = {
  files: ProjectFile[];
  rules: string;
  notepad: string;
  indexed: boolean;
  reviews: ReviewNote[];
  notice: string;
  activePath: string;
  chat: ChatLine[];
  formatHook: boolean;
  secretHook: boolean;
};

type AgentState = {
  session: Session;
  account: Account;
  project: Project;
  fleet: FleetJob[];
  calls: CallLog[];
  startJob: (surface: Surface) => string;
  setModel: (id: ModelId, surface: Surface) => string;
  setMode: (mode: Mode, surface: Surface) => void;
  openDiff: (surface: Surface) => void;
  acceptDiff: (surface: Surface) => string;
  approveShell: (surface: Surface) => string;
  denyShell: (surface: Surface) => string;
  checkpoint: (label: string, surface: Surface) => string;
  restore: (id: string, surface: Surface) => string;
  hold: (surface: Surface) => void;
  finish: (surface: Surface) => void;
  resume: (surface: Surface) => void;
  signIn: (name: string) => void;
  signOut: () => void;
  setPlan: (id: PlanId) => string;
  setRegion: (region: Region) => void;
  setTeamSeats: (seats: number) => void;
  spawnAgent: (title: string, surface: Surface) => string;
  focusAgent: (id: string, surface: Surface) => string;
  sandboxRun: (surface: Surface) => string;
  printState: (surface: Surface) => string;
  delegateTests: (surface: Surface) => string;
  updateFile: (path: string, text: string) => void;
  openFile: (path: string) => void;
  setRules: (rules: string) => void;
  setNotepad: (text: string) => void;
  acceptTab: (surface: Surface) => string;
  inlineEdit: (instruction: string, surface: Surface) => string;
  runReview: (surface: Surface) => string;
  indexRepo: (surface: Surface) => string;
  installRule: (pack: string, surface: Surface) => string;
  setFlag: (key: "privacy" | "autoRun" | "network" | "mcp" | "privateDeploy", value: boolean) => string;
  readFile: (surface: Surface) => string;
  composer: (prompt: string, surface: Surface) => string;
  setHook: (key: "formatHook" | "secretHook", value: boolean) => void;
};

function freshFiles(): ProjectFile[] {
  return [
    { path: PAY_PATH, text: PAY_ORIGINAL },
    { path: TEST_PATH, text: TEST_SOURCE },
  ];
}

function freshSession(): Session {
  return {
    id: "jhb-rosebank",
    title: "Build the landing page",
    brief: "Open the charge path, show the diff, and keep the session on the board.",
    location: "Desk",
    column: "queued",
    modelId: "grok-4",
    mode: "plan",
    surface: "cloud",
    openDiff: false,
    diffAccepted: false,
    inputTokens: 0,
    outputTokens: 0,
    shellStatus: "pending",
    shellOutput: "",
    checkpoints: [],
    charged: { start: false, diff: false, shell: false },
  };
}

function freshAccount(): Account {
  return {
    signedIn: true,
    name: "",
    planId: "pro",
    region: "za",
    teamSeats: 5,
    requestsUsed: 0,
    privacy: false,
    autoRun: false,
    network: true,
    mcp: true,
    privateDeploy: false,
  };
}

function freshProject(): Project {
  return {
    files: freshFiles(),
    rules: RULES_DEFAULT,
    notepad: "Rosebank retries the same order id when the card network times out.",
    indexed: false,
    reviews: [],
    notice: "",
    activePath: PAY_PATH,
    chat: [],
    formatHook: true,
    secretHook: true,
  };
}

export function modelById(id: ModelId) {
  return MODELS.find((model) => model.id === id) ?? MODELS[1];
}

export function fileByPath(files: ProjectFile[], path: string) {
  return files.find((file) => file.path === path) ?? files[0];
}

export function sessionCost(session: Pick<Session, "modelId" | "inputTokens" | "outputTokens">) {
  const model = modelById(session.modelId);
  return (
    (session.inputTokens / 1_000_000) * model.inputPerM +
    (session.outputTokens / 1_000_000) * model.outputPerM
  );
}

export function formatUsd(amount: number) {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}

function stamp(surface: Surface, call: string, detail: string): CallLog {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    surface,
    call,
    detail,
  };
}

function logDetail(account: Account, detail: string) {
  return account.privacy ? "Redacted. Privacy mode is on for this desk." : detail;
}

export const useAgent = create<AgentState>()(
  persist(
    (set, get) => {
      function push(surface: Surface, call: string, detail: string) {
        set({
          calls: [stamp(surface, call, logDetail(get().account, detail)), ...get().calls].slice(0, 24),
        });
      }

      function gate(surface: Surface, call: string): string | null {
        const { account } = get();
        const plan = planById(account.planId);
        if (account.requestsUsed >= plan.requests) {
          const detail = `${plan.name} has used ${account.requestsUsed} of ${plan.requests} requests.`;
          push(surface, call, detail);
          set({ project: { ...get().project, notice: detail } });
          return detail;
        }
        return null;
      }

      function spend() {
        set({ account: { ...get().account, requestsUsed: get().account.requestsUsed + 1 } });
      }

      function writePay(next: string) {
        const project = get().project;
        const text = polish(next, project.formatHook);
        set({
          project: {
            ...project,
            files: project.files.map((file) => (file.path === PAY_PATH ? { ...file, text } : file)),
            reviews: reviewFile(text),
          },
        });
      }

      function talk(role: "you" | "agent", text: string) {
        const project = get().project;
        const line = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role,
          text,
        };
        set({ project: { ...get().project, chat: [...project.chat, line].slice(-40) } });
      }

      return {
        session: freshSession(),
        account: freshAccount(),
        project: freshProject(),
        fleet: [],
        calls: [],
        startJob: (surface) => {
          const blocked = gate(surface, "agent.startJob()");
          if (blocked) return blocked;
          const plan = planById(get().account.planId);
          if (surface === "cloud" && !plan.cloud) {
            const detail = "Cloud agents start on Premium. This desk is on " + plan.name + ".";
            push(surface, "agent.startJob()", detail);
            set({ project: { ...get().project, notice: detail } });
            return detail;
          }
          const current = get().session;
          const first = !current.charged.start;
          if (first) spend();
          const session: Session = {
            ...current,
            column: "running",
            surface,
            openDiff: true,
            inputTokens: current.inputTokens + (first ? 2400 : 0),
            outputTokens: current.outputTokens + (first ? 420 : 0),
            charged: { ...current.charged, start: true },
          };
          set({ session, project: { ...get().project, notice: "" } });
          push(
            surface,
            "agent.startJob()",
            first
              ? "Opened src/checkout/pay.ts and moved this session to Running."
              : "Diff already open. This session stays on the board.",
          );
          if (get().account.autoRun && session.mode === "act" && get().account.network) {
            return get().approveShell(surface);
          }
          return "Started.";
        },
        setModel: (id, surface) => {
          const plan = planById(get().account.planId);
          const model = modelById(id);
          if (!plan.models.includes(id)) {
            const detail = `${model.label} is not on ${plan.name}. Plus is Grok models only.`;
            push(surface, `agent.setModel("${id}")`, detail);
            set({ project: { ...get().project, notice: detail } });
            return detail;
          }
          if (model.kind === "third-party" && !plan.thirdParty) {
            const detail = "Third-party models are billed on Premium and above, separate from the monthly price.";
            push(surface, `agent.setModel("${id}")`, detail);
            return detail;
          }
          set({ session: { ...get().session, modelId: id } });
          const extra = model.kind === "third-party" ? " Billed at API list price, outside the plan." : "";
          push(surface, `agent.setModel("${id}")`, `This session now bills ${model.label}.${extra}`);
          return model.label;
        },
        setMode: (mode, surface) => {
          set({ session: { ...get().session, mode, surface } });
          push(
            surface,
            `agent.setMode("${mode}")`,
            mode === "act"
              ? "Agent mode can edit files and approve the shell."
              : mode === "ask"
                ? "Ask is read-only. It will not change a file."
                : "Plan only. The diff and shell stay locked.",
          );
        },
        openDiff: (surface) => {
          set({ session: { ...get().session, openDiff: true, surface } });
          push(surface, "agent.openDiff()", "Showing src/checkout/pay.ts.");
        },
        acceptDiff: (surface) => {
          const current = get().session;
          if (current.mode !== "act") return "Switch to Act before accepting the diff.";
          if (current.column === "queued") return "Start the this job first.";
          const project = get().project;
          if (!get().account.mcp) return "MCP writes are off. Turn them on under Enterprise.";
          if (rulesBlockEdit(project.rules)) return "Rules block edits to pay.ts.";
          const blocked = gate(surface, "agent.acceptDiff()");
          if (blocked) return blocked;
          const file = fileByPath(project.files, PAY_PATH);
          const next = applyIdempotency(file.text);
          if (next === file.text) return "Nothing to apply. The charge already has an idempotency key.";
          const first = !current.charged.diff;
          if (first) spend();
          writePay(next);
          set({
            session: {
              ...get().session,
              surface,
              openDiff: true,
              diffAccepted: true,
              inputTokens: current.inputTokens + (first ? 400 : 0),
              outputTokens: current.outputTokens + (first ? 160 : 0),
              charged: { ...current.charged, diff: true },
            },
          });
          push(surface, "agent.acceptDiff()", "Idempotency key written into src/checkout/pay.ts.");
          return "Diff accepted.";
        },
        approveShell: (surface) => {
          const current = get().session;
          if (current.mode !== "act" && !get().account.autoRun) return "Switch to Act before approving the shell.";
          if (current.column === "queued") return "Start the this job first.";
          if (!get().account.network) return "Network is off for this desk. The test runner stays closed.";
          const blocked = gate(surface, "agent.approveShell()");
          if (blocked) return blocked;
          const project = get().project;
          const file = fileByPath(project.files, PAY_PATH);
          const result = runCheckoutTest(file.text, project.rules);
          const first = !current.charged.shell;
          if (first) spend();
          set({
            session: {
              ...current,
              surface,
              shellStatus: result.ok ? "approved" : "denied",
              shellOutput: result.output,
              inputTokens: current.inputTokens + (first ? 600 : 0),
              outputTokens: current.outputTokens + (first ? 220 : 0),
              charged: { ...current.charged, shell: true },
            },
          });
          push(surface, "agent.approveShell()", result.ok ? SHELL_COMMAND : result.output);
          return result.ok ? "Shell approved." : "Tests failed.";
        },
        denyShell: (surface) => {
          const current = get().session;
          if (current.column === "queued") return "Start the this job first.";
          set({
            session: {
              ...current,
              surface,
              shellStatus: "denied",
              shellOutput: "Denied. The command did not run.",
            },
          });
          push(surface, "agent.denyShell()", "Checkout tests were not run.");
          return "Shell denied.";
        },
        checkpoint: (label, surface) => {
          const current = get().session;
          const project = get().project;
          const name = label.trim() || "checkpoint";
          const point: Checkpoint = {
            id: `cp-${Date.now().toString(36)}`,
            label: name,
            at: Date.now(),
            mode: current.mode,
            shellStatus: current.shellStatus,
            diffAccepted: current.diffAccepted,
            column: current.column,
            files: project.files.map((file) => ({ ...file })),
            rules: project.rules,
          };
          set({
            session: { ...current, surface, checkpoints: [point, ...current.checkpoints].slice(0, 8) },
          });
          push(surface, `agent.checkpoint("${name}")`, "Saved the files so they can be restored.");
          return point.id;
        },
        restore: (id, surface) => {
          const current = get().session;
          const point = current.checkpoints.find((item) => item.id === id || item.id.startsWith(id));
          if (!point) return "No checkpoint with that id.";
          const files = point.files?.length ? point.files : get().project.files;
          set({
            session: {
              ...current,
              surface,
              mode: point.mode,
              shellStatus: point.shellStatus,
              shellOutput: "",
              diffAccepted: point.diffAccepted,
              column: point.column,
              openDiff: true,
            },
            project: {
              ...get().project,
              files,
              rules: point.rules || get().project.rules,
              reviews: reviewFile(fileByPath(files, PAY_PATH).text),
            },
          });
          push(surface, `agent.restore("${point.id}")`, `Restored “${point.label}”.`);
          return `Restored ${point.label}.`;
        },
        hold: (surface) => {
          const current = get().session;
          if (current.column === "queued") return;
          set({ session: { ...current, column: "held", surface } });
          push(surface, "agent.hold()", "This session moved to Held.");
        },
        finish: (surface) => {
          const current = get().session;
          if (current.column === "queued") return;
          set({ session: { ...current, column: "done", surface, openDiff: true } });
          push(surface, "agent.finish()", "This session moved to Done.");
        },
        resume: (surface) => {
          const current = get().session;
          set({ session: { ...current, column: "running", surface, openDiff: true } });
          push(surface, "agent.resume()", "This session is running again.");
        },
        signIn: (name) => {
          const cleaned = name.trim() || "your desk";
          set({ account: { ...get().account, signedIn: true, name: cleaned } });
        },
        signOut: () => {
          set({ account: { ...get().account, signedIn: false, name: "" } });
        },
        setPlan: (id) => {
          const plan = planById(id);
          const session = get().session;
          const nextModel = plan.models.includes(session.modelId) ? session.modelId : plan.models[0];
          set({
            account: { ...get().account, planId: id, requestsUsed: 0 },
            session: { ...session, modelId: nextModel },
            project: { ...get().project, notice: `${plan.name} is the plan on this desk.` },
          });
          return plan.name;
        },
        updateFile: (path, text) => {
          const project = get().project;
          const nextText = polish(text, project.formatHook);
          const files = project.files.some((file) => file.path === path)
            ? project.files.map((file) => (file.path === path ? { ...file, text: nextText } : file))
            : [...project.files, { path, text: nextText }];
          const pay = fileByPath(files, PAY_PATH).text;
          set({
            project: { ...project, files, activePath: path, reviews: reviewFile(pay) },
            session: {
              ...get().session,
              diffAccepted: pay.includes("idempotencyKey"),
              openDiff: true,
            },
          });
        },
        openFile: (path) => {
          if (!get().project.files.some((file) => file.path === path)) return;
          set({ project: { ...get().project, activePath: path } });
        },
        setRules: (rules) => set({ project: { ...get().project, rules } }),
        setNotepad: (text) => set({ project: { ...get().project, notepad: text } }),
        acceptTab: (surface) => {
          const plan = planById(get().account.planId);
          if (!plan.tab) return "Tab completion is not on the Free plan.";
          const file = fileByPath(get().project.files, PAY_PATH);
          const next = applyIdempotency(file.text);
          if (next === file.text) return "Nothing to complete.";
          writePay(next);
          set({ session: { ...get().session, openDiff: true, diffAccepted: true, surface } });
          push(surface, "editor.tab()", "Ghost text inserted the idempotency key.");
          return "Tab accepted.";
        },
        inlineEdit: (instruction, surface) => {
          const current = get().session;
          if (current.mode !== "act") return "Switch to Act before an inline edit.";
          if (current.column === "queued") return "Start the this job first.";
          const blocked = gate(surface, "editor.inlineEdit()");
          if (blocked) return blocked;
          if (rulesBlockEdit(get().project.rules)) return "Rules block edits to pay.ts.";
          const file = fileByPath(get().project.files, PAY_PATH);
          if (!/idempotenc|retry|double|key/i.test(instruction)) {
            return "No edit matched. Ask for an idempotency key on the charge.";
          }
          const next = applyIdempotency(file.text);
          if (next === file.text) return "The charge already has an idempotency key.";
          spend();
          writePay(next);
          set({
            session: {
              ...get().session,
              surface,
              openDiff: true,
              diffAccepted: true,
              charged: { ...get().session.charged, diff: true },
            },
          });
          push(surface, "editor.inlineEdit()", instruction.trim() || "Inline edit.");
          return "Inline edit applied.";
        },
        runReview: (surface) => {
          const plan = planById(get().account.planId);
          if (!plan.review) return "Code review is on Premium and above.";
          const blocked = gate(surface, "agent.review()");
          if (blocked) return blocked;
          const file = fileByPath(get().project.files, PAY_PATH);
          const reviews = reviewFile(file.text);
          spend();
          set({ project: { ...get().project, reviews } });
          push(
            surface,
            "agent.review()",
            reviews.length ? reviews[0].text : "No open notes. The charge is idempotent.",
          );
          return reviews.length ? reviews[0].text : "Review is clean.";
        },
        indexRepo: (surface) => {
          const lines = get().project.files.reduce((sum, file) => sum + file.text.split("\n").length, 0);
          set({ project: { ...get().project, indexed: true } });
          push(surface, "agent.index()", `Indexed ${get().project.files.length} files, ${lines} lines, on this desk.`);
          return `Indexed ${lines} lines.`;
        },
        installRule: (pack, surface) => {
          const plan = planById(get().account.planId);
          if (!plan.marketplace) {
            const detail = "The rules marketplace is on Teams and Enterprise.";
            set({ project: { ...get().project, notice: detail } });
            return detail;
          }
          const project = get().project;
          if (project.rules.includes(pack)) return "That pack is already in .makerrrrules.";
          set({ project: { ...project, rules: `${project.rules.trim()}\n${pack}\n` } });
          push(surface, "rules.install()", pack);
          return "Rule pack installed.";
        },
        setFlag: (key, value) => {
          const plan = planById(get().account.planId);
          if ((key === "autoRun" || key === "network" || key === "mcp" || key === "privateDeploy") && !plan.controls) {
            return "Those controls are on Corporate Scale and Enterprise.";
          }
          if (key === "privateDeploy" && value) {
            set({ account: { ...get().account, privateDeploy: true, network: false } });
            return "Private deployment is on. The shell stays on this desk.";
          }
          set({ account: { ...get().account, [key]: value } });
          return "Saved.";
        },
        readFile: (surface) => {
          if (!get().account.mcp) return "MCP is off for this desk.";
          const file = fileByPath(get().project.files, get().project.activePath || PAY_PATH);
          push(surface, "mcp.read_file()", file.text);
          return get().account.privacy ? "Redacted." : file.text;
        },
        setHook: (key, value) => {
          set({ project: { ...get().project, [key]: value } });
        },
        composer: (prompt, surface) => {
          const text = prompt.trim();
          if (!text) return "Write a task.";
          if (get().project.secretHook && /sk_live|AKIA[0-9A-Z]{8,}|api[_-]?key\s*[:=]/i.test(text)) {
            const detail = "Secret hook stopped this prompt before it was stored.";
            talk("you", text);
            talk("agent", detail);
            push(surface, "agent.composer()", detail);
            return detail;
          }
          talk("you", text);
          if (get().session.column === "queued") {
            const started = get().startJob(surface);
            if (get().session.column === "queued") {
              talk("agent", started);
              return started;
            }
          }
          const project = get().project;
          const slash = text.startsWith("/") ? text.slice(1).split(/\s+/)[0] : "";
          if (slash === "security-audit") {
            const result = get().runReview(surface);
            talk("agent", result);
            return result;
          }
          if (slash === "write-tests") {
            const result = get().approveShell(surface);
            talk("agent", result);
            return result;
          }
          if (slash === "create-pr") {
            get().finish(surface);
            const result = "PR #18 opened for the Rosebank checkout. It is on the board.";
            talk("agent", result);
            push(surface, "agent.composer()", result);
            return result;
          }
          if (get().session.mode !== "act") {
            const hits = searchProject(project.files, project.rules, project.notepad, text);
            const where = hits.length
              ? hits.map((hit) => `${hit.path}:${hit.line} ${hit.text}`).join("\n")
              : "No matching line.";
            const result =
              get().session.mode === "ask"
                ? `Ask (no edits)\n${where}`
                : `Plan: ${text}\nSwitch to Agent before a file changes.\n${where}`;
            talk("agent", result);
            push(surface, "agent.composer()", get().session.mode === "ask" ? "Ask only." : "Plan only.");
            return result;
          }
          const blocked = gate(surface, "agent.composer()");
          if (blocked) {
            talk("agent", blocked);
            return blocked;
          }
          const notes: string[] = [];
          const asking = /^(where|how|what|why|when|who)\b/i.test(text) || text.endsWith("?");
          const wantsWebhook = !asking && /webhook/i.test(text);
          const wantsCharge = !asking && /idempotenc|retry|double|charge|settle|rosebank|fix/i.test(text);
          if (wantsWebhook) {
            const existing = project.files.some((file) => file.path === WEBHOOK_PATH);
            const files = existing
              ? project.files.map((file) =>
                  file.path === WEBHOOK_PATH ? { ...file, text: polish(WEBHOOK_SOURCE, project.formatHook) } : file,
                )
              : [...project.files, { path: WEBHOOK_PATH, text: polish(WEBHOOK_SOURCE, project.formatHook) }];
            set({ project: { ...get().project, files, activePath: WEBHOOK_PATH } });
            notes.push("Wrote src/checkout/webhook.ts. It calls settle.");
          }
          if (wantsCharge) {
            const file = fileByPath(get().project.files, PAY_PATH);
            if (rulesBlockEdit(get().project.rules)) {
              notes.push("Rules block edits to pay.ts.");
            } else {
              const next = applyIdempotency(file.text);
              if (next !== file.text) {
                writePay(next);
                set({
                  session: { ...get().session, openDiff: true, diffAccepted: true, surface },
                });
                notes.push("Updated src/checkout/pay.ts with an idempotency key.");
              }
            }
          }
          const hits = searchProject(get().project.files, get().project.rules, get().project.notepad, text);
          if (hits.length) {
            const label = get().project.indexed ? "Index" : "Raw scan (index is off)";
            notes.push(`${label}\n${hits.slice(0, 3).map((hit) => `${hit.path}:${hit.line} ${hit.text}`).join("\n")}`);
          }
          if (/docs|gateway|@web|@docs/i.test(text)) {
            notes.push(DOCS.map((doc) => `${doc.title}: ${doc.body}`).join("\n"));
          }
          if (!notes.length) {
            notes.push("No file change matched. Ask for the idempotency key, a webhook, or run /security-audit.");
          }
          spend();
          const result = notes.join("\n");
          talk("agent", result);
          push(surface, "agent.composer()", result);
          return result;
        },
        setRegion: (region) => {
          set({ account: { ...get().account, region } });
        },
        setTeamSeats: (seats) => {
          if (!Number.isFinite(seats)) return;
          const count = Math.min(250, Math.max(1, Math.round(seats)));
          set({ account: { ...get().account, teamSeats: count } });
        },
        spawnAgent: (title, surface) => {
          const plan = planById(get().account.planId);
          if (!plan.cloud) {
            const detail = "Parallel cloud agents start on Pro.";
            set({ project: { ...get().project, notice: detail } });
            return detail;
          }
          const running =
            (get().session.column === "running" || get().session.column === "queued" ? 1 : 0) +
            get().fleet.filter((job) => job.column === "running" || job.column === "queued").length;
          if (running >= plan.parallel) {
            const detail = `${plan.name} runs ${plan.parallel} agent${plan.parallel === 1 ? "" : "s"} at a time.`;
            set({ project: { ...get().project, notice: detail } });
            return detail;
          }
          const current = get().session;
          const project = get().project;
          const saved: FleetJob = {
            id: current.id,
            title: current.title,
            brief: current.brief,
            column: current.column,
            mode: current.mode,
            branch: current.id,
            files: project.files.map((file) => ({ ...file })),
            surface: current.surface,
          };
          const id = `agent-${Date.now().toString(36)}`;
          const webhook = /webhook/i.test(title);
          const files = freshFiles().map((file) =>
            file.path === PAY_PATH && !webhook ? { ...file, text: applyIdempotency(file.text) } : file,
          );
          const nextFiles = webhook
            ? [...files, { path: WEBHOOK_PATH, text: polish(WEBHOOK_SOURCE, true) }]
            : files;
          set({
            fleet: [saved, ...get().fleet.filter((job) => job.id !== current.id)].slice(0, 8),
            session: {
              ...freshSession(),
              id,
              title: title.trim() || "Parallel agent",
              brief: `Branch ${id}. This copy does not overwrite the other agent.`,
              column: "running",
              mode: "act",
              surface,
              openDiff: true,
              diffAccepted: true,
            },
            project: {
              ...project,
              files: nextFiles,
              activePath: webhook ? WEBHOOK_PATH : PAY_PATH,
              notice: `${title.trim() || "Parallel agent"} is running on its own files.`,
              reviews: reviewFile(fileByPath(nextFiles, PAY_PATH).text),
            },
          });
          push(surface, "agent.spawn()", id);
          return id;
        },
        focusAgent: (id, surface) => {
          if (id === get().session.id) return "Already on this agent.";
          const job = get().fleet.find((item) => item.id === id);
          if (!job) return "No agent with that id.";
          const current = get().session;
          const project = get().project;
          const saved: FleetJob = {
            id: current.id,
            title: current.title,
            brief: current.brief,
            column: current.column,
            mode: current.mode,
            branch: current.id,
            files: project.files.map((file) => ({ ...file })),
            surface,
          };
          set({
            fleet: [saved, ...get().fleet.filter((item) => item.id !== id && item.id !== current.id)].slice(0, 8),
            session: {
              ...current,
              id: job.id,
              title: job.title,
              brief: job.brief,
              column: job.column,
              mode: job.mode,
              surface,
              openDiff: true,
              diffAccepted: fileByPath(job.files, PAY_PATH).text.includes("idempotencyKey"),
            },
            project: {
              ...project,
              files: job.files,
              activePath: PAY_PATH,
              reviews: reviewFile(fileByPath(job.files, PAY_PATH).text),
              notice: `Focused ${job.title}.`,
            },
          });
          push(surface, "agent.focus()", job.title);
          return job.title;
        },
        sandboxRun: (surface) => {
          const plan = planById(get().account.planId);
          if (!plan.sandbox) return "The sandbox is on Pro and above.";
          if (!get().account.network && !get().account.privateDeploy) {
            return "Network is off, and private deployment is not the reason. Turn network on or use a corporate plan.";
          }
          const file = fileByPath(get().project.files, PAY_PATH);
          const proposed = applyIdempotency(file.text);
          const result = runCheckoutTest(proposed, get().project.rules);
          const output = `sandbox (file not written)\n${result.output}`;
          set({
            session: { ...get().session, surface, shellOutput: output, shellStatus: "pending" },
          });
          push(surface, "agent.sandbox()", output);
          return output;
        },
        printState: (surface) => {
          const session = get().session;
          const text = JSON.stringify(
            {
              id: session.id,
              column: session.column,
              mode: session.mode,
              model: session.modelId,
              plan: get().account.planId,
              idempotent: fileByPath(get().project.files, PAY_PATH).text.includes("idempotencyKey"),
              fleet: get().fleet.map((job) => ({ id: job.id, title: job.title, column: job.column })),
            },
            null,
            2,
          );
          set({ project: { ...get().project, notice: text } });
          push(surface, "agent.print()", text);
          return text;
        },
        delegateTests: (surface) => {
          const plan = planById(get().account.planId);
          if (!plan.subagents) return "Subagents start on Pro Plus.";
          if (get().session.mode !== "act") return "Switch to Agent before the test writer edits.";
          const project = get().project;
          const test = fileByPath(project.files, TEST_PATH);
          const extra = test.text.includes("idempotencyKey is required")
            ? test.text
            : `${test.text.trim()}\n\ntest("idempotencyKey is required", () => {\n  expect(true).toBe(true)\n})\n`;
          const files = project.files.some((file) => file.path === TEST_PATH)
            ? project.files.map((file) => (file.path === TEST_PATH ? { ...file, text: extra } : file))
            : [...project.files, { path: TEST_PATH, text: extra }];
          const card: FleetJob = {
            id: `sub-${Date.now().toString(36)}`,
            title: "Test writer",
            brief: "Subagent. Only the test file.",
            column: "done",
            mode: "act",
            branch: "subagent/tests",
            files,
            surface,
          };
          set({
            fleet: [card, ...get().fleet].slice(0, 8),
            project: { ...project, files, activePath: TEST_PATH, notice: "Test writer added a check and stopped." },
          });
          push(surface, "agent.delegate()", "Test writer finished.");
          return "Test writer finished.";
        },
      };
    },
    {
      name: "makerrr-agent",
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AgentState>;
        return {
          ...current,
          ...saved,
          session: { ...current.session, ...saved.session },
          account: { ...current.account, ...saved.account },
          fleet: saved.fleet ?? current.fleet,
          project: {
            ...current.project,
            ...saved.project,
            files: saved.project?.files?.length ? saved.project.files : current.project.files,
            chat: saved.project?.chat ?? current.project.chat,
            formatHook: saved.project?.formatHook ?? current.project.formatHook,
            secretHook: saved.project?.secretHook ?? current.project.secretHook,
          },
        };
      },
    },
  ),
);
