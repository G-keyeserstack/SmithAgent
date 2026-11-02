export type SearchFile = { path: string; text: string };

export const WEBHOOK_PATH = "src/checkout/webhook.ts";

export const WEBHOOK_SOURCE = `import { settle } from "./pay"

export async function onChargeWebhook(order: Order) {
  return settle(order)
}
`;

export const DOCS = [
  {
    id: "gateway",
    title: "Gateway charge",
    body: "charge(total, { idempotencyKey }) settles once per key. Reusing the key must not charge again.",
  },
  {
    id: "webhooks",
    title: "Payment webhooks",
    body: "Webhooks land in src/checkout/webhook.ts and call settle. They must pass the order id through.",
  },
];

export type Hit = { path: string; line: number; text: string };

export function searchProject(files: SearchFile[], rules: string, notepad: string, query: string): Hit[] {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);
  if (!words.length) return [];
  const sources = [
    ...files.map((file) => ({ path: file.path, text: file.text })),
    { path: ".makerrrrules", text: rules },
    { path: "notepad", text: notepad },
    ...DOCS.map((doc) => ({ path: `@docs/${doc.id}`, text: `${doc.title}\n${doc.body}` })),
  ];
  const hits: Hit[] = [];
  for (const source of sources) {
    source.text.split("\n").forEach((line, index) => {
      const hay = line.toLowerCase();
      if (words.some((word) => hay.includes(word))) {
        hits.push({ path: source.path, line: index + 1, text: line.trim() });
      }
    });
  }
  return hits.slice(0, 8);
}

export function polish(text: string, format: boolean) {
  if (!format) return text;
  return text.endsWith("\n") ? text : `${text}\n`;
}
