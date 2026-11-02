import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PlanCards, SiteFrame } from "@/components/chrome";
import { useAgent } from "@/lib/agent-store";
import { planById, PLANS, priceLabel, PUBLIC_PLANS, teamTotal, type PlanId, type Region, type Segment } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: "individual", label: "Individuals" },
  { id: "agency", label: "Agencies" },
  { id: "startup", label: "Startups" },
  { id: "corporate", label: "Corporate" },
];

const REGIONS: { id: Region; label: string }[] = [
  { id: "za", label: "South Africa" },
  { id: "ng", label: "Nigeria" },
  { id: "ke", label: "Kenya" },
];

function PricingPage() {
  const [segment, setSegment] = useState<Segment>("individual");
  const account = useAgent((state) => state.account);
  const setRegion = useAgent((state) => state.setRegion);
  const setTeamSeats = useAgent((state) => state.setTeamSeats);
  const current = planById(account.planId);
  const publicPlans = PUBLIC_PLANS.map((id) => planById(id));
  const ids = (segment === "individual" ? PUBLIC_PLANS : PLANS.filter((item) => item.segment === segment).map((item) => item.id)) as PlanId[];
  return (
    <SiteFrame>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-5xl font-medium tracking-tight">Pricing</h1>
        <p className="mt-3 max-w-2xl text-sm text-mute">
          This desk is on {current.name}
          {current.perUser ? ` · ${teamTotal(current, account.region, account.teamSeats)}` : ""}. Prices exclude VAT. Third-party model tokens are extra.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 pr-3 font-medium">Plan</th>
                <th className="px-3 py-3 font-medium">South Africa</th>
                <th className="px-3 py-3 font-medium">Nigeria</th>
                <th className="px-3 py-3 font-medium">Kenya</th>
              </tr>
            </thead>
            <tbody>
              {publicPlans.map((item) => (
                <tr key={item.id} className="border-b border-line">
                  <th className="py-3 pr-3 font-medium">{item.name}</th>
                  {(["za", "ng", "ke"] as Region[]).map((region) => (
                    <td key={region} className="px-3 py-3">
                      {priceLabel(item, region)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-mute">
          Teams is {teamTotal(planById("teams"), account.region, account.teamSeats)}. The unit price does not change with seats.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {SEGMENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSegment(item.id)}
              className={`h-10 rounded-full px-4 text-sm ${segment === item.id ? "bg-ink text-bone" : "bg-[#e7e4dc]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {segment === "individual" ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {REGIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRegion(item.id)}
                className={`h-10 border px-3 text-sm ${account.region === item.id ? "border-ink" : "border-line"}`}
              >
                {item.label}
              </button>
            ))}
            <label className="ml-2 flex items-center gap-2 text-sm">
              Team seats
              <input
                type="number"
                min={1}
                max={250}
                value={account.teamSeats}
                onChange={(event) => setTeamSeats(Number(event.target.value))}
                className="h-10 w-20 border border-line px-2"
              />
            </label>
          </div>
        ) : null}
        <div className="mt-6">
          <PlanCards ids={ids} />
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 pr-3 font-medium">On this plan</th>
                {PLANS.filter((item) => item.segment === segment).map((item) => (
                  <th key={item.id} className="px-2 py-3 font-medium">
                    {item.name}
                    <span className="block text-xs font-normal text-mute">
                      {item.perUser ? teamTotal(item, account.region, account.teamSeats) : priceLabel(item, account.region)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Cloud agents", "cloud"],
                  ["Parallel agents", "parallel"],
                  ["Tab", "tab"],
                  ["Review", "review"],
                  ["Sandbox", "sandbox"],
                  ["Subagents", "subagents"],
                  ["Third-party models", "thirdParty"],
                  ["Shared analytics", "analytics"],
                  ["Private repo", "privateRepo"],
                  ["BYOK", "byok"],
                  ["SSO and private deploy", "controls"],
                ] as const
              ).map(([label, key]) => (
                <tr key={key} className="border-b border-line">
                  <td className="py-3 pr-3">{label}</td>
                  {PLANS.filter((item) => item.segment === segment).map((item) => (
                    <td key={item.id} className="px-2 py-3 text-center">
                      {key === "parallel" ? item.parallel : item[key] ? "Yes" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-xs text-mute">
          These are opening prices. Tax is extra. Third-party model tokens are extra, on the session. Private deployment, dedicated machines, and premium support are not included in the seat price.
        </p>
        <Link to="/enterprise" className="mt-6 inline-flex h-11 items-center border border-ink px-4 text-sm">
          Talk to sales
        </Link>
      </main>
    </SiteFrame>
  );
}
