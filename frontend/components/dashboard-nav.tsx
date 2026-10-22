"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import {
  Book,
  Printer,
  Package,
  Settings,
  Home,
  LogOut,
  Calculator,
} from "lucide-react";
import { signout } from "@/app/auth/actions";

interface DashboardNavProps extends React.HTMLAttributes<HTMLDivElement> {
  onNavClick?: () => void;
}

export function DashboardNav({
  className,
  onNavClick,
  ...props
}: DashboardNavProps) {
  const pathname = usePathname();

  const items = [
    {
      title: "Übersicht",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Tagebuch",
      href: "/dashboard/diary",
      icon: Book,
    },
    {
      title: "Drucker",
      href: "/dashboard/printers",
      icon: Printer,
    },
    {
      title: "Filamente",
      href: "/dashboard/filaments",
      icon: Package,
    },
    {
      title: "Filament-Rechner",
      href: "/dashboard/calculator",
      icon: Calculator,
    },
    {
      title: "Einstellungen",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className={cn("pb-12 h-full bg-transparent", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-4 px-4 mb-8">
            <Image
              src="/logo.png"
              alt="3D Druck Tagebuch Logo"
              width={48}
              height={48}
              className="rounded-xl shadow-xl border border-border/50"
            />
            <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground leading-tight">
              3D Druck
              <br />
              Tagebuch
            </h2>
          </div>
          <div className="space-y-1">
            {items.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                asChild
              >
                <Link href={item.href} onClick={onNavClick}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10 mt-8"
              onClick={async () => {
                await signout();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
          <div className="mt-8 px-4 text-xs text-muted-foreground/50 flex gap-2">
            <p>Version 1.0</p>
            <p>•</p>
            <p>{new Date().toLocaleDateString("de-DE")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
