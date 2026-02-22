import prisma from "../../../lib/prisma";
import { requireUser, getServerMembership } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  const { serverId, targetUserId, role } = req.body || {};
  if (!serverId || !targetUserId || !role) {
    return res.status(400).json({ error: "serverId, targetUserId, role required" });
  }
  if (!["ADMIN", "MEMBER"].includes(role)) {
    return res.status(400).json({ error: "Only ADMIN or MEMBER can be assigned here" });
  }

  const acting = await getServerMembership(serverId, user.id);
  if (!acting || acting.role !== "OWNER") {
    return res.status(403).json({ error: "Only OWNER can change roles" });
  }

  const target = await prisma.serverMember.findFirst({
    where: { serverId, userId: targetUserId }
  });
  if (!target) return res.status(404).json({ error: "Member not found" });
  if (target.role === "OWNER") return res.status(400).json({ error: "Cannot change owner role" });

  const updated = await prisma.serverMember.update({
    where: { id: target.id },
    data: { role }
  });

  return res.json({ member: updated });
}