import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PlanCards, SiteFrame } from "@/components/chrome";
import { useAgent } from "@/lib/agent-store";
import { planById, PLANS, type PlanId } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

const INDIVIDUAL: PlanId[] = ["free", "plus", "premium", "super", "ultra"];
const TEAM: PlanId[] = ["teams", "enterprise"];

const ROWS: { feature: string; marks: Record<PlanId, string> }[] = [
  { feature: "Agent", marks: mark("✓", "✓", "✓", "✓", "✓", "✓", "✓") },
  { feature: "Tab completion", marks: mark("—", "✓", "✓", "✓", "✓", "✓", "✓") },
  { feature: "Cloud agents", marks: mark("—", "—", "✓", "✓", "✓", "✓", "✓") },
  { feature: "Code review", marks: mark("—", "—", "✓", "✓", "✓", "✓", "✓") },
  { feature: "Third-party models at list price", marks: mark("—", "—", "✓", "✓", "✓", "✓", "✓") },
  { feature: "Grok models", marks: mark("—", "✓", "✓", "✓", "✓", "✓", "✓") },
  { feature: "Local model (Ollama)", marks: mark("✓", "✓", "✓", "✓", "✓", "✓", "✓") },
  { feature: "Rules marketplace", marks: mark("—", "—", "—", "—", "—", "✓", "✓") },
  { feature: "Privacy mode", marks: mark("✓", "✓", "✓", "✓", "✓", "✓", "✓") },
  { feature: "Priority at peak times", marks: mark("—", "—", "—", "✓", "✓", "✓", "✓") },
  { feature: "Auto-run, network, and MCP controls", marks: mark("—", "—", "—", "—", "—", "—", "✓") },
];

function mark(...values: string[]): Record<PlanId, string> {
  const ids: PlanId[] = ["free", "plus", "premium", "super", "ultra", "teams", "enterprise"];
  return Object.fromEntries(ids.map((id, index) => [id, values[index]])) as Record<PlanId, string>;
}

const FAQS = [
  ["What is the right plan for me?", "Free is the local model and a short request pool. Plus is Grok only. Premium is the first plan with cloud agents, review, and third-party models."],
  ["What are my payment options?", "This desk changes plan immediately. It does not charge a card. SuppplePAY is not connected here."],
  ["How do usage limits work?", "Each start, edit, review, and shell run spends one request. The counter resets when you change plan."],
  ["Is a hosted model key included?", "No key is stored. The desk runs an open local agent and bills the model you pick at the rates on the session."],
  ["What models are supported?", "Grok 4, Kimi K3.1 Pro, Codestral, and Ollama local. The plan decides which of those can bill."],
  ["Are prices inclusive of taxes?", "Prices shown do not include tax. Third-party model usage is extra, on the session total."],
  ["How do I see usage?", "The billing line shows requests used against the plan, plus token cost for the model."],
  ["How does Makerrr use my data?", "Privacy mode redacts the call log. Code stays in this browser. Nothing is sent to a training set from this desk."],
  ["Can I buy this from a reseller?", "No. Change plan on this page."],
];

function PricingPage() {
  const [side, setSide] = useState<"individual" | "teams">("individual");
  const [open, setOpen] = useState<string | null>(FAQS[0][0]);
  const current = planById(useAgent((state) => state.account.planId));
  return (
    <SiteFrame>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-5xl font-medium tracking-tight">Pricing</h1>
        <p className="mt-3 text-sm text-mute">This desk is on {current.name}. Choosing a plan changes what the agent can run.</p>
        <div className="mt-8 inline-flex rounded-full bg-[#e7e4dc] p-1">
          {(["individual", "teams"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSide(item)}
              className={`h-10 rounded-full px-4 text-sm ${side === item ? "bg-white" : ""}`}
            >
              {item === "individual" ? "Individual" : "Teams"}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <PlanCards ids={side === "individual" ? INDIVIDUAL : TEAM} />
        </div>
        <p className="mt-8 max-w-3xl text-xs text-mute">
          Prices shown do not include tax. Third-party models are not included in the monthly price. They add to the session total at list price. Cancel by switching back to Free.
        </p>
        <h2 className="mt-12 text-2xl font-medium">Compare features across plans</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 pr-3 font-medium">Feature</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className="px-2 py-3 font-medium">
                    {plan.name}
                    <span className="block text-xs font-normal text-mute">{plan.price}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-line">
                  <td className="py-3 pr-3">{row.feature}</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="px-2 py-3 text-center">
                      {row.marks[plan.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="mt-12 text-2xl font-medium">Questions</h2>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {FAQS.map(([q, a]) => (
            <div key={q}>
              <button type="button" className="flex w-full items-center justify-between py-4 text-left text-sm" onClick={() => setOpen(open === q ? null : q)}>
                {q}
                <span className="text-mute">{open === q ? "–" : "+"}</span>
              </button>
              {open === q ? <p className="pb-4 text-sm text-mute">{a}</p> : null}
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/desktop" search={{ os: "mac" }} className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm text-bone">
            Download
          </Link>
          <Link to="/enterprise" className="inline-flex h-12 items-center rounded-full border border-line px-5 text-sm">
            Contact sales
          </Link>
        </div>
      </main>
    </SiteFrame>
  );
}
