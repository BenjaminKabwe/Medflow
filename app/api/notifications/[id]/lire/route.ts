import { auth } from "@clerk/nextjs/server";
import { marquerCommeLue } from "@/lib/notifications";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const notif = await db.notification.findUnique({ where: { id } });
  if (!notif || notif.user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await marquerCommeLue(id);
  return NextResponse.json({ success: true });
}
