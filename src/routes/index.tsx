import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, ScanLine, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

const steps = [
  { Icon: Leaf, title: "Pick a box", body: "Choose vegan, veggie or meat — in your size." },
  { Icon: ScanLine, title: "Scan the locker", body: "Tap your QR at the station locker." },
  { Icon: ChefHat, title: "Cook the recipe", body: "Each box ships with a chef's card." },
];

const boxTypes = [
  { name: "Vegan", desc: "Seasonal greens & grains", color: "bg-accent" },
  { name: "Veggie", desc: "Plus eggs & alpine cheese", color: "bg-accent" },
  { name: "Meat", desc: "Veg + ethically raised cuts", color: "bg-accent" },
];

function Landing() {
  const { user } = useAuth();
  return (
    <main className="px-6 pt-12">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">EcoBox · Switzerland</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">
          Fresh from the farm.
          <br />
          Ready at your station.
        </h1>
        <p className="mt-4 text-muted-foreground">
          A weekly produce box from Swiss farms — delivered to a smart locker at your train station.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to={user ? "/boxes" : "/signup"}>
            <Button size="lg" className="rounded-full px-6">
              {user ? "Choose a box" : "Get started"}
            </Button>
          </Link>
          {!user && (
            <Link to="/login">
              <Button size="lg" variant="ghost" className="rounded-full px-6">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="mb-12">
        <h2 className="font-serif text-2xl mb-4">How it works</h2>
        <ol className="space-y-4">
          {steps.map(({ Icon, title, body }, i) => (
            <li key={title} className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Step {i + 1}</p>
                <h3 className="font-serif text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="font-serif text-2xl mb-4">Three boxes</h2>
        <div className="space-y-3">
          {boxTypes.map((b) => (
            <article
              key={b.name}
              className={`${b.color} rounded-2xl p-5 flex items-center justify-between`}
            >
              <div>
                <h3 className="font-serif text-xl text-accent-foreground">{b.name}</h3>
                <p className="text-sm text-accent-foreground/80">{b.desc}</p>
              </div>
              <span className="text-accent-foreground/70 text-sm">S · M · L</span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border p-6 text-center">
        <h2 className="font-serif text-2xl">Eat local. Save the trip.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Subscribe in a minute. Cancel anytime.
        </p>
        <Link to={user ? "/boxes" : "/signup"}>
          <Button size="lg" className="mt-4 rounded-full px-8">
            {user ? "Choose a box" : "Sign up"}
          </Button>
        </Link>
      </section>
    </main>
  );
}
