import { motion } from "framer-motion";
import { Bot } from "lucide-react";

interface AnimatedBotAvatarProps {
  isStreaming?: boolean;
}

export function AnimatedBotAvatar({ isStreaming }: AnimatedBotAvatarProps) {
  return (
    <motion.div
      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 border border-primary/10"
      animate={
        isStreaming
          ? { scale: [1, 1.1, 1] }
          : { scale: [1, 1.03, 1] }
      }
      transition={{
        duration: isStreaming ? 0.8 : 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Bot className="w-4 h-4 text-primary" />
    </motion.div>
  );
}
