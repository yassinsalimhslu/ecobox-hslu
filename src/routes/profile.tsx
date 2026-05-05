import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? null));
  }, [user]);

  return (
    <main className="px-6 pt-12">
      <h1 className="font-serif text-3xl">Profile</h1>

      <section className="mt-8 rounded-2xl border border-border p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Name</p>
        <p className="mt-1 font-serif text-xl">{fullName || "—"}</p>
        <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Email</p>
        <p className="mt-1">{user?.email}</p>
      </section>

      <Button
        size="lg"
        variant="outline"
        className="w-full rounded-full mt-8"
        onClick={async () => {
          await signOut();
          nav({ to: "/" });
        }}
      >
        Sign out
      </Button>
    </main>
  );
}
