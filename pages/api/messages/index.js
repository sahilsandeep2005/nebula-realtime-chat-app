import { getServerSession } from "next-auth/next";
import {authOptions} from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(401).json({ error: "User not found" });

  if (req.method === "GET") {
    const { channelId } = req.query;
    if (!channelId) return res.status(400).json({ error: "channelId required" });

    // membership check via channel->server
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
      include: { user: { select: { name: true, image: true } } },
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
      data: {
        channelId,
        userId: user.id,
        content: content.trim()
      },
      include: { user: { select: { name: true, image: true } } }
    });

    return res.json({ message });
  }

  res.status(405).json({ error: "Method not allowed" });
}