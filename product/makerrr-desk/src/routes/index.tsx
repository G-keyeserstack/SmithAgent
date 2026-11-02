import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { HeroWindow } from "@/components/hero-window";
import { useAgent, type DeskOs } from "@/lib/agent-store";

export const Route = createFileRoute("/")({ component: Home });

const TABS = [
  { id: "desktop", label: "Desktop", href: "/desktop" as const, lede: "The same agent in its own window." },
  { id: "ide", label: "IDE", href: "/ide" as const, lede: "Tab, inline edit, review, and the file tree." },
  { id: "cli", label: "CLI", href: "/cli" as const, lede: "The same calls, typed." },
  { id: "sdk", label: "SDK", href: "/sdk" as const, lede: "The calls the other surfaces already use." },
] as const;

const OS: { id: DeskOs; label: string }[] = [
  { id: "mac", label: "macOS" },
  { id: "windows", label: "Windows" },
  { id: "linux", label: "Linux" },
];

function Home() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("desktop");
  const current = TABS.find((item) => item.id === tab) ?? TABS[0];

  return (
    <SiteFrame>
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 sm:pt-24">
          <h1 className="max-w-3xl text-[2.6rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Makerrr is your coding agent for building ambitious software.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/desktop" search={{ os: "mac" }} className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm text-bone">
              Download for macOS
            </Link>
            <Link to="/enterprise" className="inline-flex h-12 items-center rounded-full bg-[#e6e3db] px-5 text-sm">
              Request a demo
            </Link>
          </div>
        </section>
        <section className="px-3 pb-20 sm:px-6">
          <HeroWindow />
        </section>
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="overflow-hidden rounded-2xl border border-line bg-black">
            <video
              className="aspect-video w-full"
              controls
              playsInline
              preload="metadata"
              src="/understand-codebase.webm"
            >
              <track kind="captions" />
            </video>
          </div>
          <p className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-mute">
            <span>The agent reads the codebase before it edits.</span>
            <Link to="/controls" className="text-ink">Open the desk controls</Link>
          </p>
        </section>
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="flex items-end overflow-x-auto" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className="folder-tab relative h-12 shrink-0 rounded-t-xl px-5 text-sm font-semibold"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="folder-sheet rounded-b-xl p-6" style={{ borderTopLeftRadius: tab === "desktop" ? 0 : undefined }}>
            <h2 className="text-2xl font-medium">{current.label}</h2>
            <p className="mt-2 max-w-xl text-sm text-mute">{current.lede}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={current.href} className="inline-flex h-11 items-center rounded-full bg-ink px-4 text-sm text-bone">
                Open {current.label}
              </Link>
              {current.id === "desktop"
                ? OS.map((os) => (
                    <Link key={os.id} to="/desktop" search={{ os: os.id }} className="inline-flex h-11 items-center rounded-full border border-line px-4 text-sm">
                      {os.label}
                    </Link>
                  ))
                : null}
            </div>
          </div>
        </section>
        <HomeRest />
      </main>
    </SiteFrame>
  );
}

const GATES = ["Stripe", "Paystack", "PayPal", "Flutterwave", "PayFast", "Yoco", "Ozow"];

function HomeRest() {
  const session = useAgent((state) => state.session);
  const fleet = useAgent((state) => state.fleet);
  const chat = useAgent((state) => state.project.chat);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-20 text-center">
        <p className="text-sm text-mute">Built for teams that ship from Lagos, Nairobi, Cape Town, and London.</p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {GATES.map((name) => (
            <li key={name} className="flex h-16 items-center justify-center rounded-xl border border-line bg-[#f3f1eb] text-sm font-semibold tracking-tight">
              {name}
            </li>
          ))}
        </ul>
      </section>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <h2 className="text-4xl font-medium leading-tight tracking-tight">Agents turn ideas into code</h2>
          <p className="mt-4 text-lg text-mute">Hand the charge path to the agent. You stay on the decision.</p>
          <Link to="/ide" className="mt-6 inline-flex text-sm text-clay">Open the IDE</Link>
        </div>
        <div className="rounded-2xl bg-[#e7e4dc] p-4 sm:p-8">
          <HeroWindow />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 lg:grid-cols-[minmax(0,1.2fr)_18rem]">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-widest text-mute">This week</p>
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-medium">{session.title}</p>
          <ul className="mt-3 space-y-2 text-sm text-mute">
            {fleet.slice(0, 4).map((job) => (
              <li key={job.id}>{job.title} · {job.column}</li>
            ))}
            {fleet.length === 0 ? <li>No parallel agent yet. Cloud can start one.</li> : null}
          </ul>
        </div>
        <div>
          <h2 className="text-4xl font-medium leading-tight tracking-tight">Works on its own, runs in parallel</h2>
          <p className="mt-4 text-lg text-mute">Each cloud agent keeps its own copy of the files. Pro runs two. Pro Plus runs four.</p>
          <Link to="/cloud" className="mt-6 inline-flex text-sm text-clay">Open cloud agents</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <h2 className="text-4xl font-medium leading-tight tracking-tight">In the editor, the terminal, and the review</h2>
          <p className="mt-4 text-lg text-mute">The same session answers in the CLI, shows the diff, and waits before a shell command runs.</p>
          <Link to="/cli" className="mt-6 inline-flex text-sm text-clay">Open the CLI</Link>
        </div>
        <div className="rounded-2xl bg-[#d9d3c6] p-6">
          <pre className="overflow-x-auto rounded-xl bg-[#1c1b19] p-4 text-xs leading-6 text-[#f3f0e7]">{`$ agent add the idempotency key
$ sandbox
$ print`}</pre>
          <ul className="mt-4 space-y-2 text-sm">
            {chat.slice(-3).map((line, index) => (
              <li key={`${line.role}-${index}`} className="rounded-lg bg-white/80 px-3 py-2">
                <span className="text-xs uppercase text-mute">{line.role}</span>
                <span className="mt-1 block">{line.text.slice(0, 160)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 pb-24 text-center">
        <h2 className="text-5xl font-medium tracking-tight">Try Makerrr now.</h2>
        <Link to="/desktop" search={{ os: "mac" }} className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm text-bone">
          Download for macOS
        </Link>
      </section>
    </>
  );
}
