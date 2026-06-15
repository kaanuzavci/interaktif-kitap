import { useState } from 'react'
import IsilYurume from '../../characters/IsilYurume.jsx'

/* ===============================================================
   SEVGİ — 1. SAHNE İÇERİĞİ (etkileşimli katmanlar)

   Bu, "Sevgi" kitabının açılış sahnesinin Işıl + Canım kısmıdır.
   Arka plan ve hikaye metni artık burada DEĞİL; onları Sahne.jsx
   çiziyor. Burada yalnızca sahneye özgü ETKİLEŞİM var:
   Canım'a dokununca Işıl rotayı takip ederek yanına yürür.

   Bu component "icerikBileseni" olarak sevgiSahneleri.js'e bağlanır.
   Tüm konumlar sahnenin (tam 16:9 yüzeyin) yüzdesidir; kitap iki
   sayfaya bölündüğünde bu yüzde koordinatlar korunur.

   PROP: canli
   - true  : tam etkileşim (yürüyüş, dokunma daveti, ayar paneli)
   - false : DONUK görünüm (sayfa çevrilirken yaprağın üstünde
             statik kopya olarak çizilir). Işıl başlangıç pozunda
             durur, dokunma daveti gösterilmez.
=============================================================== */

/* ---------------------------------------------------------------
   YÜRÜYÜŞ ROTASI (waypoint sistemi)
   Işıl yolun açıkta kalan bölümünde (sahnenin ~%27–%49'u) yürür.
   - left   : karakter kutusunun soldan uzaklığı (sahne %'si)
   - bottom : alttan uzaklık (sahne yüksekliğinin %'si)
   İnce ayar: Işıl yola tam basmıyorsa SADECE bu sayılarla oyna.
---------------------------------------------------------------- */
const YURUYUS_ROTASI = [
  { left: '27%', bottom: '1%' }, // 0: başlangıç
  { left: '36%', bottom: '1%' }, // 1: yol hafifçe iniyor
  { left: '41%', bottom: '1%' }, // 2: yolun en alçak kısmı
  { left: '49%', bottom: '1%' }, // 3: varış (Canım'a yaklaşır)
]

/* HIZ ile FRAME_SURESI'nin UYUMU önemli (bkz. eski Page1 notları):
   - "Kayarak gidiyor"  -> HIZ'ı düşür
   - "Yerinde sayıyor"  -> FRAME_SURESI'ni artır
   Tasarımcılar siteye ?ayar ekleyerek paneli açıp deneyebilir. */
const HIZ = 2.5
const FRAME_SURESI = 150

// İki durak arası süre (sn). Mesafeyi Pisagor'la buluyoruz; dikey %'yi
// yatayla aynı ölçeğe getirmek için 9/16 ile çarpıyoruz (sahne 16:9).
function segmentSuresi(hedefIndex, hiz) {
  const onceki = YURUYUS_ROTASI[hedefIndex - 1]
  const hedef = YURUYUS_ROTASI[hedefIndex]
  const dx = parseFloat(hedef.left) - parseFloat(onceki.left)
  const dy = (parseFloat(hedef.bottom) - parseFloat(onceki.bottom)) * (9 / 16)
  return Math.hypot(dx, dy) / hiz
}

// Ayar paneli yalnızca URL'de ?ayar varsa açılır (tasarımcılar için).
// Canlı sitede normal kullanıcı görmez; kitabı kalabalıklaştırmaz.
const AYAR_MODU =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('ayar')

function SevgiSahne1({ canli = true }) {
  // Işıl'ın yöneldiği durağın sırası (0 = başlangıçta duruyor)
  const [hedefIndex, setHedefIndex] = useState(0)
  // Işıl şu an yürüyor mu? (sprite animasyonu oynasın mı)
  const [yuruyor, setYuruyor] = useState(false)
  // Ayar panelinin canlı değerleri
  const [hiz, setHiz] = useState(HIZ)
  const [frameSuresi, setFrameSuresi] = useState(FRAME_SURESI)

  // "Başa sar": Işıl'ı başlangıca ışınla
  const basaSar = () => {
    setYuruyor(false)
    setHedefIndex(0)
  }

  // Canım'a dokununca rota başlasın (donuk modda etkileşim yok)
  const canimaTiklandi = () => {
    if (!canli || yuruyor || hedefIndex !== 0) return
    setYuruyor(true)
    setHedefIndex(1)
  }

  // Bir durağa varınca: ya devam et ya da dur
  const duragaVardi = (e) => {
    if (e.propertyName !== 'left') return // left VE bottom'u ayrı saymamak için
    if (hedefIndex < YURUYUS_ROTASI.length - 1) {
      setHedefIndex(hedefIndex + 1)
    } else {
      setYuruyor(false)
    }
  }

  return (
    <div className="absolute inset-0">
      {/* ===== IŞIL (z-10) =====
          Konumu hedefIndex'teki duraktan gelir; durak değişince CSS
          transition onu mesafeye göre hesaplanan sürede taşır. */}
      <div
        className="absolute z-10"
        style={{
          width: '17.5%',
          left: YURUYUS_ROTASI[hedefIndex].left,
          bottom: YURUYUS_ROTASI[hedefIndex].bottom,
          transition:
            hedefIndex === 0
              ? 'none'
              : `left ${segmentSuresi(hedefIndex, hiz)}s linear, bottom ${segmentSuresi(hedefIndex, hiz)}s linear`,
        }}
        onTransitionEnd={duragaVardi}
      >
        <IsilYurume isPlaying={canli && yuruyor} width="100%" frameSuresiMs={frameSuresi} />
      </div>

      {/* ===== CANIM (z-30) — dokununca Işıl'ı çağırır ===== */}
      <button
        onClick={canimaTiklandi}
        aria-label="Canım'a dokun"
        disabled={!canli}
        className={`absolute bottom-[10%] right-[24%] z-30 flex flex-col items-center ${
          canli ? 'animate-sallan cursor-pointer' : 'cursor-default'
        }`}
        style={{ animationDelay: '1.2s' }}
      >
        {/* Dokunma daveti — yalnızca canlı modda ve Işıl yola çıkmadan önce */}
        {canli && hedefIndex === 0 && (
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

      {/* ===== AYAR PANELİ (yalnızca ?ayar + canlı modda) ===== */}
      {AYAR_MODU && canli && (
        <div className="absolute bottom-3 left-3 z-50 w-64 rounded-2xl bg-gece/90 p-4 font-metin text-sm text-white shadow-xl">
          <p className="mb-2 font-baslik font-bold">🔧 Yürüyüş ayarları</p>

          <label className="block">
            Hız: <b>{hiz}</b> (ekranda ilerleme)
            <input
              type="range" min="1" max="8" step="0.5"
              value={hiz}
              onChange={(e) => setHiz(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="mt-2 block">
            Adım süresi: <b>{frameSuresi}ms</b> (bacak temposu)
            <input
              type="range" min="60" max="300" step="10"
              value={frameSuresi}
              onChange={(e) => setFrameSuresi(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <button
            onClick={basaSar}
            className="mt-3 w-full rounded-full bg-gunes py-1.5 font-baslik font-bold text-gece"
          >
            ⏪ Başa sar
          </button>

          <div className="mt-3 rounded-xl bg-black/30 px-3 py-2 text-center text-xs">
            <p className="mb-0.5 opacity-70">📋 Bu değerleri iletin:</p>
            <p className="font-baslik font-bold text-gunes">
              Hız = {hiz} · Adım = {frameSuresi}ms
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SevgiSahne1
