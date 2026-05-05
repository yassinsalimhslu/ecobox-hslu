import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="app-shell flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-serif text-primary">404</h1>
        <p className="mt-3 text-muted-foreground">This page got lost in the harvest.</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">
          Back home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "EcoBox — Fresh from the farm. Ready at your station." },
      {
        name: "description",
        content:
          "Swiss farm-to-locker food subscription. Pick a box, scan the locker at your train station, cook with the recipe card.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </AuthProvider>
  );
}
