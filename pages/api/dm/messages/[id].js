import prisma from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export default async function handler(req, res) {
  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;
  const { id } = req.query;

  const message = await prisma.dmMessage.findUnique({
    where: { id },
    include: { conversation: true }
  });
  if (!message) return res.status(404).json({ error: "DM message not found" });

  const conv = message.conversation;
  if (![conv.userAId, conv.userBId].includes(user.id)) return res.status(403).json({ error: "Forbidden" });

  if (req.method === "PATCH") {
    const { content } = req.body || {};
    if (!content || !content.trim()) return res.status(400).json({ error: "Empty content" });
    if (message.userId !== user.id) return res.status(403).json({ error: "Edit own DM messages only" });

    const updated = await prisma.dmMessage.update({
      where: { id },
      data: { content: content.trim(), isEdited: true },
      include: { user: { select: { id: true, name: true, image: true } } }
    });
    return res.json({ message: updated });
  }

  if (req.method === "DELETE") {
    if (message.userId !== user.id) return res.status(403).json({ error: "Delete own DM messages only" });

    const updated = await prisma.dmMessage.update({
      where: { id },
      data: { content: "[deleted]", deletedAt: new Date() },
      include: { user: { select: { id: true, name: true, image: true } } }
    });
    return res.json({ message: updated });
  }

  return res.status(405).json({ error: "Method not allowed" });
}