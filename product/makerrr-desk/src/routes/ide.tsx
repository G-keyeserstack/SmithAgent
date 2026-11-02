import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/chrome";
import { Workbench } from "@/components/workbench";

export const Route = createFileRoute("/ide")({ component: IdePage });

function IdePage() {
  return (
    <SiteFrame>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Workbench surface="ide" />
      </main>
    </SiteFrame>
  );
}
