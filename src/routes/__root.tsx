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
      { property: "og:title", content: "EcoBox — Fresh from the farm. Ready at your station." },
      { name: "twitter:title", content: "EcoBox — Fresh from the farm. Ready at your station." },
      { name: "description", content: "EcoBox Fresh is a farm-to-locker food subscription service delivering weekly produce boxes to smart lockers." },
      { property: "og:description", content: "EcoBox Fresh is a farm-to-locker food subscription service delivering weekly produce boxes to smart lockers." },
      { name: "twitter:description", content: "EcoBox Fresh is a farm-to-locker food subscription service delivering weekly produce boxes to smart lockers." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3261ba1e-f54d-4439-8a2c-bb96a46e57ae/id-preview-c1d7261e--d8a2bc95-2804-4feb-b75c-f3d40f89af84.lovable.app-1777979884330.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3261ba1e-f54d-4439-8a2c-bb96a46e57ae/id-preview-c1d7261e--d8a2bc95-2804-4feb-b75c-f3d40f89af84.lovable.app-1777979884330.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
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
