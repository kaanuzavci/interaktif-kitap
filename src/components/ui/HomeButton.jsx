/**
 * HomeButton: "Kitaptan çık" butonu (X ikonu, SAĞ üst köşede).
 *
 * Örnek tasarımdaki gibi: sol üstte durdur + ses düğmeleri dururken,
 * kitabı kapatma (ana menüye dönme) düğmesi sağ üstte X olarak durur.
 *
 * Props:
 *  - onClick : basılınca çalışacak fonksiyon (App'ten gelir)
 */
function HomeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Kitabı kapat, ana menüye dön"
      // Sağ üst köşe; güvenli alana (notch/yuvarlak köşe) saygılı.
      style={{
        right: 'max(0.75rem, env(safe-area-inset-right, 0px))',
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
      {/* Kapat (X) ikonu */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="h-7 w-7 md:h-8 md:w-8"
      >
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </svg>
    </button>
  )
}

export default HomeButton
