import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFilaments, getSavedCalculations } from "@/lib/db";
import { FilamentCalculator } from "./filament-calculator";

export const metadata = {
  title: "Filament-Rechner | 3D Druck Tagebuch",
  description:
    "Berechne den gesamten Filamentbedarf und die Farbverteilung für MakerWorld Modelle.",
};

export default async function DashboardCalculatorPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const [userFilaments, savedCalculations] = await Promise.all([
    getFilaments(user.id),
    getSavedCalculations(user.id),
  ]);

  return (
    <FilamentCalculator
      userFilaments={userFilaments || []}
      isLoggedIn={true}
      initialSavedCalculations={savedCalculations}
      showHomeLink={false}
    />
  );
}
