import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const PROMPT_CHIPS = [
  "Create my brain training plan",
  "What are my cognitive strengths?",
  "How can I improve my memory?",
  "Explain neuroplasticity to me",
  "Give me a quick brain exercise",
];

interface ChatWelcomeProps {
  onChipClick: (text: string) => void;
}

export function ChatWelcome({ onChipClick }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-5 px-4">
      {/* Animated Bot Icon */}
      <div className="relative">
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 80, height: 80, top: -4, left: -4 }}
        />
        {/* Icon container */}
        <motion.div
          className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/10"
          animate={{
            y: [0, -6, 0],
            scale: [1, 1.04, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Bot className="w-9 h-9 text-primary" />
        </motion.div>
      </div>

      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-foreground">Welcome to Brain Coach!</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your AI-powered cognitive training assistant. Pick a topic or ask anything.
        </p>
      </div>

      {/* Prompt Chips */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 max-w-md"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.07 } },
        }}
      >
        {PROMPT_CHIPS.map((chip) => (
          <motion.button
            key={chip}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            onClick={() => onChipClick(chip)}
            className="px-3.5 py-2 rounded-full border border-border bg-card text-sm text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {chip}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
