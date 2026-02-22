import prisma from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function handler(req, res) {
  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;
  const { id } = req.query;

  const message = await prisma.message.findUnique({
    where: { id },
    include: { channel: true }
  });
  if (!message) return res.status(404).json({ error: "Message not found" });

  const membership = await prisma.serverMember.findFirst({
    where: { serverId: message.channel.serverId, userId: user.id }
  });
  if (!membership) return res.status(403).json({ error: "Forbidden" });

  if (req.method === "PATCH") {
    const { content } = req.body || {};
    if (!content || !content.trim()) return res.status(400).json({ error: "Empty content" });

    if (message.userId !== user.id) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { content: content.trim(), isEdited: true },
      include: { user: { select: { name: true, image: true } } }
    });

    return res.json({ message: updated });
  }

  if (req.method === "DELETE") {
    const canDeleteOwn = message.userId === user.id;
    const canDeleteAny = membership.role === "OWNER" || membership.role === "ADMIN";

    if (!canDeleteOwn && !canDeleteAny) {
      return res.status(403).json({ error: "Not allowed to delete this message" });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        content: "[deleted]",
        deletedAt: new Date()
      },
      include: { user: { select: { name: true, image: true } } }
    });

    return res.json({ message: updated });
  }

  return res.status(405).json({ error: "Method not allowed" });
}