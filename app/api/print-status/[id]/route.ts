import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BambuClient } from "@/lib/bambu";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Awaiting the params object properly
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing Printer ID" }, { status: 400 });
  }

  try {
    // 1. Fetch printer details from DB to get credentials
    // Ideally use Service Role to read encrypted fields if RLS blocks, but user should have access to own data.
    // WARNING: access_code_encrypted should be selectable by user.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!, // Use service key to ensure we can decrypt safely on server only
    );

    const { data: printer, error } = await supabase
      .from("printers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !printer) {
      return NextResponse.json({ error: "Printer not found" }, { status: 404 });
    }

    // 2. Decrypt code
    const accessCode = BambuClient.decryptCode(printer.access_code_encrypted);

    // 3. Connect and Fetch Status
    const client = new BambuClient({
      ip: printer.ip,
      accessCode,
      serial: printer.serial,
    });
    try {
      await client.connect();
      const status = await client.getPrintStatus();
      console.log("status: ", status);
      return NextResponse.json(status);
    } finally {
      client.disconnect();
    }
  } catch (error: unknown) {
    console.error("Status Fetch Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
