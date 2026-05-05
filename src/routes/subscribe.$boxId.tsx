import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FakePaymentSheet } from "@/components/FakePaymentSheet";
import type { Database } from "@/integrations/supabase/types";

type Box = Database["public"]["Tables"]["boxes"]["Row"];
type Station = Database["public"]["Tables"]["stations"]["Row"];

export const Route = createFileRoute("/subscribe/$boxId")({
  component: SubscribePage,
});

const DAYS = [
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
  { v: 0, label: "Sun" },
];

// Date of the next occurrence of weekday `dow` (0=Sun..6=Sat), strictly after today.
function nextDateForDow(from: Date, dow: number): Date {
  const d = new Date(from);
  const diff = (dow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function SubscribePage() {
  const { boxId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [box, setBox] = useState<Box | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState("");
  const [pickupDay, setPickupDay] = useState<number>(3); // default Wed
  const [submitting, setSubmitting] = useState(false);
  const [showPay, setShowPay] = useState(false);

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
      .insert({
        user_id: user.id,
        box_id: box.id,
        station_id: stationId,
        pickup_day: pickupDay,
      })
      .select()
      .single();
    if (error || !sub) {
      setSubmitting(false);
      return toast.error(error?.message ?? "Could not subscribe");
    }
    const { data: locker } = await supabase
      .from("lockers")
      .select("id")
      .eq("station_id", stationId)
      .limit(1)
      .maybeSingle();

    // 4 weekly pickups on the chosen weekday
    const today = new Date();
    const first = nextDateForDow(today, pickupDay);
    const rows = Array.from({ length: 4 }).map((_, i) => {
      const d = new Date(first);
      d.setDate(d.getDate() + 7 * i);
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
        <label className="text-sm font-medium block mb-2">Pickup day</label>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d) => (
            <button
              type="button"
              key={d.v}
              onClick={() => setPickupDay(d.v)}
              className={`rounded-lg py-2 text-xs font-medium border transition-colors ${
                pickupDay === d.v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your box arrives every {DAYS.find((x) => x.v === pickupDay)?.label}.
        </p>
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
        onClick={() => setShowPay(true)}
        disabled={submitting || !stationId}
      >
        {submitting ? "Subscribing…" : `Pay & subscribe · CHF ${box.price_chf}/wk`}
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="w-full rounded-full mt-2"
        onClick={() => nav({ to: "/buy/$boxId", params: { boxId: box.id } })}
      >
        Just buy one box (no subscription)
      </Button>

      {showPay && (
        <FakePaymentSheet
          amountChf={Number(box.price_chf)}
          label={`Subscribe to ${box.name}`}
          onCancel={() => setShowPay(false)}
          onPaid={async () => {
            setShowPay(false);
            await subscribe();
          }}
        />
      )}
    </main>
  );
}
