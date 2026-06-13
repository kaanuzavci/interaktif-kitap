/**
 * IconButton: Köşelerde duran yuvarlak, renkli ikon butonu.
 *
 * Giriş ekranındaki ayarlar (dişli) gibi tekil aksiyonlar için genel
 * amaçlı bir buton. SoundToggle/HomeButton'la aynı görsel dilde ama
 * tek bir emoji/sembol gösterir.
 *
 * Props:
 *  - onClick : tıklanınca çağrılır
 *  - label   : erişilebilirlik etiketi (aria-label)
 *  - renk    : Tailwind arka plan sınıfı (örn. "bg-gunes")
 *  - className: ek konumlandırma sınıfları (örn. "right-3 top-3")
 *  - children: gösterilecek ikon (emoji veya SVG)
 */
function IconButton({ onClick, label, renk = 'bg-gunes', className = '', children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        absolute z-40 flex h-14 w-14 items-center justify-center rounded-full
        md:h-16 md:w-16
        border-4 border-white text-2xl text-white md:text-3xl
        shadow-[0_5px_0_rgba(90,74,120,0.25)]
        transition-all duration-200
        hover:scale-110 active:scale-90 active:shadow-none
        ${renk} ${className}
      `}
    >
      {children}
    </button>
  )
}

export default IconButton
