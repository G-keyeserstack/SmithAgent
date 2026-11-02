import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  formatUsd,
  modelById,
  MODELS,
  sessionCost,
  useAgent,
  type ModelId,
  type Surface,
} from "@/lib/agent-store";
import { planById, PLANS, priceLabel, type PlanId } from "@/lib/plans";

const PRODUCT = [
  { to: "/cloud", label: "Agents", note: "The open session" },
  { to: "/desktop", label: "Desktop", note: "Same agent, own window" },
  { to: "/ide", label: "IDE", note: "Editor, Tab, inline edit" },
  { to: "/cli", label: "CLI", note: "Same calls, typed" },
  { to: "/cloud", label: "Cloud agents", note: "Start a task off the laptop" },
  { to: "/ide", label: "Code review", note: "Notes on the charge" },
  { to: "/sdk", label: "SDK", note: "Embed the runtime" },
  { to: "/board", label: "Board", note: "Queued, running, held, done" },
] as const;

const RESOURCES = [
  { to: "/docs", label: "Docs" },
  { to: "/models", label: "Models" },
  { to: "/pricing", label: "Pricing" },
  { to: "/enterprise", label: "Enterprise" },
] as const;

export function useAgentReady() {
  useEffect(() => {
    void useAgent.persist.rehydrate();
  }, []);
}

export function NewsBar() {
  return (
    <Link
      to="/cloud"
      className="block bg-ink px-4 py-2 text-center text-xs font-medium tracking-wide text-bone sm:text-sm"
    >
      One agent runtime. Desktop, IDE, CLI, and Cloud share the same files.
    </Link>
  );
}

function Menu({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="h-10 px-2 text-sm text-ink"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
      >
        {label}
      </button>
      {open ? (
        <div className="absolute left-0 z-30 mt-1 w-64 rounded-xl border border-line bg-paper p-2 shadow-sm">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function CenterNav() {
  const account = useAgent((state) => state.account);
  const signOut = useAgent((state) => state.signOut);
  const [signing, setSigning] = useState(false);
  const [name, setName] = useState("");

  return (
    <header className="bg-[#f7f6f3]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-2 flex items-center gap-2 text-ink">
          <img src="/makerrr-mark.png" alt="" className="h-9 w-auto bg-white" />
          <span className="text-sm font-semibold tracking-[0.16em]">MAKERRR</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center justify-center gap-1">
          <Menu label="Models">
            <ModelMenu />
          </Menu>
          <Menu label="Product">
            {PRODUCT.map((item) =>
              item.to === "/desktop" ? (
                <Link key={item.label} to="/desktop" search={{ os: "mac" }} className="block rounded-lg px-3 py-2 hover:bg-bone">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-mute">{item.note}</span>
                </Link>
              ) : (
                <Link key={item.label} to={item.to} className="block rounded-lg px-3 py-2 hover:bg-bone">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-mute">{item.note}</span>
                </Link>
              ),
            )}
          </Menu>
          <Link to="/enterprise" className="h-10 px-2 text-sm leading-10">
            Enterprise
          </Link>
          <Link to="/sandbox" className="h-10 px-2 text-sm leading-10">
            Sandbox
          </Link>
          <Link to="/pricing" className="h-10 px-2 text-sm leading-10">
            Pricing
          </Link>
          <Menu label="Resources">
            {RESOURCES.map((item) => (
              <Link key={item.to} to={item.to} className="block rounded-lg px-3 py-2 text-sm hover:bg-bone">
                {item.label}
              </Link>
            ))}
          </Menu>
        </nav>
        <div className="flex items-center gap-2">
          {account.signedIn ? (
            <button type="button" onClick={() => signOut()} className="h-10 px-2 text-sm">
              {account.name || "Desk"}
            </button>
          ) : (
            <button type="button" onClick={() => setSigning((value) => !value)} className="h-10 px-2 text-sm">
              Sign in
            </button>
          )}
          <Link
            to="/enterprise"
            className="hidden h-10 items-center rounded-full border border-line px-3 text-sm sm:inline-flex"
          >
            Contact sales
          </Link>
          <Link
            to="/desktop"
            search={{ os: "mac" }}
            className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm text-bone"
          >
            Download
          </Link>
        </div>
      </div>
      {signing && !account.signedIn ? <SignInRow onDone={() => setSigning(false)} name={name} setName={setName} /> : null}
    </header>
  );
}

function ModelMenu() {
  const modelId = useAgent((state) => state.session.modelId);
  const setModel = useAgent((state) => state.setModel);
  const plan = planById(useAgent((state) => state.account.planId));
  return (
    <div>
      {MODELS.map((model) => {
        const allowed = plan.models.includes(model.id);
        return (
          <button
            key={model.id}
            type="button"
            disabled={!allowed}
            onClick={() => setModel(model.id, "desktop")}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-bone disabled:opacity-40"
          >
            <span>{model.label}</span>
            <span className="text-xs text-mute">{model.id === modelId ? "Billing" : model.kind}</span>
          </button>
        );
      })}
      <Link to="/models" className="block px-3 py-2 text-xs text-clay">
        All models
      </Link>
    </div>
  );
}

function SignInRow({
  onDone,
  name,
  setName,
}: {
  onDone: () => void;
  name: string;
  setName: (value: string) => void;
}) {
  const signIn = useAgent((state) => state.signIn);
  return (
    <form
      className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 pb-3"
      onSubmit={(event) => {
        event.preventDefault();
        signIn(name);
        onDone();
      }}
    >
      <label className="text-sm text-mute" htmlFor="desk-name">
        Desk name
      </label>
      <input
        id="desk-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        className="h-11 min-w-0 flex-1 border border-line bg-paper px-3 text-sm"
      />
      <button type="submit" className="h-11 bg-ink px-4 text-sm text-bone">
        Continue
      </button>
    </form>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-[#f3f1eb]">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-xs uppercase tracking-widest text-mute">Suppple Group Plc</p>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-mute">
            <li><Link to="/cloud">Agents</Link></li>
            <li><Link to="/pricing">Teams</Link></li>
            <li><Link to="/enterprise">Enterprise</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/ide">Code review</Link></li>
            <li><Link to="/cli">CLI</Link></li>
            <li><Link to="/cloud">Cloud agents</Link></li>
            <li><Link to="/sdk">SDK</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Resources</p>
          <ul className="mt-3 space-y-2 text-sm text-mute">
            <li><Link to="/desktop" search={{ os: "mac" }}>Download</Link></li>
            <li><Link to="/docs">Docs</Link></li>
            <li><Link to="/models">Models</Link></li>
            <li><Link to="/board">Board</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-mute">
            <li><Link to="/enterprise">Contact sales</Link></li>
            <li>Suppple Group Plc</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-mute">
            <li>Prices exclude VAT.</li>
            <li>Based on Cline, Apache-2.0.</li>
            <li>Card data stays with the payment company.</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Pay</p>
          <ul className="mt-3 space-y-2 text-sm text-mute">
            <li><Link to="/pricing">Stripe and Link</Link></li>
            <li><Link to="/pricing">Paystack</Link></li>
            <li><Link to="/pricing">PayPal</Link></li>
            <li><Link to="/pricing">Flutterwave</Link></li>
            <li><Link to="/pricing">PayFast, Yoco, Ozow</Link></li>
          </ul>
        </div>
      </div>
      <p className="px-4 pb-8 text-center text-xs text-mute">© 2026 Suppple Group Plc.</p>
    </footer>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  useAgentReady();
  const reduceMotion = useAgent((state) => state.project.reduceMotion);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);
  return (
    <div className="min-h-screen bg-[#f7f6f3] text-ink">
      <CenterNav />
      {children}
      <SiteFooter />
    </div>
  );
}

export function ModelPicker({ surface }: { surface: Surface }) {
  const modelId = useAgent((state) => state.session.modelId);
  const setModel = useAgent((state) => state.setModel);
  const plan = planById(useAgent((state) => state.account.planId));
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <span className="text-mute">Model</span>
      <select
        className="h-11 min-w-40 border border-line bg-paper px-2 text-ink"
        value={modelId}
        onChange={(event) => setModel(event.target.value as ModelId, surface)}
      >
        {MODELS.map((model) => (
          <option key={model.id} value={model.id} disabled={!plan.models.includes(model.id)}>
            {model.label}
            {plan.models.includes(model.id) ? "" : " · locked"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function BillingLine() {
  const session = useAgent((state) => state.session);
  const account = useAgent((state) => state.account);
  const model = modelById(session.modelId);
  const plan = planById(account.planId);
  const cost = sessionCost(session);
  return (
    <p className="text-sm text-ink">
      Bills <span className="font-semibold">{model.label}</span>
      <span className="text-mute">
        {" "}
        · {plan.name} · {account.requestsUsed}/{plan.requests} requests · {session.inputTokens.toLocaleString()} in /{" "}
        {session.outputTokens.toLocaleString()} out ·{" "}
      </span>
      <span className="font-semibold">{formatUsd(cost)}</span>
      <span className="text-mute"> · {session.location}</span>
    </p>
  );
}

export function ColumnPill({ column }: { column: string }) {
  return (
    <span className="border border-line bg-bone px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
      {column}
    </span>
  );
}

export function PlanCards({
  ids,
}: {
  ids: PlanId[];
}) {
  const current = useAgent((state) => state.account.planId);
  const region = useAgent((state) => state.account.region);
  const setPlan = useAgent((state) => state.setPlan);
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {PLANS.filter((plan) => ids.includes(plan.id)).map((plan) => (
        <article
          key={plan.id}
          className={`flex flex-col border bg-paper p-5 ${plan.popular ? "border-ink" : "border-line"}`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            {plan.popular ? <span className="text-xs uppercase tracking-wide text-clay">Most popular</span> : null}
          </div>
          <p className="mt-3 text-3xl font-medium tracking-tight">{priceLabel(plan, region)}</p>
          <p className="mt-1 text-xs text-mute">{plan.seats} seats</p>
          <p className="mt-2 text-sm text-mute">{plan.blurb}</p>
          <p className="mt-3 text-sm">{plan.parallel} agents at a time</p>
          <button
            type="button"
            onClick={() => setPlan(plan.id)}
            className={`mt-5 h-11 text-sm ${current === plan.id ? "border border-ink" : "bg-ink text-bone"}`}
          >
            {current === plan.id ? "Current plan" : plan.price === "Custom" || plan.price === "Talk to us" ? "Contact sales" : `Get ${plan.name}`}
          </button>
        </article>
      ))}
    </div>
  );
}
