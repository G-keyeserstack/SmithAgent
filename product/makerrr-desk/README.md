# Makerrr desk

The live editor. One agent, the same files, on Desktop, IDE, CLI, Cloud, and the SDK.

## How the agent edits a file

It does not invent a new file from scratch.

1. You switch to Act. Plan only talks.
2. You say "add an idempotency key", press Tab, or accept the diff.
3. The agent looks in `src/checkout/pay.ts` for `gateway.charge(order.total)`.
4. It replaces that one call with `gateway.charge(order.total, { idempotencyKey: order.id })`.
5. If you ask for a webhook, it adds `src/checkout/webhook.ts` that calls `settle`.
6. The test reads the file. It fails until that key is present.

Voice: **Voice** listens and runs the task. The reply is spoken back. **Read reply** speaks the last answer again. **Stop** cuts both.

## Run

```bash
cd product/makerrr-desk
npm install
npm run dev
```

Open the IDE, switch to Act, and run the agent. The default plan is Premium so cloud, review, and Tab are on. Free locks cloud and third-party models.

Signed desktop installers are not in this folder. Download in the app opens the same desk.

## Cloud

Pro and above can fan out a second agent. Each agent keeps its own copy of the files. Focus one from Mission control and the editor follows. Ask never writes. Sandbox runs the test on a proposed edit and leaves the file alone. Pro Plus can send a test-writing subagent.

Pricing is split: individuals (South Africa, Nigeria, Kenya), agencies, startups, and corporate teams. The plan on the desk is the plan that gates cloud, Tab, review, and models.
