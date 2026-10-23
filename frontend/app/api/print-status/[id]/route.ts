import { NextRequest, NextResponse } from "next/server";
import { getPrinterById } from "@/lib/db";
import { BambuClient } from "@/lib/bambu";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing Printer ID" }, { status: 400 });
  }

  try {
    // 1. Fetch printer details from MongoDB
    const printer = await getPrinterById(id);

    if (!printer) {
      return NextResponse.json({ error: "Printer not found" }, { status: 404 });
    }

    if (!printer.ip || !printer.serial || !printer.access_code_encrypted) {
      return NextResponse.json(
        { error: "Printer credentials not configured" },
        { status: 400 },
      );
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
