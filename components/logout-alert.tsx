"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export function LogoutAlert() {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Optional: Clean up the URL
      router.replace("/", { scroll: false });
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 animate-in slide-in-from-right-10 fade-in duration-300 ease-out">
      <Alert className="border-green-500/50 text-green-500 bg-black/80 backdrop-blur-xl shadow-2xl shadow-green-500/20">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle>Abmeldung erfolgreich</AlertTitle>
        <AlertDescription>Du wurdest sicher abgemeldet.</AlertDescription>
      </Alert>
    </div>
  );
}
