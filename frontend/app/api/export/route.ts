import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { Print } from "@/types/diary";

// Helper function to escape CSV fields
const escapeCsv = (field: string | number | null | undefined) => {
  if (field === null || field === undefined) return "";
  const stringField = String(field);
  if (
    stringField.includes(",") ||
    stringField.includes('"') ||
    stringField.includes("\n")
  ) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Fetch all prints with related data
  const { data: prints } = (await supabase
    .from("prints")
    .select(
      `
      *,
      printers (name, model),
      print_filaments (
          amount_used_g,
          filaments (id, name, color, manufacturer, price, weight_g, currency)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })) as { data: Print[] | null };

  if (!prints || prints.length === 0) {
    return new NextResponse("No data found", { status: 404 });
  }

  // Define CSV headers
  const headers = [
    "Date",
    "Model Name",
    "Printer",
    "Filament",
    "Manufacturer",
    "Color",
    "Amount (g)",
    "Cost",
    "Currency",
    "Print Time (min)",
  ];

  // Transform data to CSV rows
  const rows = prints.flatMap((print) => {
    const printerName = print.printers
      ? `${print.printers.name} (${print.printers.model})`
      : "Unknown Printer";
    const date = new Date(print.created_at).toISOString().split("T")[0];

    // If a print has multiple filaments, create a row for each or combine them?
    // Let's create a row for each filament usage to be detailed, or just one row per print.
    // Given the request is "export as CSV", usually flattened data is better.
    // If there are no filaments, we still want a row.

    if (!print.print_filaments || print.print_filaments.length === 0) {
      return [
        {
          date: date,
          modelName: print.title || "Untitled",
          printer: printerName,
          filament: "",
          manufacturer: "",
          color: "",
          amount: 0,
          cost: "0.00", // Changed to string to match toFixed(2) output
          currency: "",
          printTime: print.print_time_minutes || 0,
        },
      ];
    }

    return print.print_filaments.map((pf) => {
      const fil = pf.filaments;
      let cost = 0;
      let currency = "";
      let filName = "";
      let manuf = "";
      let color = "";

      if (fil) {
        filName = fil.name;
        manuf = fil.manufacturer;
        color = fil.color;
        currency = fil.currency;
        if (fil.weight_g > 0) {
          cost = (fil.price / fil.weight_g) * pf.amount_used_g;
        }
      }

      return {
        date: date,
        modelName: print.title || "Untitled",
        printer: printerName,
        filament: filName,
        manufacturer: manuf,
        color: color,
        amount: pf.amount_used_g,
        cost: cost.toFixed(2),
        currency: currency,
        printTime: print.print_time_minutes || 0,
      };
    });
  });

  // Construct CSV string
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      [
        escapeCsv(row.date),
        escapeCsv(row.modelName),
        escapeCsv(row.printer),
        escapeCsv(row.filament),
        escapeCsv(row.manufacturer),
        escapeCsv(row.color),
        escapeCsv(row.amount),
        escapeCsv(row.cost),
        escapeCsv(row.currency),
        escapeCsv(row.printTime),
      ].join(","),
    ),
  ].join("\n");

  // Create response with appropriate headers for download
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diary_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
