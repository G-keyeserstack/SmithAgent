import { useEffect, useRef, useState } from "react";

const ASK = "Add an idempotency key on the Rosebank charge";
const CODE = [
  "export async function pay(request: PayRequest) {",
  "  const idempotencyKey = requestId;",
  "  if (seen.has(idempotencyKey)) return existing;",
  "  return settle(idempotencyKey);",
  "}",
].join("\n");

export function HeroWindow() {
  const [step, setStep] = useState(0);
  const demo = useRef<HTMLVideoElement>(null);
  const total = ASK.length + CODE.length;

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((current) => (current > total + 18 ? 0 : current + 1));
    }, 42);
    return () => window.clearInterval(id);
  }, [total]);

  useEffect(() => {
    const video = demo.current;
    if (!video) return;
    video.muted = true;
    const start = () => {
      void video.play().catch(() => undefined);
    };
    start();
    video.addEventListener("canplay", start);
    return () => video.removeEventListener("canplay", start);
  }, []);

  const prompt = ASK.slice(0, step);
  const code = CODE.slice(0, Math.max(0, step - ASK.length));
  const writing = step > ASK.length;

  return (
    <div
      className="relative overflow-hidden rounded-[28px] bg-cover bg-center px-3 py-10 sm:px-8 sm:py-16"
      style={{ backgroundImage: "url(/hero-field.jpg)" }}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-white/50 bg-[#f4f1ea]/95 shadow-[0_30px_80px_rgba(40,30,20,0.28)] backdrop-blur-sm">
        <div className="flex items-center gap-3 border-b border-[#e4dfd4] bg-white px-4 py-2">
          <img src="/makerrr-mark.png" alt="Makerrr" className="h-9 w-auto bg-white" />
          <p className="ml-auto text-xs text-[#6d675d]">Agent is typing</p>
        </div>
        <div className="grid min-h-[26rem] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="border-b border-[#e4dfd4] p-4 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-semibold tracking-wide text-[#7a756b]">AGENT</p>
            <p className="mt-3 min-h-16 rounded-xl border border-[#e4dfd4] bg-white px-3 py-2 font-mono text-sm">
              {prompt}
              {step <= ASK.length ? <span className="ml-0.5 inline-block h-4 w-px bg-ink align-middle" /> : null}
            </p>
            <p className="mt-4 text-sm leading-6 text-[#3c3934]">
              {writing ? "Writing src/checkout/pay.ts. The key stops a retry from settling twice." : "Reading the charge path."}
            </p>
          </section>
          <section className="bg-[#1c1b19] p-4 text-[#f3f0e7]">
            <p className="text-xs text-white/50">src/checkout/pay.ts</p>
            <pre className="mt-3 min-h-40 overflow-x-auto font-mono text-[13px] leading-6">
              {code}
              {writing ? <span className="ml-0.5 inline-block h-4 w-px bg-white align-middle" /> : null}
            </pre>
          </section>
        </div>
        <video
          ref={demo}
          className="aspect-video max-h-64 w-full bg-black object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src="/makerrr-agent.mp4"
        />
      </div>
    </div>
  );
}
