import prisma from "../../../lib/prisma";
import { requireUser, getServerMembership, canCreateInvite } from "../../../lib/auth";
import crypto from "crypto";

function genToken() {
  return crypto.randomBytes(12).toString("hex");
}

export default async function handler(req, res) {
  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  if (req.method === "GET") {
    const { serverId } = req.query;
    if (!serverId) return res.status(400).json({ error: "serverId required" });

    const member = await getServerMembership(serverId, user.id);
    if (!member) return res.status(403).json({ error: "Forbidden" });

    const invites = await prisma.invite.findMany({
      where: { serverId, isActive: true },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ invites });
  }

  if (req.method === "POST") {
    const { serverId, expiresInHours = 24, maxUses = 50 } = req.body || {};
    if (!serverId) return res.status(400).json({ error: "serverId required" });

    const member = await getServerMembership(serverId, user.id);
    if (!canCreateInvite(member)) return res.status(403).json({ error: "Only ADMIN/OWNER can create invites" });

    const invite = await prisma.invite.create({
      data: {
        serverId,
        token: genToken(),
        createdById: user.id,
        expiresAt: expiresInHours ? new Date(Date.now() + Number(expiresInHours) * 3600 * 1000) : null,
        maxUses: maxUses ? Number(maxUses) : null
      }
    });

    return res.json({ invite });
  }

  return res.status(405).json({ error: "Method not allowed" });
}