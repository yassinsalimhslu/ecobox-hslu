import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/donate/$pickupId")({
  component: DonatePage,
});

function DonatePage() {
  const { pickupId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  async function donate() {
    if (!user) return;
    setBusy(true);
    const { error: e1 } = await supabase
      .from("pickups")
      .update({ status: "donated" })
      .eq("id", pickupId);
    const { error: e2 } = await supabase
      .from("donations")
      .insert({ pickup_id: pickupId, user_id: user.id });
    setBusy(false);
    if (e1 || e2) return toast.error((e1 || e2)!.message);
    toast.success("Thank you — your box will feed someone in need.");
    nav({ to: "/pickups" });
  }

  return (
    <main className="px-6 pt-12">
      <div className="rounded-2xl bg-accent text-accent-foreground p-8 text-center">
        <Heart className="mx-auto h-10 w-10" aria-hidden />
        <h1 className="font-serif text-3xl mt-4">Donate this box</h1>
        <p className="mt-3 text-sm">
          Your unclaimed box will be picked up by our partner food bank and given to a Swiss family
          this week.
        </p>
      </div>

      <Button
        size="lg"
        className="w-full rounded-full mt-8"
        onClick={donate}
        disabled={busy}
      >
        {busy ? "Donating…" : "Confirm donation"}
      </Button>
      <Button
        variant="ghost"
        className="w-full rounded-full mt-2"
        onClick={() => nav({ to: "/pickups" })}
      >
        Cancel
      </Button>
    </main>
  );
}
