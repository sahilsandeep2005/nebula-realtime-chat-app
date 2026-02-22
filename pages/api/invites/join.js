import prisma from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "token required" });

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { server: true }
  });

  if (!invite || !invite.isActive) return res.status(404).json({ error: "Invalid invite" });
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return res.status(400).json({ error: "Invite expired" });
  }
  if (invite.maxUses && invite.useCount >= invite.maxUses) {
    return res.status(400).json({ error: "Invite usage limit reached" });
  }

  await prisma.serverMember.upsert({
    where: { serverId_userId: { serverId: invite.serverId, userId: user.id } },
    update: {},
    create: { serverId: invite.serverId, userId: user.id, role: "MEMBER" }
  });

  await prisma.invite.update({
    where: { id: invite.id },
    data: { useCount: { increment: 1 } }
  });

  return res.json({ serverId: invite.serverId, serverName: invite.server.name });
}