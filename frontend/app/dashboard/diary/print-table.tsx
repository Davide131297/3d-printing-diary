"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreVertical, Pencil, Trash, ExternalLink } from "lucide-react";
import { Print, Printer, Filament } from "@/types/diary";
import { useState } from "react";
import { deletePrint } from "./actions";
import { PrintForm } from "./print-form";

interface PrintTableProps {
  prints: Print[];
  printers: Printer[];
  filaments: Filament[];
}

export function PrintTable({ prints, printers, filaments }: PrintTableProps) {
  const [editingPrint, setEditingPrint] = useState<Print | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
      await deletePrint(id);
    }
  };

  const calculateCost = (print: Print) => {
    let totalCost = 0;
    let currency = "EUR";
    if (print.print_filaments) {
      print.print_filaments.forEach((pf) => {
        const fil = pf.filaments;
        if (fil) {
          const costPerGram = fil.price / fil.weight_g;
          totalCost += costPerGram * pf.amount_used_g;
          currency = fil.currency;
        }
      });
    }
    return {
      cost: totalCost.toFixed(2),
      currency: currency === "EUR" ? "€" : "$",
    };
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Titel / Modell</TableHead>
            <TableHead>Drucker</TableHead>
            <TableHead>Filamente</TableHead>
            <TableHead>Zeit</TableHead>
            <TableHead>Kosten</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prints.map((print) => {
            const { cost, currency } = calculateCost(print);
            return (
              <TableRow key={print.id}>
                <TableCell
                  className="whitespace-nowrap"
                  suppressHydrationWarning
                >
                  {new Date(print.created_at).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium line-clamp-1">
                      {print.title}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {print.model_name}
                    </span>
                    {print.makerworld_link && (
                      <a
                        href={print.makerworld_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5"
                      >
                        MakerWorld <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {print.printers?.name}
                  <div className="text-[10px] text-muted-foreground">
                    {print.printers?.model}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {print.print_filaments?.map((pf, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full border border-white/20"
                      >
                        <div
                          className="w-2 h-2 rounded-full border border-white"
                          style={{ backgroundColor: pf.filaments?.color }}
                        />
                        <span>{pf.amount_used_g}g</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {print.print_time_minutes}m
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {cost} {currency}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingPrint(print)}>
                        <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(print.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" /> Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog
        open={!!editingPrint}
        onOpenChange={(open) => !open && setEditingPrint(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Eintrag bearbeiten</DialogTitle>
            <DialogDescription>
              Pass die Details deines Drucks an.
            </DialogDescription>
          </DialogHeader>
          {editingPrint && (
            <PrintForm
              printers={printers}
              filaments={filaments}
              initialData={editingPrint}
              onSuccess={() => setEditingPrint(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
