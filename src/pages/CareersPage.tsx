import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/integrations/api/client";

const ROLES = [
  {
    key: "Media Buyer",
    focus: "Find the right people and invite them to try Life Scale.",
    owns: [
      "Create the messages and creative ideas that bring people in.",
      "Try different channels to see where our future users spend time.",
      "Keep what works, share what you learn, and help the team grow.",
    ],
  },
  {
    key: "Product Manager",
    focus: "Shape the Life Scale experience people come back to every day.",
    owns: [
      "Decide what we build next based on what our users need most.",
      "Work with design and engineering to ship features that feel effortless.",
      "Listen to feedback and keep improving the product.",
    ],
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

export default function CareersPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "",
    portfolio_url: "",
    experience: "",
  });

  useEffect(() => {
    const prev = document.title;
    document.title = "Careers at Life Scale";
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    meta?.setAttribute(
      "content",
      "Join Life Scale. We are hiring media buyers and product managers to scale a consumer assessment product.",
    );
    return () => {
      document.title = prev;
      if (prevDesc !== null) meta?.setAttribute("content", prevDesc);
    };
  }, []);

  const pickRole = (role: string) => {
    setForm((f) => ({ ...f, role }));
    document.getElementById("application")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.role ||
      !form.portfolio_url.trim() ||
      !form.experience.trim()
    ) {
      return;
    }
    if (!/^https?:\/\//i.test(form.portfolio_url.trim())) {
      toast.error("Please include a full link starting with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      await api.post("/affiliates/applications", {
        fullName: form.full_name.trim(),
        email: form.email.trim(),
        businessName: form.role,
        trafficSource: form.role,
        websiteUrl: form.portfolio_url.trim(),
        comment: form.experience.trim(),
      });
      setLoading(false);
      setSubmitted(true);
    } catch (error) {
      setLoading(false);
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Application received</h1>
          <p className="text-muted-foreground">
            Thanks for applying. We review every application and reply within 5 business days.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Careers at Life Scale</h1>
          <p className="text-muted-foreground">
            We build consumer assessments that turn self-knowledge into real progress.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease }}
          className="grid gap-4 sm:grid-cols-2 mb-14"
        >
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => pickRole(r.key)}
              className={`rounded-xl border p-5 text-left transition-colors ${
                form.role === r.key
                  ? "border-[hsl(var(--iq-cobalt))] bg-[hsl(var(--iq-mint-wash))]"
                  : "border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] hover:border-[hsl(var(--iq-cobalt))]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">{r.key}</h2>
                {form.role === r.key && (
                  <span className="rounded-full border border-[hsl(var(--iq-cobalt))] px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--iq-cobalt))]">
                    Selected
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.focus}</p>
              <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                What you will own
              </div>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {r.owns.map((o) => (
                  <li key={o} className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[hsl(var(--iq-cobalt))]" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </motion.div>

        <div id="application" className="max-w-lg mx-auto scroll-mt-24">
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">Apply</h2>
          <p className="text-center text-muted-foreground mb-8">
            Tell us who you are and what you've produced.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                required
                maxLength={100}
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                required
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Role You Are Applying For <span className="text-destructive">*</span>
              </Label>
              <Select required value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="portfolio_url">
                Portfolio or LinkedIn URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="portfolio_url"
                required
                placeholder="https://linkedin.com/in/yourname"
                maxLength={500}
                value={form.portfolio_url}
                onChange={(e) => setForm((f) => ({ ...f, portfolio_url: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="experience">
                What Have You Shipped, And What Did It Produce?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="experience"
                placeholder="Channels, budgets, products, and the numbers you moved."
                maxLength={1000}
                rows={5}
                required
                value={form.experience}
                onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
