import { useState } from 'react'
import IsilYurume from '../characters/IsilYurume.jsx'

// Arka plan resmi: import edince Vite bize dosyanın url'ini verir.
import sahne1Arkaplan from '../../assets/backgrounds/sahne1-arkaplan.jpg'

/* ---------------------------------------------------------------
   YÜRÜYÜŞ ROTASI (waypoint sistemi)

   Işıl SADECE yolun açıkta kalan bölümünde yürür:
   sol sınır = sahnenin ~%30'u, sağ sınır = ~%60'ı.
   (Çiçeklerin arkasına/önüne geçme derdi kalmasın diye böyle.)

   Işıl ara duraklardan (waypoint) geçerek yürüyor; yolun inişine
   uyması için her durakta hem left hem bottom değişebiliyor.
   - left   : KARAKTERİN SOL KENARININ soldan uzaklığı (sahne %'si).
              Ayaklar kabaca karakter kutusunun ortasına bastığı için
              "ayak konumu" = left + genişliğin yarısı (~%5).
   - bottom : alttan uzaklık (sahne yüksekliğinin yüzdesi)

   İNCE AYAR: Işıl yola tam basmıyorsa SADECE bu sayılarla oyna.
---------------------------------------------------------------- */
const YURUYUS_ROTASI = [
  { left: '27%', bottom: '9%' },   // 0: başlangıç - ayaklar sol sınırda (~%30)
  { left: '36%', bottom: '8.7%' },   // 1: yol hafifçe iniyor
  { left: '41%', bottom: '9.5%' },    // 2: yolun en alçak kısmı
  { left: '49%', bottom: '10.5%' },// 3: varış - sağ kenar sağ sınırda (~%60)
]

/* Yürüme hızı: saniyede kaç "sahne yüzdesi" yol alsın.
   Küçültmek = yavaşlatmak. Süreyi her durak arası mesafeden
   hesapladığımız için hız, rotanın her yerinde sabit kalıyor.
   Adımlamanın hızı ise ayrı: IsilYurume.jsx'teki FRAME_SURESI_MS.
   İkisi uyumsuz olursa "kayarak yürüme" hissi oluşur; bu ikiliyi
   birlikte ayarla (hızı artırırsan frame süresini kısalt). */
const HIZ = 3.5

// İki durak arası yürüyüş süresi (saniye). Mesafeyi Pisagor'la
// buluyoruz; bottom yüzdeleri yatayla aynı ölçeğe getirmek için
// 9/16 ile çarpıyoruz (sahne 16:9 - dikey %1, yatay %1'den kısadır).
function segmentSuresi(hedefIndex) {
  const onceki = YURUYUS_ROTASI[hedefIndex - 1]
  const hedef = YURUYUS_ROTASI[hedefIndex]
  const dx = parseFloat(hedef.left) - parseFloat(onceki.left)
  const dy = (parseFloat(hedef.bottom) - parseFloat(onceki.bottom)) * (9 / 16)
  return Math.hypot(dx, dy) / HIZ
}

/**
 * Page1: Kitabın ilk sayfası - "Sevgi" bölümünün açılış sahnesi.
 *
 * KATMAN SIRASI (z-index, alttan üste):
 *   arka plan (resim) < Işıl (z-10) < Canım/metin (z-30)
 *
 * ETKİLEŞİM: Canım'a dokununca Işıl rotayı takip ederek yanına yürür.
 *  - "hedefIndex": şu an hangi durağa doğru gidiyor
 *  - CSS transition left/bottom'ı yavaşça kaydırır (eğimli yürüyüş)
 *  - onTransitionEnd: durağa varınca sıradakine geç / rotayı bitir
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
    <div className="relative h-full w-full overflow-hidden">
      {/* ================= ARKA PLAN =================
          Sahne de resim de 16:9 olduğu için resim sahneyi
          birebir doldurur, hiçbir yeri kırpılmaz. */}
      <img
        src={sahne1Arkaplan}
        alt=""
        className="absolute inset-0 h-full w-full"
        draggable={false}
      />

      {/* ================= IŞIL (z-10) =================
          Konumu hedefIndex'teki duraktan geliyor; durak değişince CSS
          transition onu oraya, mesafeye göre hesaplanan sürede taşıyor.
          width = Işıl'ın boyutu (sahne genişliğinin yüzdesi). */}
      <div
        className="absolute z-10"
        style={{
          width: '15.5%',
          left: YURUYUS_ROTASI[hedefIndex].left,
          bottom: YURUYUS_ROTASI[hedefIndex].bottom,
          transition:
            hedefIndex === 0
              ? 'none'
              : `left ${segmentSuresi(hedefIndex)}s linear, bottom ${segmentSuresi(hedefIndex)}s linear`,
        }}
        onTransitionEnd={duragaVardi}
      >
        <IsilYurume isPlaying={yuruyor} width="100%" />
      </div>

      {/* ================= CANIM (z-30) - dokununca Işıl'ı çağırır ================= */}
      <button
        onClick={canimaTiklandi}
        aria-label="Canım'a dokun"
        className="animate-sallan absolute bottom-[10%] right-[24%] z-30 flex cursor-pointer flex-col items-center"
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

      {/* ================= METİNLER (z-30) ================= */}

      {/* Bölüm başlığı - üst orta */}
      <h1 className="absolute left-1/2 top-[5%] z-30 -translate-x-1/2 font-baslik text-3xl font-extrabold text-gece drop-shadow-[2px_3px_0_rgba(255,255,255,0.9)] md:text-5xl">
        Sevgi 💝
      </h1>

      {/* Hikaye cümlesi - GEÇİCİ olarak başlığın altında
          (yol ve yürüyüş rahat görülebilsin diye; yeri sonra netleşecek) */}
      <p className="absolute left-1/2 top-[15%] z-30 w-[60%] max-w-xl -translate-x-1/2 rounded-3xl border-4 border-seker/40 bg-white/90 px-6 py-3 text-center font-metin text-base font-semibold text-gece shadow-lg backdrop-blur-sm md:text-xl">
        Işıl, bahçesindeki konuşan çiçeği Canım&apos;la her sabah selamlaşırdı.
      </p>
    </div>
  )
}

export default Page1
