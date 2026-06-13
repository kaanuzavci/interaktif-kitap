/**
 * Toggle: Açma/kapama anahtarı (çocuk dostu, büyük ve renkli).
 *
 * Ayarlar penceresindeki seçenekler için kullanılır (ses, müzik vb.).
 *
 * Props:
 *  - acik     : anahtar açık mı? (true/false)
 *  - onToggle : tıklanınca çağrılır
 *  - ikon     : sol taraftaki emoji (opsiyonel)
 *  - etiket   : seçeneğin adı (örn. "Ses efektleri")
 */
function Toggle({ acik, onToggle, ikon, etiket }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={acik}
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white"
    >
      {/* Sol: ikon + etiket */}
      <span className="flex items-center gap-3 font-metin text-base font-semibold text-gece md:text-lg">
        {ikon && <span className="text-2xl">{ikon}</span>}
        {etiket}
      </span>

      {/* Sağ: anahtar gövdesi. Açıkken yeşil + topuz sağda,
          kapalıyken gri + topuz solda. */}
      <span
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ${
          acik ? 'bg-cimen' : 'bg-gray-300'
        }`}
      >
        {/* Kayan beyaz topuz */}
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-200 ${
            acik ? 'left-7' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}

export default Toggle
