import { ShieldCheck } from 'lucide-react';

export default function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-neon text-ink shadow-glow">
        <ShieldCheck size={24} strokeWidth={2.6} />
      </div>
      {!compact && (
        <div>
          <p className="text-xl font-extrabold tracking-normal text-white">PrivyChat</p>
          <p className="text-xs font-medium text-slate-400">Private real-time messenger</p>
        </div>
      )}
    </div>
  );
}
