import { auth } from "@clerk/nextjs/server";
import { getNotifications, getNombreNonLues } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, nonLues] = await Promise.all([
    getNotifications(userId),
    getNombreNonLues(userId),
  ]);

  return NextResponse.json({ notifications, nonLues });
}
