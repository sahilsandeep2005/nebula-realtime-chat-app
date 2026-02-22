import prisma from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";

function sortPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

export default async function handler(req, res) {
  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  if (req.method === "GET") {
    const conversations = await prisma.dmConversation.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }]
      },
      include: {
        userA: { select: { id: true, name: true, image: true, email: true } },
        userB: { select: { id: true, name: true, image: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ conversations });
  }

  if (req.method === "POST") {
    const { targetUserId } = req.body || {};
    if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });
    if (targetUserId === user.id) return res.status(400).json({ error: "Cannot DM yourself" });

    const [userAId, userBId] = sortPair(user.id, targetUserId);

    const conversation = await prisma.dmConversation.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId },
      include: {
        userA: { select: { id: true, name: true, image: true, email: true } },
        userB: { select: { id: true, name: true, image: true, email: true } }
      }
    });

    return res.json({ conversation });
  }

  return res.status(405).json({ error: "Method not allowed" });
}