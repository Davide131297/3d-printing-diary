import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { BambuClient } from "@/lib/bambu";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip, accessCode, serial } = body;

    console.log("Connect Request:", {
      ip,
      serial,
      accessCodeLen: accessCode?.length,
    });

    // 1. Authenticate User
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify connection
    const client = new BambuClient({ ip, accessCode, serial });
    try {
      // Attempt to connect (and verify functionality)
      await client.connect();
      const status = await client.getPrintStatus();

      // 3. Return success without saving to DB (user requested cookie-only storage)
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
