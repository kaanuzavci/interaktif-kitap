import { useEffect, useRef, useState } from 'react'
import IsilYurume from '../../characters/IsilYurume.jsx'
import TiklamaliSprite from '../TiklamaliSprite.jsx'

// Ön plan çimeni (tavşan/kütüğün ÖNÜNDE, Işıl'ın ARKASINDA kalır)
import cimen from '../../../assets/backgrounds/cimen.png'

/* ===============================================================
   SEVGİ — 1. SAHNE İÇERİĞİ (katmanlar + etkileşim)

   Bu sahnenin GÖRÜNÜMÜ artık tek bir hazır resim (sahne1-arkaplan)
   değil; katmanların birleşiminden oluşuyor (Sahne.jsx arka planı
   "arka_plan.jpg" olarak çiziyor, biz üstüne ekliyoruz):

     arka_plan.jpg  (Sahne çiziyor)           — en altta
     tavşan+kütük   (TiklamaliSprite)         — çimenin ARKASINDA, tıklanınca zıplar
     cimen.png      (bu dosya)                — ön çimen, kütüğün ÖNÜ, IŞIL'IN ARKASI
     uğurböceği     (TiklamaliSprite)         — papatya üstünde, tıklanınca hoplar
     Işıl           (yürür)                   — çimenin önünde
     Canım (çiçek)  — dokununca Işıl yürür    — en üstte

   Tavşan/uğurböceği kütük & papatyaları zaten kendi karelerinde var;
   bu yüzden arka_plan'a sabit olarak konmadılar (yoksa çift görünürdü).

   PROP: canli
   - true  : tam etkileşim
   - false : DONUK (sayfa çevirme sırasındaki statik kopya)
=============================================================== */

/* Tavşan ve uğurböceği kare dizilerini otomatik topla (sıralı) */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const tavsanKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/tavsan-zipla/*.png', {
    eager: true,
    import: 'default',
  }),
)
const ugurKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/ugurbocegi-zipla/*.png', {
    eager: true,
    import: 'default',
  }),
)

/* ---------------------------------------------------------------
   IŞIL YÜRÜYÜŞ ROTASI — (DEĞİŞMEDİ, mevcut mantık korunuyor)
---------------------------------------------------------------- */
const YURUYUS_ROTASI = [
  { left: '27%', bottom: '1%' },
  { left: '36%', bottom: '1%' },
  { left: '41%', bottom: '1%' },
  { left: '49%', bottom: '1%' },
]
const HIZ = 2.5
const FRAME_SURESI = 150

function segmentSuresi(hedefIndex, hiz) {
  const onceki = YURUYUS_ROTASI[hedefIndex - 1]
  const hedef = YURUYUS_ROTASI[hedefIndex]
  const dx = parseFloat(hedef.left) - parseFloat(onceki.left)
  const dy = (parseFloat(hedef.bottom) - parseFloat(onceki.bottom)) * (9 / 16)
  return Math.hypot(dx, dy) / hiz
}

/* ---------------------------------------------------------------
   SPRITE YERLEŞTİRME — sahne1-arkaplan'daki konuma göre ölçülen
   başlangıç değerleri. Tam piksel hizası için ?ayar panelinden
   ince ayar yapılabilir (kaydırakların altındaki değerler bana
   iletilince buraya sabit yazarız).

   Kare bir noktası (px%,py%) -> sahnede (x + olcek*px, y + olcek*py)
---------------------------------------------------------------- */
const TAVSAN_VARSAYILAN = { olcek: 0.39, x: -8, y: 41.5 }
const UGUR_VARSAYILAN = { olcek: 0.18, x: 76.1, y: 51.3 }

// Tıklama alanları — sprite konumlarına göre hizalı
// Tavşan kütüğü: sprite olcek=0.39, x=-8%, y=41.5% → kütük sahnenin sol-altında
const TAVSAN_HOTSPOT = { left: '1%', top: '45%', width: '16%', height: '32%' }
// Uğurböceği: sprite olcek=0.18, x=76.1%, y=51.3% → sağ alt papatyanın üstünde
const UGUR_HOTSPOT = { left: '80%', top: '56%', width: '12%', height: '16%' }

// Ayar paneli yalnızca URL'de ?ayar varsa görünür (tasarımcılar için)
const AYAR_MODU =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('ayar')

function SevgiSahne1({ canli = true }) {
  // --- IŞIL YÜRÜYÜŞÜ ---
  const [hedefIndex, setHedefIndex] = useState(0)
  const [yuruyor, setYuruyor] = useState(false)
  const [hiz, setHiz] = useState(HIZ)
  const [frameSuresi, setFrameSuresi] = useState(FRAME_SURESI)
  const basaSarTimeout = useRef(null)

  // --- SPRITE YERLEŞTİRME (ayar panelinden canlı değiştirilebilir) ---
  const [tavsan, setTavsan] = useState(TAVSAN_VARSAYILAN)
  const [ugur, setUgur] = useState(UGUR_VARSAYILAN)

  // Timeout temizliği
  useEffect(() => {
    return () => {
      if (basaSarTimeout.current) clearTimeout(basaSarTimeout.current)
    }
  }, [])

  const basaSar = () => {
    if (basaSarTimeout.current) clearTimeout(basaSarTimeout.current)
    basaSarTimeout.current = null
    setYuruyor(false)
    setHedefIndex(0)
  }
  const canimaTiklandi = () => {
    if (!canli || yuruyor || hedefIndex !== 0) return
    setYuruyor(true)
    setHedefIndex(1)
  }
  const duragaVardi = (e) => {
    if (e.propertyName !== 'left') return
    if (hedefIndex < YURUYUS_ROTASI.length - 1) {
      setHedefIndex(hedefIndex + 1)
    } else {
      // Yürüyüş bitti — 2 saniye bekle, sonra başa sar (tekrar tıklanabilir)
      setYuruyor(false)
      if (basaSarTimeout.current) clearTimeout(basaSarTimeout.current)
      basaSarTimeout.current = setTimeout(() => {
        setHedefIndex(0)
        basaSarTimeout.current = null
      }, 2000)
    }
  }

  return (
    <div className="absolute inset-0">
      {/* ===== ÖN ÇİMEN (kütüğün ÖNÜNDE, Işıl'ın ARKASINDA) ===== */}
      <img
        src={cimen}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ zIndex: 7 }}
      />

      {/* ===== TAVŞAN + KÜTÜK (çimenin arkasında; tıklayınca zıplar) ===== */}
      <TiklamaliSprite
        frames={tavsanKareleri}
        olcek={tavsan.olcek}
        x={tavsan.x}
        y={tavsan.y}
        frameSuresiMs={90}
        tekrar={1}
        bekleKare={5}
        beklemeSuresiMs={600}
        hotspot={TAVSAN_HOTSPOT}
        etiket="Kütüğe dokun, tavşan çıksın"
        canli={canli}
        zIndex={5}
      />

      {/* ===== UĞURBÖCEĞİ (papatya üstünde; tıklayınca hoplar) ===== */}
      <TiklamaliSprite
        frames={ugurKareleri}
        olcek={ugur.olcek}
        x={ugur.x}
        y={ugur.y}
        frameSuresiMs={140}
        tekrar={4}
        hotspot={UGUR_HOTSPOT}
        etiket="Uğurböceğine dokun"
        canli={canli}
        zIndex={6}
      />

      {/* ===== IŞIL (z-10, çimenin önünde) — mevcut yürüyüş ===== */}
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
        className={`absolute bottom-[10%] right-[24%] z-30 flex flex-col items-center ${canli ? 'animate-sallan cursor-pointer' : 'cursor-default'
          }`}
        style={{ animationDelay: '1.2s' }}
      >
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
        <div className="absolute bottom-3 left-3 z-50 max-h-[88%] w-72 overflow-auto rounded-2xl bg-gece/90 p-4 font-metin text-sm text-white shadow-xl">
          <p className="mb-2 font-baslik font-bold">🔧 Sahne ayarları</p>

          {/* --- Işıl yürüyüş --- */}
          <p className="mt-1 font-baslik text-xs font-bold text-gunes">Işıl yürüyüş</p>
          <label className="block">
            Hız: <b>{hiz}</b>
            <input type="range" min="1" max="8" step="0.5" value={hiz}
              onChange={(e) => setHiz(Number(e.target.value))} className="w-full" />
          </label>
          <label className="mt-1 block">
            Adım süresi: <b>{frameSuresi}ms</b>
            <input type="range" min="60" max="300" step="10" value={frameSuresi}
              onChange={(e) => setFrameSuresi(Number(e.target.value))} className="w-full" />
          </label>
          <button onClick={basaSar} className="mt-2 w-full rounded-full bg-gunes py-1 font-baslik font-bold text-gece">
            ⏪ Başa sar
          </button>

          {/* --- Tavşan/kütük yerleşimi --- */}
          <p className="mt-3 font-baslik text-xs font-bold text-gunes">🐰 Tavşan / kütük</p>
          <KonumKaydirak etiket="Ölçek" deger={tavsan.olcek} min={0.15} max={0.9} step={0.005}
            ayarla={(v) => setTavsan((o) => ({ ...o, olcek: v }))} />
          <KonumKaydirak etiket="Sol (x)" deger={tavsan.x} min={-40} max={40} step={0.5}
            ayarla={(v) => setTavsan((o) => ({ ...o, x: v }))} />
          <KonumKaydirak etiket="Üst (y)" deger={tavsan.y} min={-10} max={80} step={0.5}
            ayarla={(v) => setTavsan((o) => ({ ...o, y: v }))} />

          {/* --- Uğurböceği yerleşimi --- */}
          <p className="mt-3 font-baslik text-xs font-bold text-gunes">🐞 Uğurböceği</p>
          <KonumKaydirak etiket="Ölçek" deger={ugur.olcek} min={0.05} max={0.5} step={0.005}
            ayarla={(v) => setUgur((o) => ({ ...o, olcek: v }))} />
          <KonumKaydirak etiket="Sol (x)" deger={ugur.x} min={40} max={100} step={0.5}
            ayarla={(v) => setUgur((o) => ({ ...o, x: v }))} />
          <KonumKaydirak etiket="Üst (y)" deger={ugur.y} min={20} max={90} step={0.5}
            ayarla={(v) => setUgur((o) => ({ ...o, y: v }))} />

          {/* --- İletilecek değerler --- */}
          <div className="mt-3 rounded-xl bg-black/30 px-3 py-2 text-xs">
            <p className="mb-0.5 opacity-70">📋 Bu değerleri iletin:</p>
            <p className="font-baslik font-bold text-gunes">Hız={hiz} · Adım={frameSuresi}ms</p>
            <p className="font-baslik font-bold text-gunes">
              Tavşan: ölçek={tavsan.olcek} x={tavsan.x} y={tavsan.y}
            </p>
            <p className="font-baslik font-bold text-gunes">
              Uğur: ölçek={ugur.olcek} x={ugur.x} y={ugur.y}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* Ayar panelindeki tek bir kaydırak satırı (kod tekrarını azaltır) */
function KonumKaydirak({ etiket, deger, min, max, step, ayarla }) {
  return (
    <label className="mt-1 block">
      {etiket}: <b>{deger}</b>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={deger}
        onChange={(e) => ayarla(Number(e.target.value))}
        className="w-full"
      />
    </label>
  )
}

export default SevgiSahne1
