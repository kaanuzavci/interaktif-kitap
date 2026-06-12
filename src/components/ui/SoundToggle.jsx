/**
 * SoundToggle: Ses aç/kapat butonu (sol üst köşede sabit durur).
 *
 * Props:
 *  - soundOn  : ses şu an açık mı? (true/false)
 *  - onToggle : basılınca çalışacak fonksiyon (Book.jsx'ten gelir)
 *
 * Ses kapalıyken buton gri görünür ve hoparlör ikonunun
 * yanında "ses dalgaları" yerine çarpı (x) gösterilir.
 */
function SoundToggle({ soundOn, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={soundOn ? 'Sesi kapat' : 'Sesi aç'}
      className={`
        fixed left-3 top-3 z-40 md:left-5 md:top-5
        flex h-14 w-14 items-center justify-center rounded-full
        md:h-16 md:w-16
        border-4 border-white text-white
        shadow-[0_5px_0_rgba(90,74,120,0.25)]
        transition-all duration-200
        hover:scale-110 active:scale-90 active:shadow-none
        ${soundOn ? 'bg-cimen' : 'bg-gray-400'}
      `}
    >
      {/* Hoparlör ikonu (SVG) */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7 md:h-8 md:w-8"
      >
        {/* Hoparlörün gövdesi (her iki durumda da çizilir) */}
        <path d="M3 9v6h4l5 5V4L7 9H3z" />

        {soundOn ? (
          /* Ses AÇIK: hoparlörün yanında ses dalgaları */
          <path
            d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          /* Ses KAPALI: hoparlörün yanında çarpı işareti */
          <path
            d="M16 9l5 6M21 9l-5 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  )
}

export default SoundToggle
