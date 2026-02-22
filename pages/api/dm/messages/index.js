import prisma from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function handler(req, res) {
  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  if (req.method === "GET") {
    const { channelId } = req.query;
    if (!channelId) return res.status(400).json({ error: "channelId required" });

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { server: true }
    });
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const member = await prisma.serverMember.findFirst({
      where: { serverId: channel.serverId, userId: user.id }
    });
    if (!member) return res.status(403).json({ error: "Forbidden" });

    const messages = await prisma.message.findMany({
      where: { channelId },
      include: { user: { select: { id: true, name: true, image: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take: 200
    });

    return res.json({ messages });
  }

  if (req.method === "POST") {
    const { channelId, content } = req.body || {};
    if (!channelId) return res.status(400).json({ error: "channelId required" });
    if (!content || !content.trim()) return res.status(400).json({ error: "Empty message" });

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const member = await prisma.serverMember.findFirst({
      where: { serverId: channel.serverId, userId: user.id }
    });
    if (!member) return res.status(403).json({ error: "Forbidden" });

    const message = await prisma.message.create({
      data: { channelId, userId: user.id, content: content.trim() },
      include: { user: { select: { id: true, name: true, image: true, email: true } } }
    });

    return res.json({ message });
  }

  return res.status(405).json({ error: "Method not allowed" });
}