import IsilYurume from '../characters/IsilYurume.jsx'

// Arka plan resmi: import edince Vite bize dosyanın url'ini verir.
// Bu url'i aşağıda backgroundImage olarak kullanıyoruz.
import sahne1Arkaplan from '../../assets/backgrounds/sahne1-arkaplan.jpg'

/* ---------------------------------------------------------------
   YENİ MEDYA EKLERKEN HATIRLATMA:

   - Ses efekti (mp3) -> src/assets/sounds/ içine koy:
       import { Howl } from 'howler'
       import merhabaSes from '../../assets/sounds/merhaba.mp3'
       const ses = new Howl({ src: [merhabaSes] })
       ses.play()   // örn. karaktere tıklanınca

   - Yeni sprite karakter -> IsilYurume.jsx'i şablon olarak kopyala,
     sadece glob yolundaki klasör adını değiştir.
---------------------------------------------------------------- */

/**
 * Page1: Kitabın ilk sayfası - "Sevgi" bölümünün açılış sahnesi.
 *
 * Katmanlar (alttan üste):
 *  1. Arka plan  : sahne1-arkaplan.jpg (tam ekran, bg-cover)
 *  2. Kalpler    : sevgi temasının animasyonlu süsleri
 *  3. Karakterler: Işıl (gerçek sprite) ve Canım (hâlâ placeholder)
 *  4. Metinler   : başlık ve hikaye cümlesi
 *
 * Konumlandırma: absolute + yüzde (%) değerler.
 * Yüzde sayesinde sahne her ekran boyutunda aynı oranda görünür.
 */
function Page1() {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${sahne1Arkaplan})` }}
    >
      {/* ================= DEKOR: UÇUŞAN KALPLER =================
          (animate-kalp index.css'te tanımlı; animationDelay ile
           aynı anda atmıyorlar, daha doğal duruyor) */}
      <div className="animate-kalp absolute left-[28%] top-[30%] text-3xl md:text-4xl">💗</div>
      <div className="animate-kalp absolute right-[30%] top-[22%] text-2xl md:text-3xl" style={{ animationDelay: '0.8s' }}>💖</div>
      <div className="animate-kalp absolute left-[55%] top-[40%] text-xl md:text-2xl" style={{ animationDelay: '1.6s' }}>💕</div>

      {/* ================= KARAKTERLER ================= */}

      {/* IŞIL - sahnenin solunda, zemin hizasında.
          isPlaying={false}: şimdilik duruş pozunda bekliyor;
          yürüme animasyonunu ileride bir olayla (tıklama, sayfa
          açılışı vb.) tetikleyeceğiz.
          width: clamp(min, tercih, max) -> telefonda 120px'in altına
          inmez, tablette ekranın %18'i kadar olur, 260px'i aşmaz. */}
      <IsilYurume
        isPlaying={false}
        width="clamp(120px, 18vw, 260px)"
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '12%',
        }}
      />

      {/* CANIM (konuşan çiçek) - görseli henüz hazır değil, placeholder.
          Hazır olunca IsilYurume gibi bir sprite component'e dönüşecek. */}
      <div
        className="animate-sallan absolute bottom-[10%] right-[24%] flex flex-col items-center"
        style={{ animationDelay: '1.2s' }}
      >
        <div className="flex h-24 w-20 items-center justify-center rounded-[45%] border-4 border-dashed border-cimen bg-white/70 backdrop-blur-sm md:h-36 md:w-28">
          <span className="text-4xl md:text-5xl">🌸</span>
        </div>
        <span className="mt-2 rounded-full bg-cimen px-4 py-1 font-baslik text-sm font-bold text-white shadow-md md:text-base">
          Canım
        </span>
      </div>

      {/* ================= METİNLER ================= */}

      {/* Bölüm başlığı - üst orta */}
      <h1 className="absolute left-1/2 top-[6%] -translate-x-1/2 font-baslik text-3xl font-extrabold text-gece drop-shadow-[2px_3px_0_rgba(255,255,255,0.9)] md:text-5xl">
        Sevgi 💝
      </h1>

      {/* Hikaye cümlesi - alt orta, konuşma balonu gibi */}
      <p className="absolute bottom-[5%] left-1/2 w-[70%] max-w-xl -translate-x-1/2 rounded-3xl border-4 border-seker/40 bg-white/90 px-6 py-3 text-center font-metin text-base font-semibold text-gece shadow-lg backdrop-blur-sm md:text-xl">
        Işıl, bahçesindeki konuşan çiçeği Canım&apos;la her sabah selamlaşırdı.
      </p>
    </div>
  )
}

export default Page1
