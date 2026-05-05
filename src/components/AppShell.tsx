import { Link, useLocation } from "@tanstack/react-router";
import { Home, Package, Ticket, User, ReactNode } from "lucide-react";
import type { ReactNode as RN } from "react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/boxes", label: "Boxes", Icon: Package },
  { to: "/pickups", label: "Pickups", Icon: Ticket },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function AppShell({ children }: { children: RN }) {
  const { user } = useAuth();
  const loc = useLocation();
  return (
    <div className="app-shell">
      {children}
      {user && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t border-border bg-card/95 backdrop-blur"
          aria-label="Primary"
        >
          <ul className="grid grid-cols-4">
            {navItems.map(({ to, label, Icon }) => {
              const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex flex-col items-center gap-1 py-3 text-xs ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
