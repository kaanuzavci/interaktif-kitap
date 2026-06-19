/**
 * HomeButton: "Ana menüye dön" butonu (ev ikonu).
 *
 * Kitabın içindeyken sol üstte, ses butonunun hemen yanında durur.
 * Basınca giriş ekranına (HomeScreen) döner.
 *
 * Props:
 *  - onClick : basılınca çalışacak fonksiyon (App'ten gelir)
 *
 * Konum: ses butonu left-3 (mobil) / left-5 (geniş), 14-16 birim
 * genişlikte. Ev butonunu onun SAĞINA koyuyoruz (left-20 / left-24).
 */
function HomeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Ana menüye dön"
      // Ses butonunun SAĞINA, güvenli alana saygılı (env=0 → çentiksiz cihazda
      // eski yerinde). 4.5rem = ses butonu genişliği + boşluk.
      style={{
        left: 'calc(max(0.75rem, env(safe-area-inset-left, 0px)) + 4.5rem)',
        top: 'max(0.75rem, env(safe-area-inset-top, 0px))',
      }}
      className="
        absolute z-40
        flex h-14 w-14 items-center justify-center rounded-full
        md:h-16 md:w-16
        border-4 border-white bg-seker text-white
        shadow-[0_5px_0_rgba(90,74,120,0.25)]
        transition-all duration-200
        hover:scale-110 active:scale-90 active:shadow-none
      "
    >
      {/* Ev ikonu (SVG): çatı + gövde */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7 md:h-8 md:w-8"
      >
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    </button>
  )
}

export default HomeButton
