import { createClient } from "@/utils/supabase/server";

import { PrinterConnectForm } from "./PrinterConnectForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsForm } from "./SettingsForm";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { KnowledgeBaseSection } from "./KnowledgeBaseSection";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Einstellungen</h3>
        <p className="text-sm text-muted-foreground">
          Verwalte deine Kontoeinstellungen und Präferenzen.
        </p>
      </div>

      {user && <PrinterConnectForm />}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Währung & Stromkosten</CardTitle>
            <CardDescription>
              Wähle deine bevorzugte Währung und hinterlege deinen Strompreis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm profile={profile} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daten Exportieren</CardTitle>
            <CardDescription>
              Exportiere deine Druck-Historie als CSV-Datei.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="/api/export" download="diary_export.csv">
                Als CSV exportieren
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <KnowledgeBaseSection />
      </div>

      {user?.email !== "demo@mail.de" && (
        <div className="grid gap-6">
          <DeleteAccountSection />
        </div>
      )}
    </div>
  );
}
