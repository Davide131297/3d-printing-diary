import { getCurrentUser } from "@/lib/auth";
import { getPrints, getProfile } from "@/lib/db";
import { NextResponse } from "next/server";

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
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [prints, profile] = await Promise.all([
    getPrints(user.id),
    getProfile(user.id),
  ]);

  const electricityPrice = profile?.price_ct_kwh || null;

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
    "Electricity (Wh)",
    "Electricity Cost",
  ];

  // Transform data to CSV rows
  const rows = prints.flatMap((print) => {
    const printerName = print.printers
      ? `${print.printers.name} (${print.printers.model})`
      : "Unknown Printer";
    const date = new Date(print.created_at).toISOString().split("T")[0];

    const powerConsumption = print.power_consumption_w || 0;
    let electricityCostValue = 0;
    if (powerConsumption && electricityPrice) {
      electricityCostValue =
        (powerConsumption / 1000) * (electricityPrice / 100);
    }

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
          cost: "0.00",
          currency: "",
          printTime: print.print_time_minutes || 0,
          electricityWh: powerConsumption,
          electricityCost: electricityCostValue.toFixed(2),
        },
      ];
    }

    return print.print_filaments.map((pf, index) => {
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

      const currentElectricityCost =
        index === 0 ? electricityCostValue.toFixed(2) : "0.00";
      const currentElectricityWh = index === 0 ? powerConsumption : 0;

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
        electricityWh: currentElectricityWh,
        electricityCost: currentElectricityCost,
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
        escapeCsv(row.electricityWh),
        escapeCsv(row.electricityCost),
      ].join(","),
    ),
  ].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diary_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
