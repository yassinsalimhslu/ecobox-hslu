import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Box = Database["public"]["Tables"]["boxes"]["Row"];
type Station = Database["public"]["Tables"]["stations"]["Row"];

export const Route = createFileRoute("/subscribe/$boxId")({
  component: SubscribePage,
});

function SubscribePage() {
  const { boxId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [box, setBox] = useState<Box | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    (async () => {
      const [{ data: b }, { data: s }] = await Promise.all([
        supabase.from("boxes").select("*").eq("id", boxId).maybeSingle(),
        supabase.from("stations").select("*").order("name"),
      ]);
      setBox(b);
      setStations(s ?? []);
      if (s && s[0]) setStationId(s[0].id);
    })();
  }, [boxId]);

  async function subscribe() {
    if (!user || !box || !stationId) return;
    setSubmitting(true);
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .insert({ user_id: user.id, box_id: box.id, station_id: stationId })
      .select()
      .single();
    if (error || !sub) {
      setSubmitting(false);
      return toast.error(error?.message ?? "Could not subscribe");
    }
    // Get a locker for the station
    const { data: locker } = await supabase
      .from("lockers")
      .select("id")
      .eq("station_id", stationId)
      .limit(1)
      .maybeSingle();

    // Create the next 4 weekly pickups
    const today = new Date();
    const rows = Array.from({ length: 4 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + 7 * (i + 1));
      return {
        subscription_id: sub.id,
        user_id: user.id,
        locker_id: locker?.id ?? null,
        pickup_date: d.toISOString().slice(0, 10),
      };
    });
    await supabase.from("pickups").insert(rows);

    toast.success("Subscribed! Your pickups are scheduled.");
    nav({ to: "/pickups" });
  }

  if (!box) return <main className="px-6 pt-12 text-muted-foreground">Loading…</main>;

  return (
    <main className="px-6 pt-12">
      <p className="text-xs uppercase tracking-wider text-primary">Confirm subscription</p>
      <h1 className="mt-2 font-serif text-3xl">{box.name}</h1>
      <p className="mt-1 text-muted-foreground">CHF {box.price_chf} · weekly</p>
      {box.description && <p className="mt-4 text-sm">{box.description}</p>}

      <div className="mt-8">
        <label className="text-sm font-medium block mb-2">Pickup station</label>
        <div className="space-y-2">
          {stations.map((s) => (
            <label
              key={s.id}
              className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer ${
                stationId === s.id ? "border-primary bg-accent" : "border-border"
              }`}
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.city}</p>
              </div>
              <input
                type="radio"
                name="station"
                checked={stationId === s.id}
                onChange={() => setStationId(s.id)}
                className="accent-primary"
              />
            </label>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full rounded-full mt-8"
        onClick={subscribe}
        disabled={submitting || !stationId}
      >
        {submitting ? "Subscribing…" : "Confirm subscription"}
      </Button>
    </main>
  );
}
