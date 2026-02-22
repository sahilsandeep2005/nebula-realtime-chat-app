import prisma from "../../../lib/prisma";
import { requireUser, getServerMembership, canCreateChannel } from "../../../lib/auth";

export default async function handler(req, res) {
  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  if (req.method === "GET") {
    const { serverId } = req.query;
    if (!serverId) return res.status(400).json({ error: "serverId required" });

    const member = await getServerMembership(serverId, user.id);
    if (!member) return res.status(403).json({ error: "Forbidden" });

    const channels = await prisma.channel.findMany({
      where: { serverId },
      orderBy: { createdAt: "asc" }
    });

    return res.json({ channels, myRole: member.role });
  }

  if (req.method === "POST") {
    const { serverId, name } = req.body || {};
    if (!serverId) return res.status(400).json({ error: "serverId required" });
    if (!name || name.trim().length < 2) return res.status(400).json({ error: "Invalid name" });

    const member = await getServerMembership(serverId, user.id);
    if (!canCreateChannel(member)) return res.status(403).json({ error: "Only ADMIN/OWNER can create channels" });

    const channel = await prisma.channel.create({
      data: { serverId, name: name.trim() }
    });
    return res.json({ channel });
  }

  return res.status(405).json({ error: "Method not allowed" });
}