import { useState } from 'react'
import IsilYurume from '../characters/IsilYurume.jsx'

// Arka plan resmi: import edince Vite bize dosyanın url'ini verir.
import sahne1Arkaplan from '../../assets/backgrounds/sahne1-arkaplan.jpg'

/**
 * Page1: Kitabın ilk sayfası - "Sevgi" bölümünün açılış sahnesi.
 *
 * ETKİLEŞİM: Canım'a (çiçeğe) dokununca Işıl yol boyunca yürüyüp
 * çiçeğin yanına gider. Nasıl çalışıyor?
 *  - "hedefeGidiyor" state'i Işıl'ın konumunu belirliyor:
 *      false -> yolun solunda (başlangıç), true -> Canım'ın yanında
 *  - Konum değişince CSS transition (left 4.5s linear) sayesinde
 *    div YAVAŞÇA kayıyor; ışınlanmıyor.
 *  - Kayma süresince "yuruyor" true olduğu için yürüme animasyonu
 *    oynuyor; kayma bitince (onTransitionEnd) duruş pozuna dönüyor.
 *
 * KONUMLANDIRMA NOTU: Arka plandaki toprak yol, ekranın alt
 * kısmında (alttan ~%13 yukarıda) soldan sağa uzanıyor. Karakterin
 * "bottom" değeri bu yüzden %13 - ayakları yola basıyor.
 */
function Page1() {
  // Işıl Canım'a doğru yola çıktı mı? (konumu bu belirler)
  const [hedefeGidiyor, setHedefeGidiyor] = useState(false)

  // Işıl şu an yürüyor mu? (animasyon oynasın mı)
  const [yuruyor, setYuruyor] = useState(false)

  // Canım'a dokunulunca: yürümeyi başlat (zaten gittiyse tekrar gitmesin)
  const canimaTiklandi = () => {
    if (yuruyor || hedefeGidiyor) return
    setYuruyor(true)
    setHedefeGidiyor(true)
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

      {/* IŞIL - yolun üzerinde durur, Canım'a dokununca ona doğru yürür.
          Konumu (left) dıştaki bu div yönetiyor; IsilYurume sadece
          animasyon karelerini gösteriyor. Görev ayrımı böyle daha temiz.
          z-10: yürürken hikaye balonunun ÖNÜNDEN geçsin. */}
      <div
        className="absolute z-10"
        style={{
          bottom: '13%',
          left: hedefeGidiyor ? '55%' : '18%',
          transition: 'left 4.5s linear',
        }}
        /* CSS kayması bittiğinde tarayıcı bu olayı tetikler ->
           yürüme animasyonunu durdur (duruş pozuna dön) */
        onTransitionEnd={() => setYuruyor(false)}
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
        {!hedefeGidiyor && (
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
      <h1 className="absolute left-1/2 top-[6%] -translate-x-1/2 font-baslik text-3xl font-extrabold text-gece drop-shadow-[2px_3px_0_rgba(255,255,255,0.9)] md:text-5xl">
        Sevgi 💝
      </h1>

      {/* Hikaye cümlesi - alt orta, konuşma balonu gibi */}
      <p className="absolute bottom-[3%] left-1/2 w-[60%] max-w-xl -translate-x-1/2 rounded-3xl border-4 border-seker/40 bg-white/90 px-6 py-3 text-center font-metin text-base font-semibold text-gece shadow-lg backdrop-blur-sm md:text-xl">
        Işıl, bahçesindeki konuşan çiçeği Canım&apos;la her sabah selamlaşırdı.
      </p>
    </div>
  )
}

export default Page1
