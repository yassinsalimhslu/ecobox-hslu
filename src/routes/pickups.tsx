import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pickups")({
  component: PickupsPage,
});

interface PickupRow {
  id: string;
  pickup_date: string;
  status: string;
  qr_code: string;
  lockers: { code: string; stations: { name: string; city: string } | null } | null;
  subscriptions: { boxes: { name: string } | null } | null;
}

function qrUrl(code: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(code)}`;
}

function PickupsPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [pickups, setPickups] = useState<PickupRow[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  const load = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    const { data } = await supabase
      .from("pickups")
      .select(
        "id, pickup_date, status, qr_code, lockers(code, stations(name, city)), subscriptions(boxes(name))"
      )
      .eq("user_id", user.id)
      .order("pickup_date");
    setPickups((data as unknown as PickupRow[]) ?? []);
    setBusy(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="px-6 pt-12">
      <h1 className="font-serif text-3xl">My pickups</h1>
      <p className="mt-2 text-sm text-muted-foreground">Show this QR at the locker.</p>

      {busy && <p className="mt-8 text-muted-foreground">Loading…</p>}

      {!busy && pickups.length === 0 && (
        <div className="mt-12 rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground">No pickups yet.</p>
          <Link to="/boxes" className="mt-4 inline-block text-primary underline">
            Choose a box
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {pickups.map((p) => {
          const station = p.lockers?.stations;
          const isDonated = p.status === "donated";
          return (
            <article key={p.id} className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {new Date(p.pickup_date).toLocaleDateString("en-CH", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <h2 className="font-serif text-xl mt-1">
                    {p.subscriptions?.boxes?.name ?? "Box"}
                  </h2>
                  {station && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {station.name} · Locker {p.lockers?.code}
                    </p>
                  )}
                  <p className="mt-2 text-xs">
                    Status:{" "}
                    <span className={isDonated ? "text-primary font-medium" : ""}>{p.status}</span>
                  </p>
                </div>
                {!isDonated && (
                  <img
                    src={qrUrl(p.qr_code)}
                    alt="Pickup QR code"
                    className="h-20 w-20 rounded-md bg-white p-1"
                  />
                )}
              </div>
              {!isDonated && p.status !== "picked_up" && (
                <Link
                  to="/donate/$pickupId"
                  params={{ pickupId: p.id }}
                  className="mt-4 inline-block text-sm text-primary underline"
                >
                  Donate this box →
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
