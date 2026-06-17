import { useEffect, useRef, useState } from 'react'
import IsilYurume, { ISIL_KARE_SAYISI } from '../../characters/IsilYurume.jsx'
import TiklamaliSprite from '../TiklamaliSprite.jsx'
import { useHareketAzalt } from '../../../hooks/useHareketAzalt.js'

// Ön plan çimeni (tavşan/kütüğün ÖNÜNDE, Işıl'ın ARKASINDA kalır)
import cimen from '../../../assets/backgrounds/cimen.png'

/* ===============================================================
   SEVGİ — 1. SAHNE İÇERİĞİ (katmanlar + etkileşim)

   Katmanlar (alttan üste):
     arka_plan.jpg  (Sahne çiziyor)           — en altta
     tavşan+kütük   (TiklamaliSprite)         — çimenin ARKASINDA, dokununca zıplar
     cimen.png      (bu dosya)                — ön çimen, kütüğün ÖNÜ, IŞIL'IN ARKASI
     uğurböceği     (TiklamaliSprite)         — papatya üstünde, dokununca hoplar
     Işıl           (yürür)                   — çimenin önünde
     Canım (çiçek)  — dokununca Işıl yürür    — en üstte

   ETKİLEŞİM DAVRANIŞI:
   - Tavşan/uğurböceği: ilk dokunuşa kadar durur (üstünde "dokun" ipucu).
     Bir kez dokununca DÖNGÜYE girer: bir kez oynar → kısa dinlenir → tekrar
     (tekrar dokunmaya gerek yok). Tıklama yalnızca görünen piksellerde.
   - Işıl: Canım'a ilk dokunuşta soldan sağa yürür; sağ uca varınca BAŞA
     ışınlanır ve tekrar sağa yürür (sürekli; geriye doğru yürümez).

   PROP: canli  (true: tam etkileşim, false: donuk statik kopya)
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
   IŞIL YÜRÜYÜŞ ROTASI — soldan sağa düz çizgi (hep aynı yükseklik).
   Konum tek rAF döngüsünde translate3d ile sürülür (CSS transition YOK)
   → kare animasyonu ile her zaman senkron, asla "kayarak" gitmez.
---------------------------------------------------------------- */
const ISIL_BASLANGIC_LEFT = 27 // % (sol)
const ISIL_BITIS_LEFT = 49 // % (sağ)
const ISIL_MENZIL_FRAC = (ISIL_BITIS_LEFT - ISIL_BASLANGIC_LEFT) / 100 // sahne genişliğinin oranı
const ISIL_GENISLIK = '17.5%'
const ISIL_BOTTOM = '1%'
const HIZ = 2.5 // % / s (mesafe / süre)
const FRAME_SURESI = 150 // adım (kare) süresi (ms)

// Tam yürüyüş süresi (ms): toplam mesafe(%) / hız → saniye
function yuruSuresiMs(hiz) {
  return ((ISIL_BITIS_LEFT - ISIL_BASLANGIC_LEFT) / hiz) * 1000
}

/* ---------------------------------------------------------------
   SPRITE YERLEŞTİRME — ?ayar panelinden ince ayar yapılabilir.
---------------------------------------------------------------- */
const TAVSAN_VARSAYILAN = { olcek: 0.39, x: -8, y: 41.5 }
const UGUR_VARSAYILAN = { olcek: 0.18, x: 76.1, y: 51.3 }

// Ayar paneli yalnızca URL'de ?ayar varsa görünür (tasarımcılar için)
const AYAR_MODU =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('ayar')

function SevgiSahne1({ canli = true }) {
  // --- IŞIL YÜRÜYÜŞÜ ---
  // Sadece TETİK durumu React'te tutulur (kare/konum rAF'ta imperatif).
  const [yuruyusAktif, setYuruyusAktif] = useState(false)
  const [hiz, setHiz] = useState(HIZ)
  const [frameSuresi, setFrameSuresi] = useState(FRAME_SURESI)

  // --- SPRITE YERLEŞTİRME (ayar panelinden canlı değiştirilebilir) ---
  const [tavsan, setTavsan] = useState(TAVSAN_VARSAYILAN)
  const [ugur, setUgur] = useState(UGUR_VARSAYILAN)

  const canimaTiklandi = () => {
    if (!canli || yuruyusAktif) return
    setYuruyusAktif(true)
  }

  const basaSar = () => setYuruyusAktif(false)

  // Statik kopyada (canli false) yürüyüşü durdur
  useEffect(() => {
    if (!canli) setYuruyusAktif(false)
  }, [canli])

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

      {/* ===== TAVŞAN + KÜTÜK (çimenin arkasında; dokununca döngüde zıplar) ===== */}
      <TiklamaliSprite
        frames={tavsanKareleri}
        olcek={tavsan.olcek}
        x={tavsan.x}
        y={tavsan.y}
        frameSuresiMs={90}
        bekleKare={5}
        beklemeSuresiMs={600}
        donguArasiMs={900}
        canli={canli}
        zIndex={5}
      />

      {/* ===== UĞURBÖCEĞİ (papatya üstünde; dokununca tek hop + bekleme döngüsü) ===== */}
      <TiklamaliSprite
        frames={ugurKareleri}
        olcek={ugur.olcek}
        x={ugur.x}
        y={ugur.y}
        frameSuresiMs={170}
        donguArasiMs={750}
        canli={canli}
        zIndex={6}
      />

      {/* ===== IŞIL (z-10, çimenin önünde) — soldan sağa sürekli yürüyüş.
          Konum + kare TEK rAF döngüsünde (IsilGezinti) → asla kaymaz. ===== */}
      <IsilGezinti
        canli={canli}
        yuruyor={yuruyusAktif}
        frameSuresiMs={frameSuresi}
        yuruSureMs={yuruSuresiMs(hiz)}
      />

      {/* ===== CANIM (z-30) — dokununca Işıl'ı yürütür (responsive: cqw) ===== */}
      <button
        onClick={canimaTiklandi}
        aria-label="Canım'a dokun"
        disabled={!canli}
        className={`absolute bottom-[10%] right-[24%] z-30 flex flex-col items-center ${
          canli ? 'animate-sallan cursor-pointer' : 'cursor-default'
        }`}
        style={{ animationDelay: '1.2s' }}
      >
        {canli && !yuruyusAktif && (
          <span
            className="animate-kalp rounded-full bg-white/90 font-baslik font-bold text-seker shadow-md"
            style={{ marginBottom: '0.6cqw', fontSize: '2.1cqw', padding: '0.3cqw 1.2cqw' }}
          >
            Bana dokun! 👆
          </span>
        )}
        <div
          className="flex items-center justify-center rounded-[45%] border-dashed border-cimen bg-white/70 backdrop-blur-sm"
          style={{ width: '8cqw', height: '10cqw', borderWidth: '0.45cqw' }}
        >
          <span style={{ fontSize: '4.5cqw', lineHeight: 1 }}>🌸</span>
        </div>
        <span
          className="rounded-full bg-cimen font-baslik font-bold text-white shadow-md"
          style={{ marginTop: '0.7cqw', fontSize: '2.4cqw', padding: '0.35cqw 1.5cqw' }}
        >
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

/* ---------------------------------------------------------------
   IŞIL GEZİNTİ — konum + kare aynı rAF döngüsünde (senkron, kaymaz)

   - Konum: translate3d(px) ile (GPU; left/top değil) → will-change:transform.
     Menzil sahne genişliğinin oranı; px değeri ResizeObserver ile önbelleğe
     alınır (rAF içinde layout okuması yapılmaz → thrashing yok).
   - Kare: IsilYurume'ye ref ile kareGoster(i) (src değişmez, opacity).
   - İlerleme süreyle MODULO alınır → sağ uca varınca otomatik BAŞA ışınlanır
     ve tekrar sağa yürür; kare sayacı sürekli akar (bacaklar hep oynar).
   - Ana iş parçacığı takılırsa konum DA kare DE bir sonraki tick'te gerçek
     süreye göre birlikte ilerler → "bacak durur, gövde kayar" olmaz.
   - prefers-reduced-motion: yürüme yok, Işıl başlangıçta duruş karesinde durur.
---------------------------------------------------------------- */
function IsilGezinti({ canli, yuruyor, frameSuresiMs, yuruSureMs }) {
  const sarmaRef = useRef(null) // konumlanan dış sarmalayıcı (transform)
  const isilRef = useRef(null) // IsilYurume kontrollü handle
  const genislikRef = useRef(0) // sahne genişliği (px) — önbellek
  const sureRef = useRef(frameSuresiMs)
  const yuruSureRef = useRef(yuruSureMs)
  sureRef.current = frameSuresiMs
  yuruSureRef.current = yuruSureMs

  const azalt = useHareketAzalt()
  const yurumeli = canli && yuruyor && !azalt
  const yurumeliRef = useRef(yurumeli)
  yurumeliRef.current = yurumeli

  // Sahne genişliğini ölç (mount + resize) → translate3d px değeri için
  useEffect(() => {
    const sarma = sarmaRef.current
    const ebeveyn = sarma?.parentElement
    if (!ebeveyn) return
    const olc = () => {
      genislikRef.current = ebeveyn.clientWidth
    }
    olc()
    const ro = new ResizeObserver(olc)
    ro.observe(ebeveyn)
    return () => ro.disconnect()
  }, [])

  // TEK rAF döngüsü: konum (translate3d) + kare birlikte
  useEffect(() => {
    if (ISIL_KARE_SAYISI === 0) return
    let rafId
    let baslangic

    const tik = (now) => {
      rafId = requestAnimationFrame(tik)
      const sarma = sarmaRef.current
      if (!yurumeliRef.current) {
        baslangic = undefined
        if (sarma) sarma.style.transform = 'translate3d(0,0,0)'
        isilRef.current?.kareGoster(0)
        return
      }
      if (baslangic === undefined) baslangic = now
      const gecen = now - baslangic
      // Kare (sürekli akar)
      const idx = Math.floor(gecen / sureRef.current) % ISIL_KARE_SAYISI
      isilRef.current?.kareGoster(idx)
      // Konum (süreyle modulo → uçta başa ışınlanır)
      const ilerleme = (gecen % yuruSureRef.current) / yuruSureRef.current
      const x = ilerleme * genislikRef.current * ISIL_MENZIL_FRAC
      if (sarma) sarma.style.transform = `translate3d(${x}px,0,0)`
    }
    rafId = requestAnimationFrame(tik)

    // Sekmeye dönünce zamanı sıfırla (arka planda uzun kaldıysa sıçramasın)
    const gorunur = () => {
      if (document.visibilityState === 'visible') baslangic = undefined
    }
    document.addEventListener('visibilitychange', gorunur)
    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('visibilitychange', gorunur)
    }
  }, [])

  return (
    <div
      ref={sarmaRef}
      className="absolute z-10"
      style={{
        width: ISIL_GENISLIK,
        left: `${ISIL_BASLANGIC_LEFT}%`,
        bottom: ISIL_BOTTOM,
        transform: 'translate3d(0,0,0)',
        willChange: 'transform',
      }}
    >
      <IsilYurume ref={isilRef} kontrollu width="100%" />
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
