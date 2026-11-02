import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { HeroWindow } from "@/components/hero-window";
import type { DeskOs } from "@/lib/agent-store";

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
      </main>
    </SiteFrame>
  );
}
