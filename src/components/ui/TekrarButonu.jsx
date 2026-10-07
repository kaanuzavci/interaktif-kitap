/**
 * TekrarButonu: Sesli anlatımı baştan çalar (sol üstte, ses düğmesinin ALTINDA).
 *
 * Durdur/Devam + Ses aç/kapat düğmeleriyle DİKEY olarak alt alta dizilir
 * (bu, en alttaki üçüncü düğme). Basılınca bulunulan sayfanın arka planda
 * çalan mp3 sesli anlatımı en baştan yeniden çalar.
 *
 * Props:
 *  - onClick : basılınca çalışacak fonksiyon (BookReader'dan; useSahneSesi.tekrarCal)
 */
function TekrarButonu({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Sesli anlatımı baştan çal"
      // Sol üst; durdur (satır 1) + ses (satır 2) altında 3. satır. 9rem = 2×4.5rem.
      style={{
        left: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        top: 'calc(max(0.75rem, env(safe-area-inset-top, 0px)) + 9rem)',
      }}
      className="
        absolute z-40
        flex h-14 w-14 items-center justify-center rounded-full
        md:h-16 md:w-16
        border-4 border-white bg-[#9b6dd6] text-white
        shadow-[0_5px_0_rgba(90,74,120,0.25)]
        transition-all duration-200
        hover:scale-110 active:scale-90 active:shadow-none
      "
    >
      {/* Tekrar (baştan çal) ikonu: geri dönen dairesel ok */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7 md:h-8 md:w-8"
      >
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    </button>
  )
}

export default TekrarButonu
