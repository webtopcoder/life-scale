import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter, Mail, Copy, Instagram } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface ShareModalProps {
  finalScore: number;
  trigger?: React.ReactNode;
}

export default function ShareModal({ finalScore, trigger }: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const shareUrl = "https://life-scale.com";
  const shareText = `I scored ${finalScore} on Life Scale. See your own score at`;

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "hsl(220 70% 45%)",
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank"),
    },
    {
      name: "Twitter / X",
      icon: Twitter,
      color: "hsl(200 90% 50%)",
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank"),
    },
    {
      name: "Email",
      icon: Mail,
      color: "hsl(30 90% 55%)",
      onClick: () => window.open(`mailto:?subject=${encodeURIComponent(`I scored ${finalScore} on my IQ test!`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`),
    },
    {
      name: "Copy Link",
      icon: Copy,
      color: "hsl(160 60% 45%)",
      onClick: () => {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({ title: "Link copied!", description: "Share it anywhere you like." });
      },
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "hsl(340 75% 55%)",
      onClick: () => {
        toast({ title: "Screenshot & share", description: "Take a screenshot of your results and share it on Instagram Stories!" });
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Share Your Results</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center mb-2">
          Let the world know about your score of <strong className="text-foreground">{finalScore}</strong>
        </p>
        <div className="grid grid-cols-1 gap-2">
          {shareOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <Button
                key={opt.name}
                variant="outline"
                className="justify-start gap-3 h-12"
                onClick={() => { opt.onClick(); setOpen(false); }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${opt.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: opt.color }} />
                </div>
                <span className="text-sm font-medium">{opt.name}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
