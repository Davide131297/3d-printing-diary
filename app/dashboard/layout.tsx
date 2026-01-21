import { DashboardNav } from "@/components/dashboard-nav";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      <aside className="hidden w-64 flex-col md:flex">
        <DashboardNav />
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden border-b p-4 flex items-center justify-between">
          <span className="font-bold">3D Druck Tagebuch</span>
          {/* Mobile Menu Trigger could go here */}
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
