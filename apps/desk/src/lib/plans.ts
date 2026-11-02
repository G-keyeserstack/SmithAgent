export type ModelId = "kimi-k3.1-pro" | "grok-4" | "codestral" | "ollama-local";

export type PlanId = "free" | "plus" | "premium" | "super" | "ultra" | "teams" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  blurb: string;
  usage: string;
  requests: number;
  models: ModelId[];
  cloud: boolean;
  review: boolean;
  tab: boolean;
  thirdParty: boolean;
  priority: boolean;
  early: boolean;
  marketplace: boolean;
  team: boolean;
  controls: boolean;
  popular?: boolean;
};

const ALL: ModelId[] = ["kimi-k3.1-pro", "grok-4", "codestral", "ollama-local"];
const GROK: ModelId[] = ["grok-4", "ollama-local"];

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    blurb: "Limited agent and chat on this desk.",
    usage: "Limited",
    requests: 8,
    models: ["ollama-local"],
    cloud: false,
    review: false,
    tab: false,
    thirdParty: false,
    priority: false,
    early: false,
    marketplace: false,
    team: false,
    controls: false,
  },
  {
    id: "plus",
    name: "Plus",
    price: "$8",
    blurb: "Grok models only. Shared usage pool.",
    usage: "Shared",
    requests: 40,
    models: GROK,
    cloud: false,
    review: false,
    tab: true,
    thirdParty: false,
    priority: false,
    early: false,
    marketplace: false,
    team: false,
    controls: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$30",
    blurb: "Cloud agents, review, and third-party models at list price.",
    usage: "4× Plus",
    requests: 160,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: false,
    early: false,
    marketplace: false,
    team: false,
    controls: false,
    popular: true,
  },
  {
    id: "super",
    name: "Super",
    price: "$100",
    blurb: "Priority access when the desk is busy.",
    usage: "15× Plus",
    requests: 600,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    early: false,
    marketplace: false,
    team: false,
    controls: false,
  },
  {
    id: "ultra",
    name: "Ultra",
    price: "$200",
    blurb: "The largest pool, and first look at new models.",
    usage: "50× Plus",
    requests: 2000,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    early: true,
    marketplace: false,
    team: false,
    controls: false,
  },
  {
    id: "teams",
    name: "Teams",
    price: "$30",
    blurb: "Per seat. Shared rules and a team marketplace.",
    usage: "4–50× Plus",
    requests: 160,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    early: false,
    marketplace: true,
    team: true,
    controls: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    blurb: "SSO-ready controls, audit, and spend limits for the desk.",
    usage: "Pooled",
    requests: 100000,
    models: ALL,
    cloud: true,
    review: true,
    tab: true,
    thirdParty: true,
    priority: true,
    early: true,
    marketplace: true,
    team: true,
    controls: true,
  },
];

export function planById(id: PlanId) {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[2];
}

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
Johannesburg is the default desk.
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
