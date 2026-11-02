import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SETUP = `
mount -t tmpfs tmpfs /workspace || exit 97
if [ -e /workspace/package.json ]; then
  echo "Desk files are still visible. The command was not run."
  exit 97
fi
echo "Desk files are covered. This process has no network."
cd "$1" || exit 98
timeout --signal=KILL 8s bash -lc "$2"
status=$?
if [ "$status" -eq 124 ] || [ "$status" -eq 137 ]; then
  echo
  echo "Stopped after 8 seconds."
fi
exit "$status"
`;

export async function executeIsolated(command: string): Promise<{ code: number; output: string }> {
  const work = await mkdtemp(join(tmpdir(), "makerrr-os-"));
  try {
    const output = await new Promise<string>((resolve) => {
      const child = spawn(
        "unshare",
        ["--net", "--mount", "--pid", "--fork", "--mount-proc", "--propagation", "private", "bash", "-c", SETUP, "bash", work, command],
        { stdio: ["ignore", "pipe", "pipe"] },
      );
      let text = "";
      const take = (chunk: Buffer) => {
        if (text.length < 4000) text += chunk.toString("utf8");
      };
      child.stdout.on("data", take);
      child.stderr.on("data", take);
      const timer = setTimeout(() => child.kill("SIGKILL"), 12000);
      child.on("error", (error) => {
        clearTimeout(timer);
        resolve(error.message);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        text += `\nexit ${code ?? "unknown"}`;
        resolve(text.trim());
      });
    });
    return { code: Number(/exit (\d+)/.exec(output)?.[1] ?? 1), output: `Isolated mount and network namespace.\n${output}` };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
