"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Wifi, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Cookies from "js-cookie";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  ip: z.string().min(1, "IP Adresse wird benötigt"),
  accessCode: z.string().min(1, "Access Code wird benötigt"),
  serial: z.string().min(1, "Seriennummer wird benötigt"),
});

export function PrinterConnectForm() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ip: "",
      accessCode: "",
      serial: "",
    },
  });

  useEffect(() => {
    const savedIp = Cookies.get("bambu_ip");
    const savedSerial = Cookies.get("bambu_serial");
    const savedAccessCode = Cookies.get("bambu_access_code");

    if (savedIp) form.setValue("ip", savedIp);
    if (savedSerial) form.setValue("serial", savedSerial);
    if (savedAccessCode) form.setValue("accessCode", savedAccessCode);
  }, [form]);

  const clearCookies = () => {
    Cookies.remove("bambu_ip");
    Cookies.remove("bambu_serial");
    Cookies.remove("bambu_access_code");

    form.reset({
      ip: "",
      serial: "",
      accessCode: "",
    });

    toast.success("Gespeicherte Daten gelöscht");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsConnecting(true);
    setConnectionStatus("idle");
    setStatusMessage("");

    try {
      const response = await fetch("/api/printers/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verbindung fehlgeschlagen");
      }

      setConnectionStatus("success");

      const machineName = data.printer?.model || "Bambu Lab Drucker";
      const jobName = data.status.modelName;

      console.log("Drucker daten: ", data);

      if (jobName && data.status.printStatus === "PRINTING") {
        setStatusMessage(`Verbunden: Druckt "${jobName}"`);
      } else {
        setStatusMessage(`Verbunden mit ${machineName}`);
      }

      // Cookies speichern (7 Tage gültig)
      Cookies.set("bambu_ip", values.ip, { expires: 365 });
      Cookies.set("bambu_serial", values.serial, { expires: 365 });
      Cookies.set("bambu_access_code", values.accessCode, { expires: 365 });

      toast.success("Drucker erfolgreich verbunden!");
    } catch (error: unknown) {
      setConnectionStatus("error");
      const message =
        error instanceof Error
          ? error.message
          : "Ein unbekannter Fehler ist aufgetreten";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bambu Lab Drucker verbinden</CardTitle>
        <CardDescription>
          Verbinde deinen Drucker, um automatisch Druckstatus und
          Filamentverbrauch abzurufen. Du findest den Access Code in den
          Netzwerkeinstellungen deines Druckers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.1.x" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seriennummer</FormLabel>
                    <FormControl>
                      <Input placeholder="SN..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accessCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Code</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Sicherheits-Code"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Wird verschlüsselt gespeichert.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {connectionStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>{statusMessage}</AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <Wifi className="h-4 w-4" /> Wo finde ich die Daten?
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Seriennummer:</strong> Einstellungen &rarr; Allgemein
                  &rarr; Geräteinfo
                </li>
                <li>
                  <strong>Access Code:</strong> Zugriffscode oft unter LAN-Modus
                  zu finden
                </li>
                <li>
                  <strong>IP Adresse:</strong> IP Adresse oft unter LAN-Modus zu
                  finden
                </li>
              </ul>
              <div className="text-xs mt-2 space-y-2">
                <p>
                  <span className="font-semibold text-amber-600">Wichtig:</span>
                  <br />
                  Der Access Code wird nur angezeigt, wenn der &quot;Nur
                  LAN&quot; Modus aktiviert ist.
                </p>
              </div>
            </div>

            {connectionStatus === "success" && (
              <Alert className="text-green-600 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Erfolg</AlertTitle>
                <AlertDescription>{statusMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isConnecting} className="flex-1">
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verbinde...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Verbinden & Testen
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={clearCookies}
                title="Gespeicherte Daten löschen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
