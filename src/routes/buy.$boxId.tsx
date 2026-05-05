import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Box = Database["public"]["Tables"]["boxes"]["Row"];
type Station = Database["public"]["Tables"]["stations"]["Row"];

export const Route = createFileRoute("/buy/$boxId")({
  component: BuyOncePage,
});

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function BuyOncePage() {
  const { boxId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [box, setBox] = useState<Box | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState("");
  const [pickupDate, setPickupDate] = useState<string>(todayPlus(2));
  const [busy, setBusy] = useState(false);

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

  async function buy() {
    if (!user || !box || !stationId) return;
    setBusy(true);
    // One-off purchase = a subscription with status 'one_off' + a single pickup
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        box_id: box.id,
        station_id: stationId,
        status: "one_off",
      })
      .select()
      .single();
    if (error || !sub) {
      setBusy(false);
      return toast.error(error?.message ?? "Could not place order");
    }
    const { data: locker } = await supabase
      .from("lockers")
      .select("id")
      .eq("station_id", stationId)
      .limit(1)
      .maybeSingle();
    const { error: pErr } = await supabase.from("pickups").insert({
      subscription_id: sub.id,
      user_id: user.id,
      locker_id: locker?.id ?? null,
      pickup_date: pickupDate,
    });
    setBusy(false);
    if (pErr) return toast.error(pErr.message);
    toast.success("Box reserved! See it in My pickups.");
    nav({ to: "/pickups" });
  }

  if (!box) return <main className="px-6 pt-12 text-muted-foreground">Loading…</main>;

  const minDate = todayPlus(1);
  const maxDate = todayPlus(14);

  return (
    <main className="px-6 pt-12">
      <p className="text-xs uppercase tracking-wider text-primary">One-off purchase</p>
      <h1 className="mt-2 font-serif text-3xl">{box.name}</h1>
      <p className="mt-1 text-muted-foreground">CHF {box.price_chf} · single box</p>
      {box.description && <p className="mt-4 text-sm">{box.description}</p>}

      <div className="mt-8">
        <label htmlFor="pickup-date" className="text-sm font-medium block mb-2">
          Pickup date
        </label>
        <input
          id="pickup-date"
          type="date"
          value={pickupDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => setPickupDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-background p-3 text-base"
        />
      </div>

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
        onClick={buy}
        disabled={busy || !stationId || !pickupDate}
      >
        {busy ? "Reserving…" : `Buy this box · CHF ${box.price_chf}`}
      </Button>
    </main>
  );
}
