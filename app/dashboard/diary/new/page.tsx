import { createClient } from "@/utils/supabase/server";
import { createPrint } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function NewPrintPage() {
  const supabase = await createClient();
  const { data: printers } = await supabase.from("printers").select("*");
  const { data: filaments } = await supabase.from("filaments").select("*");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-medium">Neuer Tagebuch-Eintrag</h3>
        <p className="text-sm text-muted-foreground">
          Dokumentiere einen fertiggestellten Druck.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Druck Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPrint} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                name="title"
                placeholder="z.B. Benchy Boot"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model_name">Modell Name</Label>
                <Input
                  id="model_name"
                  name="model_name"
                  placeholder="3D Benchy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="makerworld_link">
                  MakerWorld Link (optional)
                </Label>
                <Input
                  id="makerworld_link"
                  name="makerworld_link"
                  placeholder="https://makerworld.com/..."
                />
              </div>
            </div>

            {/* Printer Selection */}
            <div className="space-y-2">
              <Label htmlFor="printer_id">Drucker</Label>
              <Select name="printer_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Drucker wählen" />
                </SelectTrigger>
                <SelectContent>
                  {printers?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filament Selection (Simplified: 1 filament for now) */}
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
              <div className="space-y-2">
                <Label htmlFor="filament_id">Haupt-Filament</Label>
                <Select name="filament_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Filament wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filaments?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: f.color }}
                          />
                          {f.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount_used">Verbrauch (g)</Label>
                <Input
                  id="amount_used"
                  name="amount_used"
                  type="number"
                  placeholder="42"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="print_time">Druckzeit (Minuten)</Label>
              <Input
                id="print_time"
                name="print_time"
                type="number"
                placeholder="60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Druckeinstellungen, Probleme, etc."
              />
            </div>

            <Button type="submit" className="w-full">
              Eintrag speichern
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
