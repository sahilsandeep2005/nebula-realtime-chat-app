import prisma from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Channel id required" });

  const channel = await prisma.channel.findUnique({
    where: { id },
    include: { server: true }
  });

  if (!channel) return res.status(404).json({ error: "Channel not found" });

  const membership = await prisma.serverMember.findFirst({
    where: {
      serverId: channel.serverId,
      userId: user.id
    }
  });

  if (!membership) return res.status(403).json({ error: "Forbidden" });

  // Only OWNER / ADMIN can delete channels
  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    return res.status(403).json({ error: "Only ADMIN/OWNER can delete channels" });
  }

  // Optional safety: prevent deleting the last channel in a server
  const channelCount = await prisma.channel.count({
    where: { serverId: channel.serverId }
  });

  if (channelCount <= 1) {
    return res.status(400).json({ error: "Cannot delete the last channel in a server" });
  }
  await prisma.channel.delete({
    where: { id }
  });

  return res.json({
    success: true,
    deletedChannelId: id,
    serverId: channel.serverId
  });
}  