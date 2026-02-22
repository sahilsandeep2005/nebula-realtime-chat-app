const http = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => handle(req, res));

  const io = new Server(server, {
    path: "/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    // Channel rooms
    socket.on("join-channel", ({ channelId }) => {
      if (!channelId) return;
      socket.join(`channel:${channelId}`);
    });

    socket.on("leave-channel", ({ channelId }) => {
      if (!channelId) return;
      socket.leave(`channel:${channelId}`);
    });

    socket.on("new-message", ({ channelId, message }) => {
      if (!channelId || !message) return;
      io.to(`channel:${channelId}`).emit("message-created", { channelId, message });
    });

    socket.on("message-updated", ({ channelId, message }) => {
      if (!channelId || !message) return;
      io.to(`channel:${channelId}`).emit("message-updated", { channelId, message });
    });

    socket.on("message-deleted", ({ channelId, message }) => {
      if (!channelId || !message) return;
      io.to(`channel:${channelId}`).emit("message-deleted", { channelId, message });
    });

    // DM rooms
    socket.on("join-dm", ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`dm:${conversationId}`);
    });

    socket.on("leave-dm", ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`dm:${conversationId}`);
    });

    socket.on("new-dm-message", ({ conversationId, message }) => {
      if (!conversationId || !message) return;
      io.to(`dm:${conversationId}`).emit("dm-message-created", { conversationId, message });
    });

    socket.on("dm-message-updated", ({ conversationId, message }) => {
      if (!conversationId || !message) return;
      io.to(`dm:${conversationId}`).emit("dm-message-updated", { conversationId, message });
    });

    socket.on("dm-message-deleted", ({ conversationId, message }) => {
      if (!conversationId || !message) return;
      io.to(`dm:${conversationId}`).emit("dm-message-deleted", { conversationId, message });
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });
});