/**
 * DuraklatButonu: Durdur/Devam düğmesi (okuyucuda EN sol üstte durur).
 *
 * Basılınca sayfadaki HER ŞEY duraklar: CSS animasyonları, sprite kare
 * döngüleri ve (ileride eklenecek) kitap metninin sesli okunması.
 * Tekrar basılınca hepsi kaldığı yerden devam eder.
 *
 * Props:
 *  - duraklatildi : şu an duraklatılmış mı? (true/false)
 *  - onToggle     : basılınca çalışacak fonksiyon (BookReader'dan gelir)
 */
function DuraklatButonu({ duraklatildi, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={duraklatildi ? 'Devam et' : 'Durdur'}
      // Güvenli alana (notch) saygılı: en sol üst köşe.
      style={{
        left: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        top: 'max(0.75rem, env(safe-area-inset-top, 0px))',
      }}
      className={`
        absolute z-40
        flex h-14 w-14 items-center justify-center rounded-full
        md:h-16 md:w-16
        border-4 border-white text-white
        shadow-[0_5px_0_rgba(90,74,120,0.25)]
        transition-all duration-200
        hover:scale-110 active:scale-90 active:shadow-none
        ${duraklatildi ? 'bg-gunes' : 'bg-[#3d8bd4]'}
      `}
    >
      {duraklatildi ? (
        /* DEVAM (oynat) ikonu: üçgen */
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 md:h-8 md:w-8">
          <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z" />
        </svg>
      ) : (
        /* DURDUR (pause) ikonu: iki dikey çubuk */
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 md:h-8 md:w-8">
          <rect x="6" y="5" width="4.5" height="14" rx="1.5" />
          <rect x="13.5" y="5" width="4.5" height="14" rx="1.5" />
        </svg>
      )}
    </button>
  )
}

export default DuraklatButonu
