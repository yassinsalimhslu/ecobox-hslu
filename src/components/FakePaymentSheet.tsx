import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface Props {
  amountChf: number;
  label: string;
  onPaid: () => Promise<void> | void;
  onCancel: () => void;
}

export function FakePaymentSheet({ amountChf, label, onPaid, onCancel }: Props) {
  const [name, setName] = useState("");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [processing, setProcessing] = useState(false);

  function fmtCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function fmtExp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    // Fake processing delay
    await new Promise((r) => setTimeout(r, 1200));
    await onPaid();
    setProcessing(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-[480px] bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-xl">
        <div className="mx-auto h-1 w-10 rounded-full bg-border sm:hidden mb-4" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          <span>Secure checkout · demo mode</span>
        </div>
        <h2 className="font-serif text-2xl mt-2">{label}</h2>
        <p className="text-sm text-muted-foreground">
          Total <span className="font-medium text-foreground">CHF {amountChf.toFixed(2)}</span>
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Name on card</Label>
            <Input
              id="name"
              required
              placeholder="Max Muster"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="card">Card number</Label>
            <Input
              id="card"
              required
              inputMode="numeric"
              value={card}
              onChange={(e) => setCard(fmtCard(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exp">Expiry</Label>
              <Input
                id="exp"
                required
                placeholder="MM/YY"
                value={exp}
                onChange={(e) => setExp(fmtExp(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                required
                inputMode="numeric"
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            This is a demo. No real card is charged. Use any card number.
          </p>

          <Button type="submit" size="lg" className="w-full rounded-full" disabled={processing}>
            {processing ? "Processing payment…" : `Pay CHF ${amountChf.toFixed(2)}`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-full"
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </Button>
        </form>
      </div>
    </div>
  );
}
