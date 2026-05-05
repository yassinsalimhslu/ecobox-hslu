import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

type Box = Database["public"]["Tables"]["boxes"]["Row"];

export const Route = createFileRoute("/boxes")({
  component: BoxesPage,
});

const TYPE_LABELS: Record<string, string> = {
  vegan: "Vegan",
  veggie: "Veggie",
  meat: "Meat",
};

function BoxesPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    supabase
      .from("boxes")
      .select("*")
      .order("type")
      .order("price_chf")
      .then(({ data }) => {
        setBoxes(data ?? []);
        setBusy(false);
      });
  }, []);

  const grouped = boxes.reduce<Record<string, Box[]>>((acc, b) => {
    (acc[b.type] ??= []).push(b);
    return acc;
  }, {});

  return (
    <main className="px-6 pt-12">
      <h1 className="font-serif text-3xl">Choose your box</h1>
      <p className="mt-2 text-sm text-muted-foreground">Weekly, from Swiss farms.</p>

      {busy && <p className="mt-8 text-muted-foreground">Loading…</p>}

      {Object.entries(grouped).map(([type, items]) => (
        <section key={type} className="mt-8">
          <h2 className="font-serif text-xl mb-3">{TYPE_LABELS[type] ?? type}</h2>
          <div className="space-y-3">
            {items.map((b) => (
              <Link
                key={b.id}
                to="/subscribe/$boxId"
                params={{ boxId: b.id }}
                className="block rounded-2xl border border-border p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-lg">{b.name}</h3>
                  <span className="text-primary font-medium">CHF {b.price_chf}</span>
                </div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  Size · {b.size}
                </p>
                {b.description && (
                  <p className="text-sm text-muted-foreground mt-2">{b.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
