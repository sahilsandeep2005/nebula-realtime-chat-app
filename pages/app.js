import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import io from "socket.io-client";
import Layout from "../components/Layout";

const fetcher = (url) => fetch(url).then((r) => r.json());

function initials(name = "U") {
  return String(name).trim().slice(0, 1).toUpperCase();
}

function Avatar({ user, size = "sm" }) {
  const cls = `avatar ${size === "lg" ? "avatar-lg" : ""}`;
  if (user?.image) return <img src={user.image} alt="" className={cls} />;
  return (
    <div className={`${cls} avatar-fallback`}>
      {initials(user?.name || user?.email || "U")}
    </div>
  );
}

function RoleBadge({ role }) {
  const lower = String(role || "MEMBER").toLowerCase();
  return <span className={`role-badge role-${lower}`}>{role || "MEMBER"}</span>;
}

function MessageItem({
  message,
  isOwn,
  canDelete,
  onEdit,
  onDelete
}) {
  return (
    <div className="message-card">
      <div className="message-top">
        <div className="message-meta">
          <Avatar user={message.user} />
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            <span className="message-author">{message.user?.name || message.user?.email || "User"}</span>
            <span className="message-time">{new Date(message.createdAt).toLocaleString()}</span>
            {message.isEdited ? <span className="edited-tag">edited</span> : null}
          </div>
        </div>

        <div className="message-actions">
          {isOwn && message.content !== "[deleted]" && (
            <button className="action-ghost" onClick={onEdit}>Edit</button>
          )}
          {canDelete && message.content !== "[deleted]" && (
            <button className="action-ghost action-danger" onClick={onDelete}>Delete</button>
          )}
        </div>
      </div>

      <div className={`message-content ${message.content === "[deleted]" ? "deleted" : ""}`}>
        {message.content}
      </div>
    </div>
  );
}

export default function AppPage() {
  const { data: session, status } = useSession();

  const [mode, setMode] = useState("channel"); // channel | dm

  // Server / Channel state
  const { data: serversData, mutate: mutateServers } = useSWR(session ? "/api/servers" : null, fetcher);
  const [activeServerId, setActiveServerId] = useState(null);

  const { data: channelsData, mutate: mutateChannels } = useSWR(
    activeServerId ? `/api/channels?serverId=${activeServerId}` : null,
    fetcher
  );
  const [activeChannelId, setActiveChannelId] = useState(null);

  const { data: messagesData, mutate: mutateMessages } = useSWR(
    mode === "channel" && activeChannelId ? `/api/messages?channelId=${activeChannelId}` : null,
    fetcher
  );

  // Members / Roles / Invites
  const { data: membersData, mutate: mutateMembers } = useSWR(
    activeServerId ? `/api/members?serverId=${activeServerId}` : null,
    fetcher
  );
  const { data: invitesData, mutate: mutateInvites } = useSWR(
    activeServerId ? `/api/invites?serverId=${activeServerId}` : null,
    fetcher
  );

  // DM state
  const { data: dmConversationsData, mutate: mutateDMConversations } = useSWR(
    session ? "/api/dm/conversations" : null,
    fetcher
  );
  const [activeConversationId, setActiveConversationId] = useState(null);

  const { data: dmMessagesData, mutate: mutateDMMessages } = useSWR(
    mode === "dm" && activeConversationId ? `/api/dm/messages?conversationId=${activeConversationId}` : null,
    fetcher
  );

  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);

  // defaults
  useEffect(() => {
    const servers = serversData?.servers || [];
    if (!activeServerId && servers.length) setActiveServerId(servers[0].id);
  }, [serversData, activeServerId]);

  useEffect(() => {
    const channels = channelsData?.channels || [];
    if (activeServerId && channels.length && !activeChannelId) setActiveChannelId(channels[0].id);
  }, [channelsData, activeServerId, activeChannelId]);

  // socket init
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io({ path: "/socket.io" });

      // channel events
      socketRef.current.on("message-created", ({ channelId, message }) => {
        if (channelId === activeChannelId) {
          mutateMessages((prev) => {
            const old = prev?.messages || [];
            if (old.some((m) => m.id === message.id)) return prev;
            return { messages: [...old, message] };
          }, false);
        }
      });

      socketRef.current.on("message-updated", ({ channelId, message }) => {
        if (channelId === activeChannelId) {
          mutateMessages((prev) => ({
            messages: (prev?.messages || []).map((m) => (m.id === message.id ? message : m))
          }), false);
        }
      });

      socketRef.current.on("message-deleted", ({ channelId, message }) => {
        if (channelId === activeChannelId) {
          mutateMessages((prev) => ({
            messages: (prev?.messages || []).map((m) => (m.id === message.id ? message : m))
          }), false);
        }
      });

      // dm events
      socketRef.current.on("dm-message-created", ({ conversationId, message }) => {
        if (conversationId === activeConversationId) {
          mutateDMMessages((prev) => {
            const old = prev?.messages || [];
            if (old.some((m) => m.id === message.id)) return prev;
            return { messages: [...old, message] };
          }, false);
        }
      });

      socketRef.current.on("dm-message-updated", ({ conversationId, message }) => {
        if (conversationId === activeConversationId) {
          mutateDMMessages((prev) => ({
            messages: (prev?.messages || []).map((m) => (m.id === message.id ? message : m))
          }), false);
        }
      });

      socketRef.current.on("dm-message-deleted", ({ conversationId, message }) => {
        if (conversationId === activeConversationId) {
          mutateDMMessages((prev) => ({
            messages: (prev?.messages || []).map((m) => (m.id === message.id ? message : m))
          }), false);
        }
      });
    }
  }, [activeChannelId, activeConversationId, mutateMessages, mutateDMMessages]);

  // room join/leave
  useEffect(() => {
    if (!socketRef.current) return;
    if (mode === "channel" && activeChannelId) socketRef.current.emit("join-channel", { channelId: activeChannelId });
    return () => {
      if (mode === "channel" && activeChannelId) socketRef.current.emit("leave-channel", { channelId: activeChannelId });
    };
  }, [mode, activeChannelId]);

  useEffect(() => {
    if (!socketRef.current) return;
    if (mode === "dm" && activeConversationId) socketRef.current.emit("join-dm", { conversationId: activeConversationId });
    return () => {
      if (mode === "dm" && activeConversationId) socketRef.current.emit("leave-dm", { conversationId: activeConversationId });
    };
  }, [mode, activeConversationId]);

  const servers = serversData?.servers || [];
  const channels = channelsData?.channels || [];
  const messages = messagesData?.messages || [];
  const members = membersData?.members || [];
  const invites = invitesData?.invites || [];
  const dmConversations = dmConversationsData?.conversations || [];
  const dmMessages = dmMessagesData?.messages || [];

  const activeServer = servers.find((s) => s.id === activeServerId);
  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const myMember = members.find((m) => m.user?.email === session?.user?.email);
  const myRole = myMember?.role || channelsData?.myRole;

  const activeDMConversation = dmConversations.find((c) => c.id === activeConversationId);
  const dmPartner = activeDMConversation
    ? (activeDMConversation.userA.email === session?.user?.email ? activeDMConversation.userB : activeDMConversation.userA)
    : null;

  async function createServer() {
    const name = prompt("Server name?");
    if (!name) return;
    const res = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data?.server?.id) {
      await mutateServers();
      setMode("channel");
      setActiveServerId(data.server.id);
      setActiveChannelId(data.server.channels?.[0]?.id || null);
    } else alert(data?.error || "Failed");
  }

  async function createChannel() {
    if (!activeServerId) return;
    const name = prompt("Channel name?");
    if (!name) return;

    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: activeServerId, name })
    });
    const data = await res.json();
    if (data?.channel?.id) {
      await mutateChannels();
      setMode("channel");
      setActiveChannelId(data.channel.id);
    } else alert(data?.error || "Failed");
  }

  async function deleteChannel(channel) {
  if (!channel?.id) return;

  const ok = confirm(`Delete channel #${channel.name}? This will remove its messages too.`);
  if (!ok) return;

  const res = await fetch(`/api/channels/${channel.id}`, {
    method: "DELETE"
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data?.error || "Failed to delete channel");
    return;
  }

  // Refresh channels list
  await mutateChannels();

  // If deleted channel was active, switch to another channel
  if (activeChannelId === channel.id) {
    const refreshed = await fetch(`/api/channels?serverId=${activeServerId}`).then((r) => r.json());
    const nextChannels = refreshed?.channels || [];
    setActiveChannelId(nextChannels[0]?.id || null);
  }
}

  async function createInvite() {
    if (!activeServerId) return;
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: activeServerId, expiresInHours: 72, maxUses: 100 })
    });
    const data = await res.json();
    if (data?.invite?.token) {
      await mutateInvites();
      const url = `${window.location.origin}/invite/${data.invite.token}`;
      try {
        await navigator.clipboard.writeText(url);
        alert(`Invite copied:\n${url}`);
      } catch {
        alert(url);
      }
    } else alert(data?.error || "Failed");
  }

  async function changeRole(targetUserId, role) {
    const res = await fetch("/api/members/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: activeServerId, targetUserId, role })
    });
    const data = await res.json();
    if (data?.member) mutateMembers();
    else alert(data?.error || "Failed");
  }

  async function openDMWithUser(targetUserId) {
    const res = await fetch("/api/dm/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId })
    });
    const data = await res.json();
    if (data?.conversation?.id) {
      await mutateDMConversations();
      setMode("dm");
      setActiveConversationId(data.conversation.id);
    } else alert(data?.error || "Failed");
  }

  async function sendCurrentMessage(e) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    if (mode === "channel") {
      if (!activeChannelId) return;
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: activeChannelId, content })
      });
      const data = await res.json();
      if (data?.message?.id) {
        setDraft("");
        socketRef.current?.emit("new-message", { channelId: activeChannelId, message: data.message });
        mutateMessages((prev) => {
          const old = prev?.messages || [];
          if (old.some((m) => m.id === data.message.id)) return prev;
          return { messages: [...old, data.message] };
        }, false);
      } else alert(data?.error || "Failed");
    } else {
      if (!activeConversationId) return;
      const res = await fetch("/api/dm/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConversationId, content })
      });
      const data = await res.json();
      if (data?.message?.id) {
        setDraft("");
        socketRef.current?.emit("new-dm-message", { conversationId: activeConversationId, message: data.message });
        mutateDMMessages((prev) => {
          const old = prev?.messages || [];
          if (old.some((m) => m.id === data.message.id)) return prev;
          return { messages: [...old, data.message] };
        }, false);
      } else alert(data?.error || "Failed");
    }
  }

  async function editChannelMessage(msg) {
    const content = prompt("Edit message:", msg.content);
    if (!content || content.trim() === msg.content) return;
    const res = await fetch(`/api/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    if (data?.message) {
      socketRef.current?.emit("message-updated", { channelId: activeChannelId, message: data.message });
      mutateMessages((prev) => ({
        messages: (prev?.messages || []).map((m) => (m.id === msg.id ? data.message : m))
      }), false);
    } else alert(data?.error || "Failed");
  }

  async function deleteChannelMessage(msg) {
    if (!confirm("Delete this message?")) return;
    const res = await fetch(`/api/messages/${msg.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data?.message) {
      socketRef.current?.emit("message-deleted", { channelId: activeChannelId, message: data.message });
      mutateMessages((prev) => ({
        messages: (prev?.messages || []).map((m) => (m.id === msg.id ? data.message : m))
      }), false);
    } else alert(data?.error || "Failed");
  }

  async function editDMMessage(msg) {
    const content = prompt("Edit DM:", msg.content);
    if (!content || content.trim() === msg.content) return;
    const res = await fetch(`/api/dm/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    if (data?.message) {
      socketRef.current?.emit("dm-message-updated", { conversationId: activeConversationId, message: data.message });
      mutateDMMessages((prev) => ({
        messages: (prev?.messages || []).map((m) => (m.id === msg.id ? data.message : m))
      }), false);
    } else alert(data?.error || "Failed");
  }

  async function deleteDMMessage(msg) {
    if (!confirm("Delete this DM?")) return;
    const res = await fetch(`/api/dm/messages/${msg.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data?.message) {
      socketRef.current?.emit("dm-message-deleted", { conversationId: activeConversationId, message: data.message });
      mutateDMMessages((prev) => ({
        messages: (prev?.messages || []).map((m) => (m.id === msg.id ? data.message : m))
      }), false);
    } else alert(data?.error || "Failed");
  }

  if (status === "loading") return <div className="login-wrap"><div className="login-card">Loading...</div></div>;
  if (!session) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <p className="muted">You are not logged in.</p>
          <a className="btn btn-primary" href="/">Go to login</a>
        </div>
      </div>
    );
  }

  const currentMessages = mode === "channel" ? messages : dmMessages;

  return (
    <Layout
      left={
        <>
          <div className="panel-header">
            <div className="title-row">
              <div className="title">NebulaChat</div>
              <button className="icon-btn" onClick={createServer}>＋</button>
            </div>
            <div className="chips-row">
              <button
                className={`chip ${mode === "channel" ? "active" : ""}`}
                onClick={() => setMode("channel")}
              >
                Channels
              </button>
              <button
                className={`chip ${mode === "dm" ? "active" : ""}`}
                onClick={() => setMode("dm")}
              >
                DMs
              </button>
            </div>
          </div>

          <div className="panel-scroll">
            <div className="list">
              {servers.map((s) => (
                <button
                  key={s.id}
                  className={`card-btn ${s.id === activeServerId && mode === "channel" ? "active" : ""}`}
                  onClick={() => {
                    setActiveServerId(s.id);
                    setActiveChannelId(null);
                    setMode("channel");
                  }}
                >
                  <div className="row-between">
                    <div className="row" style={{ minWidth: 0 }}>
                      <div className="avatar avatar-fallback">{initials(s.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#f1f5ff", fontSize: 13 }}>{s.name}</div>
                        <div className="muted">Workspace</div>
                      </div>
                    </div>
                    <span className="status-dot" />
                  </div>
                </button>
              ))}
              {servers.length === 0 && (
                <div className="empty-state">
                  No servers yet. Create one using the <b>＋</b> button.
                </div>
              )}
            </div>

            <div className="profile-card">
              <div className="row-between">
                <div className="row">
                  <Avatar user={session.user} size="lg" />
                  <div>
                    <div className="profile-name">{session.user?.name || "User"}</div>
                    <div className="profile-email">{session.user?.email}</div>
                  </div>
                </div>
                <button className="btn" onClick={() => signOut()}>Logout</button>
              </div>
            </div>
          </div>
        </>
      }
      middle={
        mode === "channel" ? (
          <>
            <div className="panel-header">
              <div className="title-row">
                <div>
                  <div className="title">Channels</div>
                  <div className="muted">
                    {activeServer ? `in ${activeServer.name}` : "Pick a server"} {myRole ? `• ${myRole}` : ""}
                  </div>
                </div>

                {(myRole === "OWNER" || myRole === "ADMIN") && (
                  <div className="row" style={{ gap: 6 }}>
                    <button className="icon-btn" onClick={createChannel} disabled={!activeServerId}>+ch</button>
                    <button className="icon-btn" onClick={createInvite} disabled={!activeServerId}>+inv</button>
                  </div>
                )}
              </div>
            </div>

            <div className="panel-scroll">
              <div className="list">
                {channels.map((c) => (
  <div
    key={c.id}
    className={`card-btn ${c.id === activeChannelId ? "active" : ""}`}
    style={{ padding: 0 }}
  >
    <div
      className="row-between"
      style={{ padding: "10px 12px" }}
    >
      <button
        onClick={() => {
          setMode("channel");
          setActiveChannelId(c.id);
        }}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          minWidth: 0,
          color: "inherit"
        }}
      >
        <span style={{ color: "#a5b4fc", fontWeight: 800 }}>#</span>
        <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {c.name}
        </span>
      </button>

      <div className="row" style={{ gap: 6 }}>
        <span className="muted">channel</span>

        {(myRole === "OWNER" || myRole === "ADMIN") && (
          <button
            className="action-ghost action-danger"
            style={{ fontSize: 11, padding: "4px 7px" }}
            onClick={(e) => {
              e.stopPropagation();
              deleteChannel(c);
            }}
            title={`Delete #${c.name}`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  </div>
))}
                {channels.length === 0 && <div className="empty-state">No channels available.</div>}
              </div>

              <div className="section-divider" />
              <div className="section-label">Members</div>
              <div className="list">
                {members.map((m) => (
                  <div key={m.id} className="card member-card">
                    <div className="row-between">
                      <div className="row">
                        <Avatar user={m.user} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{m.user?.name || m.user?.email}</div>
                          <div className="muted">{m.user?.email}</div>
                        </div>
                      </div>
                      <RoleBadge role={m.role} />
                    </div>

                    <div className="member-actions">
                      {m.user?.email !== session.user?.email && (
                        <button className="mini-btn" onClick={() => openDMWithUser(m.user.id)}>DM</button>
                      )}

                      {myRole === "OWNER" && m.role !== "OWNER" && (
                        <>
                          <button className="mini-btn" onClick={() => changeRole(m.user.id, "ADMIN")}>Make Admin</button>
                          <button className="mini-btn" onClick={() => changeRole(m.user.id, "MEMBER")}>Make Member</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {members.length === 0 && <div className="empty-state">No members found.</div>}
              </div>

              <div className="section-divider" />
              <div className="section-label">Active Invites</div>
              <div className="list">
                {invites.slice(0, 6).map((inv) => (
                  <div key={inv.id} className="card invite-card">
                    <div><b>Token:</b> <span className="code-token">{inv.token}</span></div>
                    <div><b>Uses:</b> {inv.useCount}{inv.maxUses ? ` / ${inv.maxUses}` : ""}</div>
                    <div><b>Expires:</b> {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : "Never"}</div>
                  </div>
                ))}
                {invites.length === 0 && <div className="empty-state">No invites yet. Admins can create one.</div>}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="panel-header">
              <div className="title">Direct Messages</div>
              <div className="muted">Start a DM from the member list in any server</div>
            </div>

            <div className="panel-scroll">
              <div className="list">
                {dmConversations.map((conv) => {
                  const partner = conv.userA.email === session.user?.email ? conv.userB : conv.userA;
                  return (
                    <button
                      key={conv.id}
                      className={`card-btn ${conv.id === activeConversationId ? "active" : ""}`}
                      onClick={() => {
                        setMode("dm");
                        setActiveConversationId(conv.id);
                      }}
                    >
                      <div className="row-between">
                        <div className="row">
                          <Avatar user={partner} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{partner?.name || partner?.email || "User"}</div>
                            <div className="muted">Direct conversation</div>
                          </div>
                        </div>
                        <span className="status-dot" />
                      </div>
                    </button>
                  );
                })}
                {dmConversations.length === 0 && <div className="empty-state">No DMs yet.</div>}
              </div>
            </div>
          </>
        )
      }
      right={
        <>
          <div className="chat-header">
            <div>
              <div className="chat-title">
                {mode === "channel"
                  ? (activeChannel ? `# ${activeChannel.name}` : "Select a channel")
                  : (dmPartner ? `DM • ${dmPartner.name || dmPartner.email}` : "Select a DM")}
              </div>
              <div className="chat-subtitle">
                {mode === "channel"
                  ? (activeServer ? `Server: ${activeServer.name}` : "No server selected")
                  : "Private conversation"}
              </div>
            </div>

            <div className="chips-row" style={{ marginTop: 0 }}>
              <span className="glow-pill">{mode === "channel" ? "Realtime Channel" : "Realtime DM"}</span>
            </div>
          </div>

          <div className="chat-feed">
            {currentMessages.map((m) => {
              const own = m.user?.email === session.user?.email;
              const canDelete = mode === "channel" ? (own || myRole === "OWNER" || myRole === "ADMIN") : own;

              return (
                <MessageItem
                  key={m.id}
                  message={m}
                  isOwn={own}
                  canDelete={canDelete}
                  onEdit={() => (mode === "channel" ? editChannelMessage(m) : editDMMessage(m))}
                  onDelete={() => (mode === "channel" ? deleteChannelMessage(m) : deleteDMMessage(m))}
                />
              );
            })}

            {currentMessages.length === 0 && (
              <div className="empty-state">
                {mode === "channel"
                  ? "No messages yet. Send the first one and start the conversation 🚀"
                  : "No DMs yet. Say hi 👋"}
              </div>
            )}
          </div>

          <div className="chat-input-wrap">
            <form onSubmit={sendCurrentMessage} className="chat-input-row">
              <input
                className="chat-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  mode === "channel"
                    ? (activeChannelId ? "Type a message to the channel..." : "Select a channel first")
                    : (activeConversationId ? "Type a direct message..." : "Select a DM first")
                }
                disabled={mode === "channel" ? !activeChannelId : !activeConversationId}
              />
              <button
                className="btn btn-primary"
                disabled={!draft.trim() || (mode === "channel" ? !activeChannelId : !activeConversationId)}
              >
                Send
              </button>
            </form>
          </div>
        </>
      }
    />
  );
}