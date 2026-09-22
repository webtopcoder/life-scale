import { useRef, useCallback, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Share2, Pencil, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ShareModal from "@/components/report/ShareModal";

interface CertificateSectionProps {
  finalScore: number;
  percentile: number;
  strongest: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  logic: "Logical Reasoning",
  pattern: "Pattern Recognition",
  spatial: "Spatial Awareness",
  speed: "Processing Speed",
  self: "Self-Assessment",
};

function generateCertId(userId: string | undefined): string {
  const base = userId || "anon";
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(5, "0").slice(0, 5);
  return `TIQ-${dateStr}-${hex}`;
}

const GoldSeal = ({ size = 80 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer star burst */}
    {Array.from({ length: 16 }).map((_, i) => {
      const angle = (i * 360) / 16;
      const rad = (angle * Math.PI) / 180;
      const outerR = i % 2 === 0 ? 48 : 38;
      const x = 50 + outerR * Math.cos(rad);
      const y = 50 + outerR * Math.sin(rad);
      return <circle key={i} cx={x} cy={y} r={3} fill="hsl(43, 80%, 55%)" />;
    })}
    {/* Outer ring */}
    <circle cx="50" cy="50" r="42" stroke="hsl(43, 80%, 55%)" strokeWidth="2" fill="none" />
    <circle cx="50" cy="50" r="38" stroke="hsl(43, 70%, 60%)" strokeWidth="1" fill="none" />
    {/* Inner fill */}
    <circle cx="50" cy="50" r="36" fill="hsl(43, 80%, 55%)" fillOpacity="0.12" />
    <circle cx="50" cy="50" r="30" stroke="hsl(43, 70%, 50%)" strokeWidth="1.5" fill="none" />
    {/* Shield icon */}
    <path d="M50 28 L62 35 L62 50 C62 60 50 70 50 70 C50 70 38 60 38 50 L38 35 Z" stroke="hsl(43, 80%, 50%)" strokeWidth="2" fill="hsl(43, 80%, 55%)" fillOpacity="0.25" />
    {/* Check mark */}
    <path d="M44 50 L48 54 L56 44" stroke="hsl(43, 80%, 45%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export default function CertificateSection({ finalScore, percentile, strongest }: CertificateSectionProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const fallbackName = user?.email?.split("@")[0] || "Test Taker";
  const [certName, setCertName] = useState(fallbackName);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(certName);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const certId = useMemo(() => generateCertId(user?.id), [user?.id]);
  const scoredHigherThan = Math.max(1, Math.round(percentile));

  const handleSaveName = () => {
    const trimmed = editValue.trim();
    if (trimmed.length > 0 && trimmed.length <= 60) {
      setCertName(trimmed);
    }
    setIsEditing(false);
  };

  const handleDownload = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IQ Certificate - ${certName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8f9fa; }
          .cert { width: 700px; padding: 60px; background: white; border: 3px solid #1a56db; position: relative; }
          .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid #1a56db33; pointer-events: none; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 36px; font-weight: 900; color: #1a56db; letter-spacing: 3px; margin-bottom: 12px; }
          .title { font-size: 28px; font-weight: 900; color: #1a56db; letter-spacing: 2px; text-transform: uppercase; }
          .subtitle { font-size: 14px; color: #6b7280; margin-top: 8px; }
          .name { font-size: 32px; font-weight: 700; text-align: center; margin: 30px 0 10px; color: #111; }
          .divider { height: 2px; background: linear-gradient(90deg, transparent, #1a56db, transparent); margin: 20px 0; }
          .score-hero { text-align: center; margin: 30px 0; }
          .score-val { font-size: 72px; font-weight: 900; color: #1a56db; line-height: 1; }
          .score-label { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
          .percentile-line { text-align: center; font-size: 15px; color: #374151; margin: 16px 0; }
          .trait { text-align: center; margin: 24px 0; }
          .trait-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
          .trait-val { font-size: 22px; font-weight: 700; color: #1a56db; }
          .seal-container { text-align: center; margin: 30px 0 10px; }
          .seal { display: inline-block; width: 80px; height: 80px; border-radius: 50%; border: 3px solid #d4a017; background: radial-gradient(circle, #fdf3d0, #f5d87e); position: relative; }
          .seal::after { content: '✓'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #8b6914; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af; }
          .cert-id { font-family: monospace; font-size: 11px; color: #9ca3af; letter-spacing: 1px; }
          @media print { body { background: white; } .cert { border: 3px solid #1a56db; } }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="header">
            <div class="logo">Life Scale</div>
            <div class="title">Certificate of Cognitive Assessment</div>
            <div class="subtitle">This certifies that the following individual has completed a comprehensive cognitive evaluation</div>
          </div>
          <div class="name">${certName}</div>
          <div class="divider"></div>
          <div class="score-hero">
            <div class="score-val">${finalScore}</div>
          </div>
          <div class="percentile-line">Scored higher than ${scoredHigherThan}% of all test takers</div>
          <div class="trait">
            <div class="trait-label">Primary Cognitive Strength</div>
            <div class="trait-val">${CATEGORY_LABELS[strongest] || strongest}</div>
          </div>
          <div class="seal-container"><div class="seal"></div></div>
          <div class="divider"></div>
          <div class="footer">
            <div>Assessed on ${date}</div>
            <div style="margin-top:4px;">Life Scale Cognitive Assessment Platform</div>
            <div class="cert-id" style="margin-top:8px;">${certId}</div>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [certName, finalScore, percentile, strongest, date, certId, scoredHigherThan]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Your IQ Certificate</h3>
        <p className="text-sm text-muted-foreground mt-1">Add your name, then download or print your official results</p>
      </div>

      {/* Editable name field */}
      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Name on Certificate</div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                maxLength={60}
                className="text-lg font-semibold"
                autoFocus
                placeholder="Enter your full name"
              />
              <Button size="sm" onClick={handleSaveName} className="rounded-lg gap-1">
                <Check className="w-4 h-4" />
                Save
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setEditValue(certName); setIsEditing(true); }}
              className="flex items-center gap-2 group w-full text-left"
            >
              <span className="text-lg font-semibold text-foreground">{certName}</span>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          )}
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <Card className="border-[3px] border-primary/30 shadow-[var(--shadow-elevated)] overflow-hidden relative" ref={certRef}>
          {/* Inner border */}
          <div className="absolute inset-2 border border-primary/15 pointer-events-none rounded-sm" />

          <CardContent className="p-6 md:p-10 text-center space-y-4 relative">
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/40" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/40" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/40" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/40" />

            <div className="text-2xl font-black text-primary tracking-[3px]">Life Scale</div>

            <div className="text-xs uppercase tracking-[3px] text-muted-foreground font-semibold">
              Certificate of Cognitive Assessment
            </div>

            <div className="text-2xl font-bold text-foreground capitalize">{certName}</div>

            <div className="w-24 h-px bg-primary/30 mx-auto" />

            {/* Hero score */}
            <div>
              <div className="text-6xl font-black text-primary leading-none">{finalScore}</div>
            </div>

            {/* Percentile context */}
            <p className="text-sm text-muted-foreground">
              Scored higher than <span className="font-semibold text-foreground">{scoredHigherThan}%</span> of all test takers
            </p>

            <div className="w-16 h-px bg-border mx-auto" />

            {/* Strongest category */}
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[1.5px] mb-1">Primary Cognitive Strength</div>
              <div className="text-lg font-bold text-primary">{CATEGORY_LABELS[strongest] || strongest}</div>
            </div>

            {/* Gold seal */}
            <div className="flex justify-center pt-2">
              <GoldSeal size={72} />
            </div>

            <div className="w-24 h-px bg-primary/30 mx-auto" />

            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground">{date}</div>
              <div className="font-mono text-[10px] text-muted-foreground/70 tracking-wider">{certId}</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex gap-3">
        <Button onClick={handleDownload} className="flex-1 h-12 text-base font-semibold rounded-xl gap-2">
          <Download className="w-5 h-5" />
          Download PDF
        </Button>
        <ShareModal
          finalScore={finalScore}
          trigger={
            <Button variant="outline" className="h-12 px-5 rounded-xl gap-2">
              <Share2 className="w-5 h-5" />
              Share
            </Button>
          }
        />
      </div>
    </div>
  );
}
