import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { Workbench } from "@/components/workbench";
import { useAgent, type DeskOs } from "@/lib/agent-store";

export const Route = createFileRoute("/")({ component: Home });

const TABS = [
  { id: "desktop", label: "Desktop", href: "/desktop" as const, lede: "The same agent in its own window. No separate editor required." },
  { id: "ide", label: "IDE", href: "/ide" as const, lede: "Tab, inline edit, review, and the file tree." },
  { id: "cli", label: "CLI", href: "/cli" as const, lede: "The same calls, typed." },
  { id: "sdk", label: "SDK", href: "/sdk" as const, lede: "The calls the other surfaces already use." },
] as const;

const OS: { id: DeskOs; label: string }[] = [
  { id: "mac", label: "Download for macOS" },
  { id: "windows", label: "Download for Windows" },
  { id: "linux", label: "Download for Linux" },
];

function Home() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("desktop");
  const current = TABS.find((item) => item.id === tab) ?? TABS[0];
  const column = useAgent((state) => state.session.column);

  return (
    <SiteFrame>
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-6 pt-14">
          <h1 className="max-w-3xl text-4xl font-medium tracking-tight text-ink sm:text-6xl sm:leading-[1.05]">
            Makerrr is your coding agent for building ambitious software.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/desktop" search={{ os: "mac" }} className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm text-bone">
              Download for macOS
            </Link>
            <Link to="/enterprise" className="inline-flex h-12 items-center rounded-full bg-[#e7e4dc] px-5 text-sm">
              Request a demo
            </Link>
          </div>
        </section>
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl rounded-3xl bg-[#ddd6c8] p-3 sm:p-8">
            <Workbench surface="desktop" compact />
            <p className="mt-3 text-center text-xs text-mute">
              Johannesburg session is {column}. This window edits the same files as the IDE.
            </p>
          </div>
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
              <Link to={current.href} className="inline-flex h-11 items-center bg-ink px-4 text-sm text-bone">
                Open {current.label}
              </Link>
              {current.id === "desktop"
                ? OS.map((os) => (
                    <Link key={os.id} to="/desktop" search={{ os: os.id }} className="inline-flex h-11 items-center border border-line px-4 text-sm">
                      {os.label}
                    </Link>
                  ))
                : null}
            </div>
            {current.id === "desktop" ? (
              <p className="mt-3 text-xs text-mute">These open the working desktop app. Signed installers are not shipped from this desk.</p>
            ) : null}
          </div>
        </section>
        <section className="mx-auto grid max-w-5xl gap-8 px-4 pb-20 sm:grid-cols-2">
          {[
            ["Tab", "Ghost text on the charge line. Press Tab to accept it. Free does not include it."],
            ["Agent", "Ctrl+I runs a multi-file edit. A webhook request writes webhook.ts. Questions search the repo."],
            ["Inline edit", "Ctrl+K rewrites the selection in place. Act has to be on."],
            ["Review", "Premium and above can open a note on the double-charge and apply the fix."],
          ].map(([title, body]) => (
            <article key={title}>
              <h2 className="text-xl font-medium">{title}</h2>
              <p className="mt-2 text-sm text-mute">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </SiteFrame>
  );
}
