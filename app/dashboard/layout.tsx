import { MobileNav } from "@/components/mobile-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { ChatWidget } from "@/components/chat/chat-widget";
import { AutoIngest } from "@/components/auto-ingest";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen md:flex-row bg-transparent relative">
      <aside className="hidden w-64 flex-col md:flex border-r bg-sidebar/50 backdrop-blur-xl sticky top-0 h-screen">
        <DashboardNav />
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden border-b p-4 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-xl z-50">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg shadow-md border border-border/50"
            />
            <span className="font-bold tracking-tight text-lg">
              3D Druck Tagebuch
            </span>
          </div>
          <MobileNav />
        </header>
        <main className="flex-1 p-4 md:p-8 relative">{children}</main>
        <ChatWidget />
        <AutoIngest />
      </div>
    </div>
  );
}
