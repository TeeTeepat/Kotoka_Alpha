import { cookies } from "next/headers";
import { prisma } from "./db";

export async function getOrCreateUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }
  return null;
}
