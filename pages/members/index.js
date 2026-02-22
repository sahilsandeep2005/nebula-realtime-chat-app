import prisma from "../../../lib/prisma";
import { requireUser, getServerMembership } from "../../../lib/auth";

export default async function handler(req, res) {
  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { serverId } = req.query;
  if (!serverId) return res.status(400).json({ error: "serverId required" });

  const membership = await getServerMembership(serverId, user.id);
  if (!membership) return res.status(403).json({ error: "Forbidden" });

  const members = await prisma.serverMember.findMany({
    where: { serverId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" }
  });

  return res.json({ members });
}