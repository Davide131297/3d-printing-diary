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
    <div className="flex flex-col min-h-screen md:flex-row bg-transparent relative">
      <aside className="hidden w-64 flex-col md:flex border-r bg-sidebar/50 backdrop-blur-xl sticky top-0 h-screen">
        <DashboardNav />
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden border-b p-4 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-xl z-50">
          <span className="font-bold tracking-tight">3D Druck Tagebuch</span>
          {/* Mobile Menu Trigger could go here */}
        </header>
        <main className="flex-1 p-4 md:p-8 relative">{children}</main>
      </div>
    </div>
  );
}
