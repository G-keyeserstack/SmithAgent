import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { HeroWindow } from "@/components/hero-window";
import { PACKS, HUBS } from "@/lib/platform";
import { formatUsd, sessionCost, useAgent, type DeskOs } from "@/lib/agent-store";
import { planById } from "@/lib/plans";

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
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              src="/makerrr-agent.mp4"
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
  const project = useAgent((state) => state.project);
  const account = useAgent((state) => state.account);
  const installPack = useAgent((state) => state.installPack);
  const connectHub = useAgent((state) => state.connectHub);
  const runShadow = useAgent((state) => state.runShadow);
  const reviewPull = useAgent((state) => state.reviewPull);
  const writeDigest = useAgent((state) => state.writeDigest);
  const triageCi = useAgent((state) => state.triageCi);
  const plan = planById(account.planId);
  const chat = project.chat;
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-2xl font-medium">How the sandbox rules work</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-mute">
            <li>The allow list is checked first. `bun test` may run the checkout test, after you start the job and switch to Act.</li>
            <li>The block list wins over everything else. `sudo` and `rm -rf` are refused and the command does not run.</li>
            <li>A risky command that is not blocked, such as `npm install`, `npx`, or `curl`, runs in a network-less mount namespace. The desk files stay covered.</li>
            <li>Anything else waits until you add it to the allow list, or turn auto-run on.</li>
          </ol>
          <p className="mt-4 text-sm"><Link to="/sandbox" className="text-ink">Open sandbox settings</Link></p>
        </article>
        <article className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-2xl font-medium">How to run it</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-mute">
            <li>Install Node 20 or newer.</li>
            <li>In this project, run `npm install` and then `npm run dev`.</li>
            <li>Open the desk at the local address the script prints. This preview is already that server.</li>
            <li>Start the job, switch to Act, and accept the diff. The shell follows the rules above.</li>
          </ol>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-ink p-3 text-xs text-bone">npm install{"\n"}npm run dev</pre>
        </article>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-medium tracking-tight">Marketplace, shadow runs, and the meter</h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">Packs write rules onto this desk. A hub stays waiting until a token exists. Nothing here calls Netlify, GitHub, or Slack.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-line p-4">
            <h3 className="font-medium">Packs</h3>
            <ul className="mt-3 space-y-2">
              {PACKS.map((pack) => (
                <li key={pack.id}>
                  <button type="button" onClick={() => installPack(pack.id, "desktop")} className="text-left text-sm">
                    <span className="font-medium">{pack.name}</span>
                    <span className="mt-1 block text-xs text-mute">{pack.kind}. One click writes it into the rules.</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-line p-4">
            <h3 className="font-medium">Hubs</h3>
            <ul className="mt-3 space-y-2">
              {HUBS.map((name) => (
                <li key={name}>
                  <button type="button" onClick={() => connectHub(name)} className="text-sm">
                    {name}: {project.hubs[name] ?? "off"}
                  </button>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-line p-4 text-sm">
            <h3 className="font-medium">Meter</h3>
            <p className="mt-3">{account.requestsUsed} of {plan.requests} requests on {plan.name}.</p>
            <p className="mt-1">{formatUsd(sessionCost(session))} on {session.modelId}.</p>
            <p className="mt-1">{fleet.length} worktrees.</p>
          </article>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => runShadow("desktop")} className="h-10 rounded-full bg-ink px-4 text-sm text-bone">Run shadow workspace</button>
          <button type="button" onClick={() => reviewPull("desktop")} className="h-10 rounded-full border border-ink px-4 text-sm">Review the change</button>
          <button type="button" onClick={() => writeDigest("desktop")} className="h-10 rounded-full border border-line px-4 text-sm">Daily digest</button>
          <button type="button" onClick={() => triageCi("desktop")} className="h-10 rounded-full border border-line px-4 text-sm">Triage the log</button>
        </div>
        <div className="mt-4 space-y-2 text-sm text-mute">
          {project.shadowLog ? <p>{project.shadowLog}</p> : null}
          {project.prStatus ? <p>{project.prStatus}</p> : null}
          {project.digest ? <p>{project.digest}</p> : null}
          {project.ciNote ? <p>{project.ciNote}</p> : null}
        </div>
      </section>
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
              <li key={job.id}>{job.branch} · {job.column}</li>
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
