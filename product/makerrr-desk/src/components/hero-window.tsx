import { fileByPath, useAgent } from "@/lib/agent-store";
import { PAY_PATH, chargeIsSafe } from "@/lib/plans";

export function HeroWindow() {
  const session = useAgent((state) => state.session);
  const project = useAgent((state) => state.project);
  const fleet = useAgent((state) => state.fleet);
  const pay = fileByPath(project.files, PAY_PATH).text;
  const safe = chargeIsSafe(pay);
  const running = session.column === "running" || session.column === "queued";
  const review = [session, ...fleet].filter((item) => item.column === "done" || item.column === "held");
  const last = [...project.chat].reverse().find((line) => line.role === "agent");

  return (
    <div
      className="relative overflow-hidden rounded-[28px] bg-cover bg-center px-3 py-10 sm:px-8 sm:py-16"
      style={{ backgroundImage: "url(/hero-field.jpg)" }}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-white/50 bg-[#f4f1ea]/95 shadow-[0_30px_80px_rgba(40,30,20,0.28)] backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-[#e4dfd4] px-4 py-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="size-2.5 rounded-full bg-[#e0b4a8]" />
            <i className="size-2.5 rounded-full bg-[#e7d7a8]" />
            <i className="size-2.5 rounded-full bg-[#c9d2b8]" />
          </span>
          <p className="flex-1 text-center text-xs text-[#6d675d]">Makerrr Desktop</p>
        </div>
        <div className="grid min-h-[28rem] lg:grid-cols-[14rem_minmax(0,1fr)_minmax(0,1.05fr)]">
          <aside className="border-b border-[#e4dfd4] p-4 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-semibold tracking-wide text-[#7a756b]">IN PROGRESS {running ? 1 : 0}</p>
            {running ? (
              <p className="mt-3 rounded-lg bg-white/70 px-2 py-2 text-sm">
                <span className="block font-medium">{session.title}</span>
                <span className="text-xs text-[#7a756b]">{session.column}</span>
              </p>
            ) : (
              <p className="mt-3 text-xs text-[#7a756b]">Nothing running.</p>
            )}
            <p className="mt-6 text-[11px] font-semibold tracking-wide text-[#7a756b]">READY FOR REVIEW {review.length}</p>
            <ul className="mt-2 space-y-2">
              {(review.length ? review : [{ id: "wait", title: "Waiting on the diff", column: "queued" }]).slice(0, 4).map((item) => (
                <li key={item.id} className="text-sm">
                  <span className="block truncate font-medium">{item.title}</span>
                  <span className="text-xs text-[#7a756b]">{item.column}</span>
                </li>
              ))}
            </ul>
          </aside>
          <section className="border-b border-[#e4dfd4] p-4 lg:border-b-0 lg:border-r">
            <h2 className="text-sm font-semibold">{session.title}</h2>
            <p className="mt-3 rounded-xl border border-[#e4dfd4] bg-white px-3 py-2 text-sm">{session.brief}</p>
            <p className="mt-4 text-sm leading-6 text-[#3c3934]">{last?.text || "Ask the agent to add the idempotency key. The file changes on this desk."}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#e4dfd4] bg-white px-3 py-2 font-mono text-xs">
              {PAY_PATH}
              <span className={safe ? "text-[#2f6b45]" : "text-[#8a4b32]"}>{safe ? "+1" : "+0"}</span>
            </p>
          </section>
          <section className="bg-white">
            <div className="flex items-center gap-2 border-b border-[#ece7de] px-3 py-2 text-xs text-[#7a756b]">
              <span>←</span>
              <span>→</span>
              <span className="flex-1 truncate rounded-md bg-[#f6f4ee] px-2 py-1">http://localhost:3000</span>
            </div>
            <div className="px-6 py-8">
              <p className="font-display text-4xl italic text-[#2c2926]">Northline</p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#4d4943]">
                Software gets made by a small team and an agent that shows its work.
              </p>
              <p className="mt-4 inline-block rounded bg-[#efe7c8] px-1 text-sm">
                {safe ? "A charge settles once." : "A retried charge can settle twice."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
