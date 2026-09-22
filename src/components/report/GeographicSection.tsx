import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, MapPin } from "lucide-react";
import { type ReactNode } from "react";

interface GeographicSectionProps {
  finalScore: number;
  percentile: number;
  addon?: ReactNode;
}

const REGIONS = [
  { name: "East Asia", avg: 106, flag: "🇯🇵" },
  { name: "Europe", avg: 100, flag: "🇪🇺" },
  { name: "North America", avg: 98, flag: "🇺🇸" },
  { name: "South America", avg: 88, flag: "🇧🇷" },
  { name: "Middle East", avg: 84, flag: "🇸🇦" },
  { name: "Sub-Saharan Africa", avg: 71, flag: "🇳🇬" },
];

const COUNTRY_MAP: Record<string, { name: string; avg: number }> = {
  en: { name: "United States", avg: 98 },
  "en-US": { name: "United States", avg: 98 },
  "en-GB": { name: "United Kingdom", avg: 100 },
  "en-AU": { name: "Australia", avg: 99 },
  "en-CA": { name: "Canada", avg: 99 },
  de: { name: "Germany", avg: 102 },
  fr: { name: "France", avg: 98 },
  es: { name: "Spain", avg: 97 },
  it: { name: "Italy", avg: 102 },
  pt: { name: "Portugal", avg: 95 },
  "pt-BR": { name: "Brazil", avg: 87 },
  ja: { name: "Japan", avg: 106 },
  ko: { name: "South Korea", avg: 106 },
  zh: { name: "China", avg: 105 },
  nl: { name: "Netherlands", avg: 102 },
  sv: { name: "Sweden", avg: 101 },
  no: { name: "Norway", avg: 100 },
  da: { name: "Denmark", avg: 98 },
  fi: { name: "Finland", avg: 101 },
  pl: { name: "Poland", avg: 99 },
  ru: { name: "Russia", avg: 97 },
  tr: { name: "Turkey", avg: 90 },
  ar: { name: "Saudi Arabia", avg: 84 },
  hi: { name: "India", avg: 82 },
};

function getLocalInfo(): { name: string; avg: number } {
  try {
    const lang = navigator.language;
    if (COUNTRY_MAP[lang]) return COUNTRY_MAP[lang];
    const base = lang.split("-")[0];
    if (COUNTRY_MAP[base]) return COUNTRY_MAP[base];
  } catch {}
  return { name: "United States", avg: 98 };
}

function scoreToPercentileForAvg(userScore: number, avg: number): number {
  const z = (userScore - avg) / 15;
  // Approximate CDF for normal distribution
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? Math.round((1 - p) * 100) : Math.round(p * 100);
}

export default function GeographicSection({ finalScore, percentile, addon }: GeographicSectionProps) {
  const local = getLocalInfo();
  const localPercentile = scoreToPercentileForAvg(finalScore, local.avg);
  const maxBarScore = Math.max(finalScore, ...REGIONS.map(r => r.avg));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Geographic Comparison</h3>
        <p className="text-sm text-muted-foreground mt-1">How you stack up across the globe</p>
      </div>

      {/* Global ranking */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-[var(--shadow-elevated)]">
          <CardContent className="p-4 text-center">
            <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-black text-primary">Top {Math.max(1, Math.min(8, Math.round(100 - percentile)))}%</div>
            <div className="text-xs text-muted-foreground">Worldwide</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[var(--shadow-elevated)]">
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-2xl font-black text-accent">Top {Math.max(1, Math.min(12, Math.round(100 - localPercentile)))}%</div>
            <div className="text-xs text-muted-foreground">In {local.name}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Worldwide compares you against everyone who has taken a standardised reasoning assessment; local
            compares you against the people you live and compete among. The gap is the interesting part.
          </p>
        </CardContent>
      </Card>

      {addon}

      {/* Regional bar chart */}
      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-5 space-y-3">
          <div className="text-sm font-semibold text-foreground mb-3">Your Score vs. Regional Averages</div>
          
          {/* User bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-primary">📍 You</span>
              <span className="font-bold text-primary">{finalScore}</span>
            </div>
            <div className="h-5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(finalScore / maxBarScore) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {REGIONS.map((region, i) => (
            <div key={region.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {region.flag} {region.name}
                </span>
                <span className="text-muted-foreground font-medium">{region.avg}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: finalScore > region.avg ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(var(--accent) / 0.5)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(region.avg / maxBarScore) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">A note on regional averages:</strong> they differ because of education access and test familiarity, not innate ability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
