import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function InviteJoinPage() {
  const router = useRouter();
  const { token } = router.query;
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function join() {
    if (!token) return;
    setLoading(true);
    setMsg("");

    const res = await fetch("/api/invites/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const data = await res.json();

    if (data?.serverId) {
      setMsg(`Joined ${data.serverName} ✅ Redirecting...`);
      setTimeout(() => router.push("/app"), 800);
    } else {
      setMsg(data?.error || "Failed to join");
    }
    setLoading(false);
  }

  if (status === "loading") return <div className="login-wrap"><div className="login-card">Loading...</div></div>;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div>
            <h2 className="login-title" style={{ fontSize: 22 }}>Join Server</h2>
            <p className="login-sub">
              You were invited to a NebulaChat server.
            </p>
          </div>
          <span className="glow-pill">Invite</span>
        </div>

        <div style={{ marginTop: 12 }} className="card invite-card">
          <div><b>Token:</b> <span className="code-token">{token}</span></div>
        </div>

        <div className="row" style={{ marginTop: 14, gap: 10 }}>
          <button className="btn btn-primary" onClick={join} disabled={!token || loading}>
            {loading ? "Joining..." : "Join Server"}
          </button>
          <a className="btn" href="/app">Back</a>
        </div>

        {msg ? <p className="muted" style={{ marginTop: 12 }}>{msg}</p> : null}
      </div>
    </div>
  );
}