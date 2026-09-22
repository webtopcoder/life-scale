import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const COMPLETIONS = [
  { name: 'John', iq: 120, flag: '🇺🇸' },
  { name: 'Priya', iq: 128, flag: '🇮🇳' },
  { name: 'Hans', iq: 115, flag: '🇩🇪' },
  { name: 'Yuki', iq: 131, flag: '🇯🇵' },
  { name: 'Sofia', iq: 118, flag: '🇪🇸' },
  { name: 'Liam', iq: 124, flag: '🇬🇧' },
  { name: 'Fatima', iq: 112, flag: '🇸🇦' },
  { name: 'Carlos', iq: 126, flag: '🇧🇷' },
  { name: 'Mei', iq: 133, flag: '🇨🇳' },
  { name: 'Olga', iq: 119, flag: '🇷🇺' },
  { name: 'Pierre', iq: 121, flag: '🇫🇷' },
  { name: 'Amara', iq: 117, flag: '🇳🇬' },
  { name: 'Kim', iq: 129, flag: '🇰🇷' },
  { name: 'Lucas', iq: 114, flag: '🇦🇺' },
  { name: 'Anja', iq: 122, flag: '🇸🇪' },
  { name: 'Omar', iq: 125, flag: '🇪🇬' },
  { name: 'Isabella', iq: 116, flag: '🇮🇹' },
  { name: 'Tomasz', iq: 127, flag: '🇵🇱' },
  { name: 'Anika', iq: 113, flag: '🇳🇱' },
  { name: 'Ravi', iq: 130, flag: '🇮🇳' },
  { name: 'Elena', iq: 121, flag: '🇷🇴' },
  { name: 'Kenji', iq: 118, flag: '🇯🇵' },
  { name: 'Sarah', iq: 123, flag: '🇨🇦' },
  { name: 'Diego', iq: 115, flag: '🇲🇽' },
  { name: 'Freya', iq: 132, flag: '🇳🇴' },
  { name: 'Ali', iq: 119, flag: '🇹🇷' },
  { name: 'Chloe', iq: 126, flag: '🇫🇷' },
  { name: 'Viktor', iq: 114, flag: '🇺🇦' },
  { name: 'Nadia', iq: 128, flag: '🇲🇦' },
  { name: 'Ethan', iq: 117, flag: '🇺🇸' },
  { name: 'Suki', iq: 134, flag: '🇯🇵' },
  { name: 'Marco', iq: 120, flag: '🇮🇹' },
  { name: 'Ingrid', iq: 125, flag: '🇸🇪' },
  { name: 'Tariq', iq: 112, flag: '🇵🇰' },
  { name: 'Emma', iq: 129, flag: '🇬🇧' },
  { name: 'Chen', iq: 136, flag: '🇨🇳' },
  { name: 'Astrid', iq: 118, flag: '🇩🇰' },
  { name: 'Rafael', iq: 122, flag: '🇵🇹' },
  { name: 'Hana', iq: 127, flag: '🇨🇿' },
  { name: 'David', iq: 116, flag: '🇮🇱' },
  { name: 'Lucia', iq: 131, flag: '🇦🇷' },
  { name: 'Finn', iq: 113, flag: '🇮🇪' },
  { name: 'Ayla', iq: 124, flag: '🇹🇷' },
  { name: 'Mateo', iq: 119, flag: '🇨🇴' },
  { name: 'Zara', iq: 130, flag: '🇿🇦' },
  { name: 'Oscar', iq: 115, flag: '🇸🇪' },
  { name: 'Mina', iq: 121, flag: '🇮🇷' },
  { name: 'Leo', iq: 128, flag: '🇨🇭' },
  { name: 'Sakura', iq: 133, flag: '🇯🇵' },
  { name: 'Andreas', iq: 117, flag: '🇬🇷' },
  { name: 'Ines', iq: 126, flag: '🇧🇪' },
  { name: 'James', iq: 114, flag: '🇳🇿' },
  { name: 'Linh', iq: 129, flag: '🇻🇳' },
  { name: 'Martin', iq: 120, flag: '🇸🇰' },
  { name: 'Clara', iq: 135, flag: '🇦🇹' },
  { name: 'Kwame', iq: 118, flag: '🇬🇭' },
  { name: 'Julia', iq: 123, flag: '🇩🇪' },
  { name: 'Nikolai', iq: 127, flag: '🇷🇺' },
  { name: 'Emilia', iq: 116, flag: '🇫🇮' },
  { name: 'Samir', iq: 131, flag: '🇱🇧' },
  { name: 'Grace', iq: 122, flag: '🇰🇪' },
];

interface SocialProofToastProps {
  variant?: 'completed' | 'claimed';
}

const SocialProofToast = ({ variant = 'completed' }: SocialProofToastProps) => {
  const isClaimed = variant === 'claimed';
  const SHOW_DURATION = isClaimed ? 2800 : 3500;
  const HIDE_DURATION = isClaimed ? 3500 : 5500;

  // Shuffle once per mount so each session gets a unique order, then cycle round-robin
  const shuffled = useMemo(() => {
    const arr = [...COMPLETIONS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      setVisible(true);
    }, isClaimed ? 2000 : 4000);
    return () => clearTimeout(initialDelay);
  }, [isClaimed]);

  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, SHOW_DURATION);
    return () => clearTimeout(hideTimer);
  }, [visible, index, SHOW_DURATION]);

  useEffect(() => {
    if (visible) return;
    const showTimer = setTimeout(() => {
      setIndex(prev => (prev + 1) % shuffled.length);
      setVisible(true);
    }, HIDE_DURATION);
    return () => clearTimeout(showTimer);
  }, [visible, HIDE_DURATION]);

  const entry = shuffled[index];

  const message = isClaimed ? (
    <>
      <span className="font-semibold text-foreground">{entry.name}</span> just claimed their full report
    </>
  ) : (
    <>
      <span className="font-semibold text-foreground">{entry.name}</span> just finished! IQ: <span className="font-bold text-primary">{entry.iq}</span>
    </>
  );

  return (
    <div className="fixed bottom-20 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 text-sm"
          >
            <span className="text-lg">{entry.flag}</span>
            <span className="text-muted-foreground">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialProofToast;
