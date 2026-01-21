import { createClient } from "@/utils/supabase/server";
import { DeleteFilamentButton } from "./delete-button";
import { AddFilamentDialog } from "./add-filament-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function FilamentsPage() {
  const supabase = await createClient();
  const { data: filaments } =
    (await supabase
      .from("filaments")
      .select("*")
      .order("created_at", { ascending: false })) || [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user?.id)
    .single();

  const userCurrency = profile?.currency || "EUR";
  const currencySymbol = userCurrency === "EUR" ? "€" : "$";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Mein Filament-Inventar</h3>
          <p className="text-sm text-muted-foreground">
            Verwalte deine Filamentrollen.
          </p>
        </div>
        <AddFilamentDialog currencySymbol={currencySymbol} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* List existing filaments */}
        {filaments?.map((filament) => (
          <Card key={filament.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: filament.color }}
                    />
                    {filament.name}
                  </CardTitle>
                  <CardDescription>
                    {filament.manufacturer} - {filament.material}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filament.price} {filament.currency === "EUR" ? "€" : "$"}
              </div>
              <p className="text-xs text-muted-foreground">
                {filament.weight_g}g Rolle
              </p>
            </CardContent>
            <CardFooter className="justify-end">
              <DeleteFilamentButton id={filament.id} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
