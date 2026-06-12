// import { Howl } from 'howler'

/* ---------------------------------------------------------------
   GERÇEK GÖRSELLER HAZIR OLUNCA NASIL KULLANILIR?

   1. Arka plan resmi (jpg/png) -> src/assets/backgrounds/ içine koy:
        import sahne1 from '../../assets/backgrounds/sahne1.jpg'
      Sonra aşağıdaki en dış div'e şunu ekle:
        style={{ backgroundImage: `url(${sahne1})` }}
      ve "bg-cover bg-center" sınıflarını kullan.

   2. Karakter animasyonu (Lottie JSON) -> src/assets/characters/ içine koy:
        import Lottie from 'lottie-react'
        import isilAnimasyon from '../../assets/characters/isil.json'
      Placeholder div'in yerine:
        <Lottie animationData={isilAnimasyon} loop />

   3. Ses efekti (mp3) -> src/assets/sounds/ içine koy:
        import merhabaSes from '../../assets/sounds/merhaba.mp3'
        const ses = new Howl({ src: [merhabaSes] })
        ses.play()   // örn. karaktere tıklanınca
---------------------------------------------------------------- */

/**
 * Page1: Kitabın ilk sayfası - "Sevgi" bölümünün açılış sahnesi.
 *
 * Sahne düzeni (katman katman, alttan üste):
 *  1. Arka plan  : gökyüzü degradesi (şimdilik CSS, sonra resim olacak)
 *  2. Dekorlar   : güneş, bulutlar, tepeler, kalpler
 *  3. Karakterler: Işıl ve Canım (şimdilik placeholder, sonra Lottie)
 *  4. Metin      : sayfa başlığı ve hikaye cümlesi
 *
 * Konumlandırma mantığı:
 *  Tüm öğeler "absolute" + yüzde (%) değerlerle yerleştirildi.
 *  Yüzde kullanmak, sahnenin her ekran boyutunda (telefon/tablet)
 *  aynı oranlarda görünmesini sağlar.
 */
function Page1() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-gokyuzu via-[#ffe9f0] to-krem">
      {/* ================= DEKORLAR ================= */}

      {/* Güneş - sağ üst köşe (iki iç içe daire ile parlama efekti) */}
      <div className="absolute right-[8%] top-[8%] h-24 w-24 rounded-full bg-gunes opacity-40 blur-xl md:h-36 md:w-36" />
      <div className="absolute right-[10%] top-[10%] h-16 w-16 rounded-full bg-gunes shadow-lg md:h-24 md:w-24" />

      {/* Bulutlar - yavaşça süzülür (animate-yuzen: index.css'te tanımlı) */}
      <div className="animate-yuzen absolute left-[15%] top-[12%] h-8 w-24 rounded-full bg-white/80 md:h-12 md:w-36" />
      <div
        className="animate-yuzen absolute left-[45%] top-[6%] h-6 w-20 rounded-full bg-white/60 md:h-10 md:w-32"
        style={{ animationDelay: '2s' }} /* aynı anda hareket etmesinler */
      />

      {/* Tepeler - ekranın altında iki yeşil yarım daire */}
      <div className="absolute -bottom-[18%] -left-[10%] h-[45%] w-[70%] rounded-[50%] bg-cimen" />
      <div className="absolute -bottom-[22%] -right-[15%] h-[48%] w-[75%] rounded-[50%] bg-cimen brightness-95" />

      {/* Uçuşan kalpler - "Sevgi" temasının simgesi (animate-kalp ile atar) */}
      <div className="animate-kalp absolute left-[28%] top-[30%] text-3xl md:text-4xl">💗</div>
      <div className="animate-kalp absolute right-[30%] top-[22%] text-2xl md:text-3xl" style={{ animationDelay: '0.8s' }}>💖</div>
      <div className="animate-kalp absolute left-[55%] top-[40%] text-xl md:text-2xl" style={{ animationDelay: '1.6s' }}>💕</div>

      {/* ================= KARAKTERLER ================= */}

      {/* IŞIL (ana karakter) - sahnenin sol-orta kısmında durur.
          Bu div ileride <Lottie animationData={...} /> ile değişecek. */}
      <div className="animate-sallan absolute bottom-[12%] left-[18%] flex flex-col items-center">
        {/* Placeholder gövde */}
        <div className="flex h-32 w-24 items-center justify-center rounded-[45%] border-4 border-dashed border-seker bg-white/70 backdrop-blur-sm md:h-48 md:w-36">
          <span className="text-4xl md:text-6xl">👧</span>
        </div>
        {/* Karakter ismi etiketi */}
        <span className="mt-2 rounded-full bg-seker px-4 py-1 font-baslik text-sm font-bold text-white shadow-md md:text-base">
          Işıl
        </span>
      </div>

      {/* CANIM (konuşan çiçek) - Işıl'ın sağında, biraz daha küçük */}
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
