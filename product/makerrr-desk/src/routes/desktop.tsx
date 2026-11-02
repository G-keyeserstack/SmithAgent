import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/chrome";
import { Workbench } from "@/components/workbench";
import type { DeskOs } from "@/lib/agent-store";

const LABELS: Record<DeskOs, string> = {
  mac: "macOS",
  windows: "Windows",
  linux: "Linux",
};

export const Route = createFileRoute("/desktop")({
  validateSearch: (search: Record<string, unknown>) => {
    const os = search.os;
    const desk: DeskOs = os === "windows" || os === "linux" || os === "mac" ? os : "mac";
    return { os: desk };
  },
  component: DesktopPage,
});

function DesktopPage() {
  const { os } = Route.useSearch();
  return (
    <SiteFrame>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-3 flex items-center gap-2 text-xs text-mute">
          <span className="flex gap-1" aria-hidden="true">
            <i className="size-2.5 rounded-full bg-clay" />
            <i className="size-2.5 rounded-full bg-line" />
            <i className="size-2.5 rounded-full bg-line" />
          </span>
          Makerrr Desktop · {LABELS[os]}
        </div>
        <Workbench surface="desktop" />
        <p className="mt-3 text-xs text-mute">
          Opened inside the working app. Signed {LABELS[os]} installers are not shipped from this desk.
        </p>
      </main>
    </SiteFrame>
  );
}
