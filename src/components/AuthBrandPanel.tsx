export function AuthBrandPanel() {
  return (
    <div className="hidden md:flex flex-col justify-center px-12 lg:px-16 py-16 text-white shrink-0 sticky top-0 h-screen" style={{ background: 'var(--color-accent)', width: '42%' }}>
      <div className="max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <span className="font-display font-extrabold tracking-tight text-[32px] leading-none">NCA</span>
          <div className="leading-[1.05] text-[10px] font-semibold tracking-[0.06em] uppercase">
            <p>Notion</p>
            <p>Creative</p>
            <p>Art</p>
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
