import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFrame } from "@/components/chrome";
import { useAgent } from "@/lib/agent-store";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
  const navigate = useNavigate();
  const account = useAgent((state) => state.account);
  const signIn = useAgent((state) => state.signIn);
  const register = useAgent((state) => state.register);
  const signOut = useAgent((state) => state.signOut);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = creating ? await register(email, password, name) : await signIn(email, password);
    setError(message);
    if (!message) void navigate({ to: "/" });
  }

  return (
    <SiteFrame>
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-medium">{creating ? "Create a desk" : "Sign in"}</h1>
        <p className="mt-2 text-sm text-mute">
          The account stays in this browser. A job will not start until you are signed in.
        </p>
        {account.signedIn ? (
          <div className="mt-6 rounded-2xl border border-line bg-paper p-4 text-sm">
            <p>Signed in as {account.name} · {account.email}</p>
            <button type="button" onClick={() => signOut()} className="mt-4 h-11 bg-ink px-4 text-bone">
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            {creating ? (
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className="h-11 w-full border border-line bg-paper px-3 text-sm"
              />
            ) : null}
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="username"
              className="h-11 w-full border border-line bg-paper px-3 text-sm"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete={creating ? "new-password" : "current-password"}
              className="h-11 w-full border border-line bg-paper px-3 text-sm"
            />
            {error ? <p className="text-sm text-clay">{error}</p> : null}
            <button type="submit" className="h-11 w-full bg-ink text-sm text-bone">
              {creating ? "Create desk" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating((value) => !value);
                setError("");
              }}
              className="text-sm text-mute"
            >
              {creating ? "I already have a desk" : "Create a desk"}
            </button>
          </form>
        )}
        <p className="mt-6 text-sm">
          <Link to="/docs" className="text-ink">Read the docs</Link>
        </p>
      </main>
    </SiteFrame>
  );
}
