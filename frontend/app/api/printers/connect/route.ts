import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { BambuClient } from "@/lib/bambu";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip, accessCode, serial } = body;

    // 1. Authenticate User
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify connection
    const client = new BambuClient({ ip, accessCode, serial });
    try {
      await client.connect();
      const status = await client.getPrintStatus();
      return NextResponse.json({ success: true, status });
    } finally {
      client.disconnect();
    }
  } catch (error: unknown) {
    console.error("Printer Connect Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
