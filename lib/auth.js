import { getServerSession } from "next-auth/next";
import prisma from "./prisma";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export async function requireUser(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return { error: { status: 401, message: "Unauthorized" } };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) return { error: { status: 401, message: "User not found" } };
  return { user, session };
}

export async function getServerMembership(serverId, userId) {
  return prisma.serverMember.findFirst({
    where: { serverId, userId }
  });
}

export function canManageServer(member) {
  return member && (member.role === "OWNER" || member.role === "ADMIN");
}

export function canCreateChannel(member) {
  return canManageServer(member);
}

export function canCreateInvite(member) {
  return canManageServer(member);
}