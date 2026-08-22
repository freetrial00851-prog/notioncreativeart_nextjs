export function AuthBrandPanel() {
  return (
    <div className="hidden md:flex flex-col justify-center px-12 lg:px-16 py-16 text-white shrink-0 sticky top-0 h-screen" style={{ background: 'var(--color-accent)', width: '42%' }}>
      <div className="max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <img src="/logo-nca.png?v=2" alt="NCA" width={88} height={32} className="h-8 w-auto object-contain shrink-0 rounded-md bg-white px-1.5 py-1" />
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold">Notion Creative Art</p>
            <p className="text-white/70 text-[11px]">Crochet Patterns</p>
          </div>
        </div>
        <h2 className="font-display text-3xl font-semibold mb-4 leading-tight">
          Beautiful Patterns, Made for You
        </h2>
        <p className="text-white/80 text-[14px] leading-relaxed">
          Instantly download easy-to-follow crochet patterns designed with love for makers around the world.
        </p>
      </div>
    </div>
  )
}
