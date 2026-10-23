import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db";
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
import { LivePrinterStatus } from "@/components/LivePrinterStatus";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const { totalPrints, printerCount, filamentCount, recentPrints } =
    await getDashboardStats(user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Hallo, {user.email}
      </h1>

      <LivePrinterStatus />

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
            <div className="text-2xl font-bold">{printerCount || 0}</div>
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
            <div className="text-2xl font-bold">{filamentCount || 0}</div>
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
                    <CardTitle className="text-base flex items-center justify-between">
                      {print.title}
                      {print.auto_captured && (
                        <span className="text-[10px] font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200">
                          Auto
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{print.model_name}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <span
                      className="text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {new Date(print.created_at).toLocaleDateString("de-DE")}
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
