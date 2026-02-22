import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <p className="muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      {/* Decorative gradient blobs */}
      <div
        style={{
          position: "fixed",
          top: -80,
          left: -80,
          width: 260,
          height: 260,
          borderRadius: "999px",
          background: "rgba(99,102,241,0.35)",
          filter: "blur(40px)",
          zIndex: 0
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: "999px",
          background: "rgba(236,72,153,0.25)",
          filter: "blur(40px)",
          zIndex: 0
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -80,
          left: "35%",
          width: 280,
          height: 280,
          borderRadius: "999px",
          background: "rgba(20,184,166,0.18)",
          filter: "blur(40px)",
          zIndex: 0
        }}
      />

      <div className="login-card" style={{ position: "relative", zIndex: 2 }}>
        <div className="row-between" style={{ alignItems: "flex-start", gap: 12 }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "#dbeafe",
                fontSize: 12,
                marginBottom: 14
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "#34d399",
                  boxShadow: "0 0 10px rgba(52,211,153,0.55)"
                }}
              />
              Realtime Collaboration App
            </div>

            <h1 className="login-title" style={{ marginBottom: 8 }}>
              NebulaChat ✨
            </h1>

            <p className="login-sub" style={{ maxWidth: 460 }}>
              A modern Discord-like chat platform with realtime messaging,
              server channels, roles, invites and DMs — built with Next.js,
              Socket.io, Prisma and PostgreSQL.
            </p>
          </div>

          <span className="glow-pill">Portfolio Project</span>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            gap: 10
          }}
        >
          <div className="card invite-card">
            <div style={{ fontWeight: 700 }}>⚡ Realtime</div>
            <div className="muted">Socket.io live messaging</div>
          </div>
          <div className="card invite-card">
            <div style={{ fontWeight: 700 }}>🔐 Auth</div>
            <div className="muted">GitHub OAuth with NextAuth</div>
          </div>
          <div className="card invite-card">
            <div style={{ fontWeight: 700 }}>🗄️ DB-backed</div>
            <div className="muted">Prisma + PostgreSQL persistence</div>
          </div>
        </div>

        {!session ? (
          <div style={{ marginTop: 20 }}>
            <button
              className="btn btn-primary"
              onClick={() => signIn("github")}
              style={{ minWidth: 210 }}
            >
              Continue with GitHub
            </button>

            <p className="muted" style={{ marginTop: 10 }}>
              Sign in to access your servers, channels and DMs.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <div className="card invite-card" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: "#f1f5ff" }}>
                Logged in as {session.user?.name || session.user?.email}
              </div>
              <div className="muted">{session.user?.email}</div>
            </div>

            <div className="row" style={{ gap: 10 }}>
              <a className="btn btn-primary" href="/app">
                Open App
              </a>
              <button className="btn" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}