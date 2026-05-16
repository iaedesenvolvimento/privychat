import { motion } from 'framer-motion';
import Logo from '../components/Logo.jsx';

export default function SplashScreen({ compact = false }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 text-mist">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6"
      >
        <Logo compact={compact} />
        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-neon"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </main>
  );
}
