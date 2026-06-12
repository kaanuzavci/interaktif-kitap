/**
 * NavArrow: İleri / geri sayfa geçiş oku.
 *
 * Props:
 *  - direction : "next" (sağ kenar, ileri) veya "prev" (sol kenar, geri)
 *  - onClick   : basılınca çalışacak fonksiyon (Book.jsx'ten gelir)
 *  - hidden    : true ise ok görünmez (ilk/son sayfada kenardaki ok gizlenir)
 *
 * Tasarım notları (çocuk dostu):
 *  - Büyük dokunma alanı (en az 64px) -> küçük parmaklar kolayca bassın
 *  - Yuvarlak, renkli, gölgeli "şeker" görünümü
 *  - Basınca hafifçe küçülür (active:scale-90) -> "bastım" hissi verir
 */
function NavArrow({ direction, onClick, hidden = false }) {
  const isNext = direction === 'next'

  return (
    <button
      onClick={onClick}
      aria-label={isNext ? 'Sonraki sayfa' : 'Önceki sayfa'}
      className={`
        fixed top-1/2 z-40 -translate-y-1/2
        ${isNext ? 'right-3 md:right-5' : 'left-3 md:left-5'}
        flex h-16 w-16 items-center justify-center rounded-full
        md:h-20 md:w-20
        ${isNext ? 'bg-seker' : 'bg-gunes'}
        border-4 border-white text-white
        shadow-[0_6px_0_rgba(90,74,120,0.25)]
        transition-all duration-200
        hover:scale-110 active:scale-90 active:shadow-none
        ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'}
      `}
    >
      {/* Ok ikonu (SVG): direction'a göre sağa veya sola bakar */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-8 w-8 md:h-10 md:w-10 ${isNext ? '' : 'rotate-180'}`}
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

export default NavArrow
