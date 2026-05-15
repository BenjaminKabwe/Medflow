import { auth } from "@clerk/nextjs/server";
import { marquerToutesCommeLues } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function PATCH() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await marquerToutesCommeLues(userId);
  return NextResponse.json({ success: true });
}
