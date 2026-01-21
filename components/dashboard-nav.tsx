"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { Book, Printer, Package, Settings, Home } from "lucide-react";

type DashboardNavProps = React.HTMLAttributes<HTMLDivElement>;

export function DashboardNav({ className, ...props }: DashboardNavProps) {
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
      title: "Einstellungen",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className={cn("pb-12 h-full bg-transparent", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight text-sidebar-foreground">
            3D Druck Tagebuch
          </h2>
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
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
