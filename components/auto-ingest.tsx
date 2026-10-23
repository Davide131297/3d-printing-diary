"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function AutoIngest() {
  const hasRun = useRef(false);

  useEffect(() => {
    const sessionKey = "has_auto_ingested_knowledge";
    const alreadyIngested = sessionStorage.getItem(sessionKey);

    if (!alreadyIngested && !hasRun.current) {
      hasRun.current = true;

      const ingest = async () => {
        try {
          const res = await fetch("/api/ingest");
          if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem(sessionKey, "true");
            toast.success(
              `Wissensdatenbank aktualisiert! ${data.insertedCount} Einträge verarbeitet.`,
            );
          }
        } catch (error) {
          console.error("Auto-ingest failed", error);
        }
      };

      ingest();
    }
  }, []);

  return null;
}
