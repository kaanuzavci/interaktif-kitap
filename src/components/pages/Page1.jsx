import { useState } from 'react'
import IsilYurume from '../characters/IsilYurume.jsx'

// Arka plan resmi: import edince Vite bize dosyanın url'ini verir.
import sahne1Arkaplan from '../../assets/backgrounds/sahne1-arkaplan.jpg'

/* ---------------------------------------------------------------
   YÜRÜYÜŞ ROTASI (waypoint sistemi)

   Yol düz olmadığı için Işıl tek hamlede değil, ara duraklardan
   (waypoint) geçerek yürüyor. Her durak = yolun üzerinde bir nokta.
   - left   : soldan uzaklık (ekran genişliğinin yüzdesi)
   - bottom : alttan uzaklık (ekran yüksekliğinin yüzdesi)

   İNCE AYAR: Işıl yola tam basmıyorsa SADECE bu sayılarla oyna.
   İlk eleman başlangıç noktası, son eleman Canım'ın yanı.
   Araya istediğin kadar durak ekleyebilirsin; kod gerisini halleder.
---------------------------------------------------------------- */
const YURUYUS_ROTASI = [
  { left: '28%', bottom: '14%' }, // 0: başlangıç - yolun sol kısmı
  { left: '40%', bottom: '10%' }, // 1: yol hafifçe aşağı iniyor
  { left: '52%', bottom: '8%' },  // 2: yolun en alçak noktası
  { left: '61%', bottom: '9%' },  // 3: varış - Canım'ın yanı
]

// İki durak arası yürüyüş süresi (saniye)
const SEGMENT_SURESI = 1.7

/**
 * Page1: Kitabın ilk sayfası - "Sevgi" bölümünün açılış sahnesi.
 *
 * ETKİLEŞİM: Canım'a (çiçeğe) dokununca Işıl, YURUYUS_ROTASI'ndaki
 * durakları sırayla takip ederek çiçeğin yanına yürür.
 *
 * Nasıl çalışıyor?
 *  - "hedefIndex" Işıl'ın şu an HANGİ durağa doğru gittiğini tutar.
 *  - Durak değişince CSS transition, left ve bottom değerlerini
 *    yavaşça kaydırır (hem yatay hem dikey -> eğimli yürüyüş).
 *  - Kayma bitince tarayıcı onTransitionEnd olayını tetikler;
 *    biz de sıradaki durağa geçeriz. Duraklar bitince animasyon durur.
 */
function Page1() {
  // Işıl'ın yöneldiği durağın sırası (0 = başlangıç noktasında duruyor)
  const [hedefIndex, setHedefIndex] = useState(0)

  // Işıl şu an yürüyor mu? (sprite animasyonu oynasın mı)
  const [yuruyor, setYuruyor] = useState(false)

  // Canım'a dokunulunca: rota başlasın (zaten yoldaysa/vardıysa tekrar başlamasın)
  const canimaTiklandi = () => {
    if (yuruyor || hedefIndex !== 0) return
    setYuruyor(true)
    setHedefIndex(1)
  }

  // Bir durağa varınca: ya sıradaki durağa devam et ya da dur
  const duragaVardi = (e) => {
    // transition iki özellik için de (left VE bottom) ayrı ayrı tetiklenir;
    // ikisini birden saymamak için sadece 'left' olanı dinliyoruz
    if (e.propertyName !== 'left') return

    if (hedefIndex < YURUYUS_ROTASI.length - 1) {
      setHedefIndex(hedefIndex + 1) // sıradaki durağa yürümeye devam
    } else {
      setYuruyor(false) // rota bitti: duruş pozuna geç
    }
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${sahne1Arkaplan})` }}
    >
      {/* ================= DEKOR: UÇUŞAN KALPLER ================= */}
      <div className="animate-kalp absolute left-[28%] top-[30%] text-3xl md:text-4xl">💗</div>
      <div className="animate-kalp absolute right-[30%] top-[22%] text-2xl md:text-3xl" style={{ animationDelay: '0.8s' }}>💖</div>
      <div className="animate-kalp absolute left-[55%] top-[40%] text-xl md:text-2xl" style={{ animationDelay: '1.6s' }}>💕</div>

      {/* ================= KARAKTERLER ================= */}

      {/* IŞIL - konumu (left/bottom) hedefIndex'teki duraktan geliyor.
          Durak değişince CSS transition karakteri oraya yavaşça taşıyor. */}
      <div
        className="absolute z-10"
        style={{
          left: YURUYUS_ROTASI[hedefIndex].left,
          bottom: YURUYUS_ROTASI[hedefIndex].bottom,
          transition: `left ${SEGMENT_SURESI}s linear, bottom ${SEGMENT_SURESI}s linear`,
        }}
        onTransitionEnd={duragaVardi}
      >
        <IsilYurume
          isPlaying={yuruyor}
          width="clamp(110px, 11.5vw, 220px)"
        />
      </div>

      {/* CANIM (konuşan çiçek) - dokununca Işıl'ı çağırır.
          Görseli henüz placeholder; hazır olunca sprite'a dönüşecek. */}
      <button
        onClick={canimaTiklandi}
        aria-label="Canım'a dokun"
        className="animate-sallan absolute bottom-[10%] right-[24%] flex cursor-pointer flex-col items-center"
        style={{ animationDelay: '1.2s' }}
      >
        {/* Dokunma daveti - Işıl yola çıkınca kaybolur */}
        {hedefIndex === 0 && (
          <span className="animate-kalp mb-1 rounded-full bg-white/90 px-3 py-1 font-baslik text-xs font-bold text-seker shadow-md md:text-sm">
            Bana dokun! 👆
          </span>
        )}
        <div className="flex h-24 w-20 items-center justify-center rounded-[45%] border-4 border-dashed border-cimen bg-white/70 backdrop-blur-sm md:h-36 md:w-28">
          <span className="text-4xl md:text-5xl">🌸</span>
        </div>
        <span className="mt-2 rounded-full bg-cimen px-4 py-1 font-baslik text-sm font-bold text-white shadow-md md:text-base">
          Canım
        </span>
      </button>

      {/* ================= METİNLER ================= */}

      {/* Bölüm başlığı - üst orta */}
      <h1 className="absolute left-1/2 top-[5%] -translate-x-1/2 font-baslik text-3xl font-extrabold text-gece drop-shadow-[2px_3px_0_rgba(255,255,255,0.9)] md:text-5xl">
        Sevgi 💝
      </h1>

      {/* Hikaye cümlesi - GEÇİCİ olarak başlığın altına alındı
          (yol ve yürüyüş rahat görülebilsin diye; yeri sonra netleşecek) */}
      <p className="absolute left-1/2 top-[15%] w-[60%] max-w-xl -translate-x-1/2 rounded-3xl border-4 border-seker/40 bg-white/90 px-6 py-3 text-center font-metin text-base font-semibold text-gece shadow-lg backdrop-blur-sm md:text-xl">
        Işıl, bahçesindeki konuşan çiçeği Canım&apos;la her sabah selamlaşırdı.
      </p>
    </div>
  )
}

export default Page1
