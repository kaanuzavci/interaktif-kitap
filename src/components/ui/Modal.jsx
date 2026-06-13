/**
 * Modal: Ekranın ortasında açılan, arkası bulanık pencere.
 *
 * Ayarlar ve yasal metinler (gizlilik vb.) gibi içerikleri göstermek
 * için tek bir yerden kullanılır. Çocuk dostu: büyük yuvarlak köşeler,
 * iri kapatma butonu.
 *
 * Props:
 *  - acik     : modal görünür mü? (false ise hiç render edilmez)
 *  - baslik   : üstteki başlık metni
 *  - ikon     : başlığın yanındaki emoji (opsiyonel)
 *  - onClose  : kapatma fonksiyonu (X'e veya dışına basınca)
 *  - children : modalin içeriği
 */
function Modal({ acik, baslik, ikon, onClose, children }) {
  if (!acik) return null

  return (
    // Karartılmış arka plan (backdrop). Buraya tıklamak modali kapatır.
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gece/50 p-4 backdrop-blur-sm"
    >
      {/* Pencere kutusu. stopPropagation: içine tıklamak kapatmasın. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop relative w-full max-w-md rounded-[2rem] border-4 border-white bg-krem p-6 shadow-2xl md:p-8"
      >
        {/* Başlık satırı */}
        <div className="mb-5 flex items-center gap-2">
          {ikon && <span className="text-3xl">{ikon}</span>}
          <h2 className="font-baslik text-2xl font-extrabold text-gece md:text-3xl">
            {baslik}
          </h2>
        </div>

        {/* Kapatma butonu (sağ üst köşe) */}
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-seker text-xl font-bold text-white shadow-md transition-transform hover:scale-110 active:scale-90"
        >
          ✕
        </button>

        {/* İçerik */}
        <div className="font-metin text-gece">{children}</div>
      </div>
    </div>
  )
}

export default Modal
