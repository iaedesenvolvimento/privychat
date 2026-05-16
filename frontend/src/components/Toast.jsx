import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ message, type = 'info' }) {
  const palette = type === 'error' ? 'border-rose-400/40 text-rose-100' : 'border-neon/40 text-mist';

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          className={`fixed left-4 right-4 top-5 z-50 mx-auto max-w-md rounded-2xl border bg-ink/90 px-4 py-3 text-sm shadow-glow backdrop-blur ${palette}`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
