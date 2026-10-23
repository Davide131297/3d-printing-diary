"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { updateProfile } from "./actions";

interface Profile {
  currency: string | null;
  price_ct_kwh: number | null;
}

interface SettingsFormProps {
  profile: Profile | null;
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setShowSuccess(false);

    const result = await updateProfile(formData);

    setIsPending(false);

    if (result?.success) {
      setShowSuccess(true);
      // Hide alert after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Erfolg</AlertTitle>
          <AlertDescription>
            Einstellungen wurden erfolgreich gespeichert.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="currency">Währung</Label>
        <Select name="currency" defaultValue={profile?.currency || "EUR"}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Währung wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EUR">Euro (€)</SelectItem>
            <SelectItem value="USD">US Dollar ($)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price_ct_kwh">Strompreis (ct/kWh)</Label>
        <Input
          id="price_ct_kwh"
          name="price_ct_kwh"
          type="text"
          placeholder="34,98"
          className="w-[180px]"
          defaultValue={
            profile?.price_ct_kwh
              ? profile.price_ct_kwh.toString().replace(".", ",")
              : ""
          }
        />
        <p className="text-sm text-muted-foreground">
          Preis pro Kilowattstunde in Cent.
        </p>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Speichert..." : "Speichern"}
      </Button>
    </form>
  );
}
