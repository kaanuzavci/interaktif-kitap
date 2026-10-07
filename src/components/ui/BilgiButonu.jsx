/**
 * BilgiButonu: "Düğmeler ne işe yarar?" butonu (SAĞ üstte, X'in ALTINDA).
 *
 * Basılınca BookReader, sol üstteki 3 düğmeyi (durdur/ses/tekrar) sırayla
 * işaret edip açıklayan öğretici katmanı (OgreticiKatmani) — hangi sayfada
 * olunursa olunsun — yeniden gösterir.
 *
 * Props:
 *  - onClick : basılınca çalışacak fonksiyon (BookReader'dan gelir)
 */
function BilgiButonu({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Düğmelerin ne işe yaradığını öğren"
      // X (kapat) düğmesinin ALTINDA; 4.5rem = düğme yüksekliği + boşluk
      // (sol sütundaki durdur→ses dikey diziliminin aynı formülü).
      style={{
        right: 'max(0.75rem, env(safe-area-inset-right, 0px))',
        top: 'calc(max(0.75rem, env(safe-area-inset-top, 0px)) + 4.5rem)',
      }}
      className="
        absolute z-40
        flex h-14 w-14 items-center justify-center rounded-full
        md:h-16 md:w-16
        border-4 border-white bg-gunes text-white
        shadow-[0_5px_0_rgba(90,74,120,0.25)]
        transition-all duration-200
        hover:scale-110 active:scale-90 active:shadow-none
      "
    >
      {/* Bilgi (i) ikonu */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="h-7 w-7 md:h-8 md:w-8"
      >
        <circle cx="12" cy="5" r="0.6" fill="currentColor" strokeWidth="2.6" />
        <path d="M12 10.5V19" />
      </svg>
    </button>
  )
}

export default BilgiButonu
