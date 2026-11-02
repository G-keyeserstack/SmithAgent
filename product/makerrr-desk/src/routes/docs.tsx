import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFrame } from "@/components/chrome";

export const Route = createFileRoute("/docs")({ component: DocsPage });

const STEPS = [
  ["Tab", "Open the IDE. If the plan includes Tab, the charge line offers ghost text. Press Tab to write the idempotency key."],
  ["Agent", "Ctrl+I focuses the composer. Act mode edits. Plan mode only describes the change. A webhook request adds src/checkout/webhook.ts."],
  ["Inline edit", "Ctrl+K. Ask for an idempotency key. The file changes in place."],
  ["Ask the repo", "Where do we handle payment webhooks? The answer quotes a file line. Index marks the scan as an index hit."],
  ["Review", "/security-audit or the Review tab. Premium and above. Apply fix writes the key."],
  ["Shell", "/write-tests runs the checkout test against the file. It fails until the key is present."],
  ["Rules", ".makerrrrules is editable. A line that says do not edit pay.ts blocks the write. Secret-looking prompts are dropped when the hook is on."],
  ["Cloud", "Cloud start is on Premium and above. The session lands on the board."],
  ["CLI and SDK", "Those pages call the same store. ask on the CLI runs the composer."],
];

function DocsPage() {
  return (
    <SiteFrame>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-5xl font-medium tracking-tight">Docs</h1>
        <p className="mt-3 text-sm text-mute">
          Makerrr on this desk is the open stand-in for a VS Code fork: one editor, one agent, files that actually change. It is not a signed desktop install.
        </p>
        <ol className="mt-8 space-y-5">
          {STEPS.map(([title, body], index) => (
            <li key={title}>
              <h2 className="text-lg font-medium">
                {index + 1}. {title}
              </h2>
              <p className="mt-1 text-sm text-mute">{body}</p>
            </li>
          ))}
        </ol>
        <Link to="/ide" className="mt-8 inline-flex h-11 items-center bg-ink px-4 text-sm text-bone">
          Open the IDE
        </Link>
      </main>
    </SiteFrame>
  );
}
