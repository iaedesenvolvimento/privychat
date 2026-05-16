export default function Avatar({ user, size = 'md', online = false }) {
  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-24 w-24 text-2xl'
  };
  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'PC';

  return (
    <div className="relative shrink-0">
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className={`${sizes[size]} rounded-2xl object-cover`} />
      ) : (
        <div className={`${sizes[size]} grid rounded-2xl bg-panel font-bold text-neon ring-1 ring-white/10 place-items-center`}>
          {initials}
        </div>
      )}
      {online && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink bg-emerald" />}
    </div>
  );
}
