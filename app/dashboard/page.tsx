import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Printer, Package } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch stats (parallel)
  const [printsResponse, printersResponse, filamentsResponse] =
    await Promise.all([
      supabase
        .from("prints")
        .select("id, created_at, title, model_name")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("printers").select("id", { count: "exact", head: true }),
      supabase.from("filaments").select("id", { count: "exact", head: true }),
    ]);

  const recentPrints = printsResponse.data || [];
  const printCount = printsResponse.count; // This might be null if we didn't ask for count, let's explicitly ask for count separately if needed or just use length of all if small.
  // Better way for total count:
  const { count: totalPrints } = await supabase
    .from("prints")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Hallo, {user?.email}
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gedruckte Modelle
            </CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrints || 0}</div>
            <p className="text-xs text-muted-foreground">
              Insgesamt dokumentiert
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meine Drucker</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {printersResponse.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registrierte Geräte</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Filament Rollen
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filamentsResponse.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Im Inventar</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Neueste Drucke</h3>
        {recentPrints.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentPrints.map((print) => (
              <Link href="/dashboard/diary" key={print.id}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">{print.title}</CardTitle>
                    <CardDescription>{print.model_name}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <span className="text-xs text-muted-foreground">
                      {new Date(print.created_at).toLocaleDateString()}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">
            Noch keine Drucke vorhanden.
          </div>
        )}
      </div>
    </div>
  );
}
