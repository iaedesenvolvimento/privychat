import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function TextField({ label, error, type = 'text', icon: Icon, ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-300">{label}</span>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />}
        <input
          type={isPassword && visible ? 'text' : type}
          className={`w-full rounded-2xl border bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-neon focus:ring-4 focus:ring-neon/10 ${Icon ? 'pl-11' : ''} ${isPassword ? 'pr-12' : ''} ${error ? 'border-rose-400/70' : 'border-white/10'}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-white/10"
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="mt-2 block text-xs font-medium text-rose-300">{error}</span>}
    </label>
  );
}
