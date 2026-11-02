export type ModelId = "kimi-k3.1-pro" | "grok-4" | "codestral" | "ollama-local";

export type PlanId =
  | "free"
  | "developer"
  | "pro"
  | "pro-plus"
  | "teams"
  | "agency-starter"
  | "agency-growth"
  | "agency-scale"
  | "agency-enterprise"
  | "startup-launch"
  | "startup-growth"
  | "startup-scale"
  | "startup-venture"
  | "corporate-starter"
  | "corporate-growth"
  | "corporate-scale"
  | "corporate-enterprise";

export type Region = "za" | "ng" | "ke";
export type Segment = "individual" | "agency" | "startup" | "corporate";

export type Plan = {
  id: PlanId;
  name: string;
  segment: Segment;
  price: string;
  prices?: Record<Region, string>;
  amounts?: Record<Region, number>;
  unit?: "/month" | "/user";
  perUser?: boolean;
  seats: string;
  blurb: string;
  requests: number;
  models: ModelId[];
  cloud: boolean;
  review: boolean;
  tab: boolean;
  thirdParty: boolean;
  priority: boolean;
  marketplace: boolean;
  team: boolean;
  controls: boolean;
  sandbox: boolean;
  subagents: boolean;
  parallel: number;
  byok: boolean;
  privateRepo: boolean;
  analytics: boolean;
  popular?: boolean;
};

const ALL: ModelId[] = ["kimi-k3.1-pro", "grok-4", "codestral", "ollama-local"];
const GROK: ModelId[] = ["grok-4", "ollama-local"];
const LOCAL: ModelId[] = ["ollama-local"];

const LEGACY: Record<string, PlanId> = {
  plus: "developer",
  premium: "pro",
  super: "pro-plus",
  ultra: "pro-plus",
  teams: "teams",
  enterprise: "corporate-enterprise",
};

function plan(
  partial: Pick<Plan, "id" | "name" | "segment" | "price" | "seats" | "blurb" | "requests" | "parallel"> &
    Partial<Plan>,
): Plan {
  return {
    models: LOCAL,
    cloud: false,
    review: false,
    tab: false,
    thirdParty: false,
    priority: false,
    marketplace: false,
    team: false,
    controls: false,
    sandbox: false,
    subagents: false,
    byok: false,
    privateRepo: false,
    analytics: false,
    ...partial,
  };
}

export const PLANS: Plan[] = [
  plan({
    id: "free",
    name: "Free",
    segment: "individual",
    price: "R0",
    amounts: { za: 0, ng: 0, ke: 0 },
    seats: "1",
    blurb: "Local model only. Enough to try the desk.",
    requests: 8,
    parallel: 1,
  }),
  plan({
    id: "developer",
    name: "Developer",
    segment: "individual",
    price: "R99",
    amounts: { za: 99, ng: 2500, ke: 250 },
    unit: "/month",
    seats: "1",
    blurb: "Grok on the desk. Tab is on. Cloud stays off.",
    requests: 40,
    models: GROK,
    tab: true,
    parallel: 1,
  }),
  plan({
    id: "pro",
    name: "Pro",
    segment: "individual",
    price: "R199",
    amounts: { za: 199, ng: 7500, ke: 699 },
    unit: "/month",
    seats: "1",
    blurb: "Cloud agents, review, sandbox, and third-party models at list price.",
    requests: 160,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    sandbox: true,
    parallel: 2,
    popular: true,
  }),
  plan({
    id: "pro-plus",
    name: "Pro Plus",
    segment: "individual",
    price: "R399",
    amounts: { za: 399, ng: 14900, ke: 1399 },
    unit: "/month",
    seats: "1",
    blurb: "Parallel agents and a test-writing subagent.",
    requests: 600,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    sandbox: true,
    subagents: true,
    parallel: 4,
  }),
  plan({
    id: "teams",
    name: "Teams",
    segment: "individual",
    price: "R299",
    amounts: { za: 299, ng: 11900, ke: 1099 },
    unit: "/user",
    perUser: true,
    seats: "per user",
    blurb: "One bill, shared credits, private repos, and usage for the whole team.",
    requests: 400,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    marketplace: true,
    team: true,
    sandbox: true,
    subagents: true,
    parallel: 4,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
  plan({
    id: "agency-starter",
    name: "Agency Starter",
    segment: "agency",
    price: "$9",
    seats: "5–10",
    blurb: "Per developer. Shared credits and one bill.",
    requests: 200,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    marketplace: true,
    team: true,
    sandbox: true,
    parallel: 2,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
  plan({
    id: "agency-growth",
    name: "Agency Growth",
    segment: "agency",
    price: "$8",
    seats: "11–25",
    blurb: "Lower seat price. Subagents included.",
    requests: 500,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    marketplace: true,
    team: true,
    sandbox: true,
    subagents: true,
    parallel: 4,
    byok: true,
    privateRepo: true,
    analytics: true,
    popular: true,
  }),
  plan({
    id: "agency-scale",
    name: "Agency Scale",
    segment: "agency",
    price: "$7",
    seats: "26–50",
    blurb: "Priority when the desk is busy.",
    requests: 1000,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    marketplace: true,
    team: true,
    sandbox: true,
    subagents: true,
    parallel: 6,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
  plan({
    id: "agency-enterprise",
    name: "Agency Enterprise",
    segment: "agency",
    price: "Talk to us",
    seats: "50+",
    blurb: "Negotiated. Private deployment priced on its own.",
    requests: 100000,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    marketplace: true,
    team: true,
    controls: true,
    sandbox: true,
    subagents: true,
    parallel: 8,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
  plan({
    id: "startup-launch",
    name: "Startup Launch",
    segment: "startup",
    price: "$60",
    seats: "5",
    blurb: "A small team shipping without a large bench.",
    requests: 200,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    sandbox: true,
    parallel: 2,
    team: true,
    analytics: true,
  }),
  plan({
    id: "startup-growth",
    name: "Startup Growth",
    segment: "startup",
    price: "$110",
    seats: "10",
    blurb: "More seats, subagents, shared credits.",
    requests: 400,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    marketplace: true,
    team: true,
    sandbox: true,
    subagents: true,
    parallel: 3,
    byok: true,
    privateRepo: true,
    analytics: true,
    popular: true,
  }),
  plan({
    id: "startup-scale",
    name: "Startup Scale",
    segment: "startup",
    price: "$250",
    seats: "25",
    blurb: "Priority access and a wider fan-out.",
    requests: 800,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    marketplace: true,
    team: true,
    sandbox: true,
    subagents: true,
    parallel: 4,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
  plan({
    id: "startup-venture",
    name: "Venture Portfolio",
    segment: "startup",
    price: "Custom",
    seats: "50+",
    blurb: "One firm, many portfolio companies. Priced with the firm.",
    requests: 100000,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    marketplace: true,
    team: true,
    controls: true,
    sandbox: true,
    subagents: true,
    parallel: 8,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
  plan({
    id: "corporate-starter",
    name: "Corporate Starter",
    segment: "corporate",
    price: "$500",
    seats: "25",
    blurb: "Banks, telcos, insurers, and integrators. One admin bill.",
    requests: 400,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    marketplace: true,
    team: true,
    sandbox: true,
    subagents: true,
    parallel: 4,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
  plan({
    id: "corporate-growth",
    name: "Corporate Growth",
    segment: "corporate",
    price: "$900",
    seats: "50",
    blurb: "Usage monitoring and model governance for the desk.",
    requests: 800,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    marketplace: true,
    team: true,
    sandbox: true,
    subagents: true,
    parallel: 6,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
  plan({
    id: "corporate-scale",
    name: "Corporate Scale",
    segment: "corporate",
    price: "$1,500",
    seats: "100",
    blurb: "SSO-ready controls and a private-deployment switch.",
    requests: 2000,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    marketplace: true,
    team: true,
    controls: true,
    sandbox: true,
    subagents: true,
    parallel: 8,
    byok: true,
    privateRepo: true,
    analytics: true,
    popular: true,
  }),
  plan({
    id: "corporate-enterprise",
    name: "Enterprise",
    segment: "corporate",
    price: "Custom",
    seats: "250+",
    blurb: "Dedicated capacity and support. Private infrastructure is quoted apart from the seats.",
    requests: 100000,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    marketplace: true,
    team: true,
    controls: true,
    sandbox: true,
    subagents: true,
    parallel: 12,
    byok: true,
    privateRepo: true,
    analytics: true,
  }),
];

export function planById(id: string) {
  const mapped = LEGACY[id] ?? id;
  return PLANS.find((item) => item.id === mapped) ?? PLANS[2];
}

export function money(region: Region, amount: number) {
  const digits = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (region === "za") return `R${digits}`;
  if (region === "ng") return `₦${digits}`;
  return `KES ${digits}`;
}

export function priceFor(item: Plan, region: Region) {
  if (item.amounts) return money(region, item.amounts[region]);
  return item.prices?.[region] ?? item.price;
}

export function priceLabel(item: Plan, region: Region) {
  const base = priceFor(item, region);
  return item.unit ? `${base}${item.unit}` : base;
}

export function teamTotal(item: Plan, region: Region, seats: number) {
  if (!item.amounts || !item.perUser) return priceLabel(item, region);
  const count = Math.max(1, seats);
  return `${money(region, item.amounts[region] * count)}/month for ${count}`;
}

export const PUBLIC_PLANS: PlanId[] = ["free", "developer", "pro", "pro-plus", "teams"];

export const PAY_PATH = "src/checkout/pay.ts";
export const TEST_PATH = "src/checkout/pay.test.ts";
export const RULES_PATH = ".makerrrrules";

export const PAY_ORIGINAL = `export async function settle(order: Order) {
  await gateway.charge(order.total)
  return order.id
}
`;

export const PAY_FIXED = `export async function settle(order: Order) {
  await gateway.charge(order.total, { idempotencyKey: order.id })
  return order.id
}
`;

export const TEST_SOURCE = `import { settle } from "./pay"

test("rejects a second settle with the same order id", async () => {
  const order = { id: "rosebank-18", total: 240 }
  await settle(order)
  await expect(settle(order)).rejects.toThrow(/idempotency/i)
})
`;

export const RULES_DEFAULT = `Settle a checkout once.
Use an idempotency key on every charge.
The desk stays on your machine until a cloud agent starts.
`;

export function chargeIsSafe(source: string) {
  return source.includes("idempotencyKey");
}

export function rulesBlockEdit(rules: string) {
  return /do not (change|edit) pay/i.test(rules);
}

export function proposedDiff(source: string) {
  if (chargeIsSafe(source)) {
    return [{ kind: "ctx" as const, text: source.trimEnd() }];
  }
  return [
    { kind: "ctx" as const, text: "export async function settle(order: Order) {" },
    { kind: "del" as const, text: "  await gateway.charge(order.total)" },
    {
      kind: "add" as const,
      text: "  await gateway.charge(order.total, { idempotencyKey: order.id })",
    },
    { kind: "ctx" as const, text: "  return order.id" },
    { kind: "ctx" as const, text: "}" },
  ];
}

export function applyIdempotency(source: string) {
  if (chargeIsSafe(source)) return source;
  if (!source.includes("gateway.charge(order.total)")) return source;
  return source.replace(
    "gateway.charge(order.total)",
    "gateway.charge(order.total, { idempotencyKey: order.id })",
  );
}

export function runCheckoutTest(source: string, rules: string) {
  if (rulesBlockEdit(rules) && !chargeIsSafe(source)) {
    return { ok: false, output: "Rules blocked the charge change. Test did not pass." };
  }
  if (!chargeIsSafe(source)) {
    return {
      ok: false,
      output: [
        TEST_PATH,
        "  ✗ rejects a second settle with the same order id",
        "    charge has no idempotency key",
        "  1 fail",
      ].join("\n"),
    };
  }
  return {
    ok: true,
    output: [TEST_PATH, "  ✓ rejects a second settle with the same order id", "  1 pass"].join("\n"),
  };
}

export function tabGhost(source: string, enabled: boolean) {
  if (!enabled) return "";
  if (chargeIsSafe(source)) return "";
  if (!source.includes("gateway.charge(order.total)")) return "";
  return "{ idempotencyKey: order.id }";
}

export type ReviewNote = {
  id: string;
  path: string;
  line: number;
  text: string;
};

export function reviewFile(source: string): ReviewNote[] {
  if (chargeIsSafe(source) || !source.includes("gateway.charge")) return [];
  return [
    {
      id: "rev-charge",
      path: PAY_PATH,
      line: 2,
      text: "A retried settle can charge Rosebank twice. Pass order.id as the idempotency key.",
    },
  ];
}
