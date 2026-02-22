import prisma from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function handler(req, res) {
  const auth = await requireUser(req, res);
  if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
  const { user } = auth;

  if (req.method === "GET") {
    const servers = await prisma.server.findMany({
      where: { members: { some: { userId: user.id } } },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ servers });
  }

  if (req.method === "POST") {
    const { name } = req.body || {};
    if (!name || name.trim().length < 2) return res.status(400).json({ error: "Invalid name" });

    const server = await prisma.server.create({
      data: {
        name: name.trim(),
        ownerId: user.id,
        members: { create: { userId: user.id, role: "OWNER" } },
        channels: { create: { name: "general" } }
      },
      include: { channels: true }
    });

    return res.json({ server });
  }

  return res.status(405).json({ error: "Method not allowed" });
}