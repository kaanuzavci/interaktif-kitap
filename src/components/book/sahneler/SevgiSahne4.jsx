import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from '../tiklamaKayit.js'
import { opakMerkez, noktaDolu } from '../alfaHarita.js'
import TiklamaliSprite from '../TiklamaliSprite.jsx'
import KonumluSprite from '../KonumluSprite.jsx'
import SurukleIpucu from '../SurukleIpucu.jsx'

// Sayfa-4 görselleri
import pencereGorsel from '../../../assets/backgrounds/sayfa4/pencere.png'
import ucurtmaGorsel from '../../../assets/backgrounds/sayfa4/ucurtma.png'

/* ===============================================================
   SEVGİ — 4. SAHNE İÇERİĞİ (kır evi: pencerede Işıl + üzgün çiçek + uçurtma)

   Arka plan (arka_plan4.jpg) Sahne tarafından çizilir (ağaç, gökyüzü,
   tepeler, ev duvarı + pencere boşluğu, çiçekler). Bu dosya üzerine binen
   ÖĞELERİ ekler:

   Katmanlar (alttan üste):
     arka_plan4.jpg  (Sahne çiziyor)          — kır + ev + pencere boşluğu
     Işıl (isil_ucurtma)  (KonumluSprite)     — pencerenin İÇİNDE; dokununca konuşur/güler (döngü)
     pencere.png     (statik <img>)           — pencere kasası + saksı; Işıl'ın ÖNÜNDE (saksı belini örter)
     çiçek (cicek_uzgun)  (TiklamaliSprite)   — sol alt; dokununca üzgün göz kırpar (döngü)
     uçurtma (ucurtma.png) (SurukleUcurtma)   — gökyüzü sol; tam-kaplama, SÜRÜKLENEBİLİR (sayfa3 mantığı)

   ETKİLEŞİM (diğer sayfalarla aynı):
   - IŞIL: pencerede durur, üstünde "dokun" ipucu; dokununca 2 kareli
     (ağız kapalı ↔ açık) gülümseme/konuşma döngüsüne girer, tekrar tekrar oynar.
   - ÇİÇEK: sol altta üzgün; dokununca 2 kareli (gözler açık ↔ kapalı) yavaş
     üzgün göz kırpma döngüsüne girer.
   - UÇURTMA: ipucu YOK; tutulup serbestçe SÜRÜKLENİR, bırakılınca yumuşakça
     gökyüzündeki yerine döner (sayfa-3 Işıl sürükleme mantığının aynısı).

   ───────────────────────────────────────────────────────────────
   👉 KONUMLAR sahne %'sidir. Aşağıdaki sabitlerden ayarla.
   ─────────────────────────────────────────────────────────────── */

/* Kare dizilerini otomatik topla (sıralı) — diğer sahnelerle aynı desen */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const cicekKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/cicek_uzgun/*.png', {
    eager: true,
    import: 'default',
  }),
)
const isilKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/isil_ucurtma/*.png', {
    eager: true,
    import: 'default',
  }),
)

// 🧒 IŞIL (pencerede) — dikey portre; pencere boşluğuna oturur. left/top:
// sol-üst köşe (sahne %), width: görsel genişliği (sahne %). En-boy korunur.
const ISIL = { left: '81%', top: '40.5%', width: '17%' }
// Tempo: ağız kapalı (poz1) uzun, açık (poz2) kısa → sakin gülümseme/konuşma.
const ISIL_TEMPO = { frameSuresiMs: 720, bekleKare: 0, beklemeSuresiMs: 900 }

// 🪟 PENCERE (sağ) — tam 16:9 tuvale gömülü; tam-kaplama. Işıl'ın ÖNÜNDE
// çizilir (saksı Işıl'ın belini doğal örter).
const PENCERE_Z = 14

// 🌻 ÜZGÜN ÇİÇEK (sol alt) — tam 16:9 kare; TiklamaliSprite ile küçültülüp
// sola-aşağı taşınır. olcek=büyüklük, x=sağ/sol (%), y=aşağı/yukarı (%).
const CICEK = { olcek: 0.82, x: -28.5, y: 47.2 }
// Dokun ipucu çiçeğin YÜZÜNE otursun (saksı kadraj dışında kaldığından opak
// merkez sapa düşüyor; bunu elle yüzün üstüne sabitliyoruz). Sahne %'si.
const CICEK_IPUCU = { x: 12, y: 69 }
// Tempo: gözler açık (poz1) uzun, kapalı (poz2) kısa → yavaş, üzgün göz kırpma.
const CICEK_TEMPO = { frameSuresiMs: 520, bekleKare: 0, beklemeSuresiMs: 1900 }

// 🪁 UÇURTMA — tam 16:9 tuvale gömülü; doğal yeri gökyüzü sol-orta. Serbestçe
// sürüklenir, bırakılınca doğal yerine döner. HOME = uçurtmanın doğal opak
// merkezi (≈ %36, %31) → açılışta translate(0,0) (tam tasarlandığı yer).
const UCURTMA_HOME = { x: 36, y: 31 }
// Sürükleme sınırları (uçurtma MERKEZİ bu kutudan çıkamaz → ekranda kalır)
const UCURTMA_SINIR = { xMin: 8, xMax: 72, yMin: 10, yMax: 60 }
// 🤚 "Tutup sürükle" el ipucu — uçurtmanın üstünde (doğal merkezinde) durur.
const UCURTMA_EL = { x: UCURTMA_HOME.x, y: UCURTMA_HOME.y }

function SevgiSahne4({ canli = true }) {
  // Uçurtma bu sayfada hiç tutuldu mu? — tutulunca "tutup sürükle" el ipucu
  // kaybolur (sayfaya tekrar gelince sahne sıfırlandığı için yeniden belirir).
  const [ucurtmaTutuldu, setUcurtmaTutuldu] = useState(false)

  return (
    <div className="absolute inset-0">
      {/* ===== IŞIL (pencerede) — dokununca gülümseme/konuşma döngüsü =====
          İlk dokunuşta pose 02 (kare 1) ile başlar; sonraki turlar 01→02. */}
      <KonumluSprite
        frames={isilKareleri}
        left={ISIL.left}
        top={ISIL.top}
        width={ISIL.width}
        frameSuresiMs={ISIL_TEMPO.frameSuresiMs}
        bekleKare={ISIL_TEMPO.bekleKare}
        beklemeSuresiMs={ISIL_TEMPO.beklemeSuresiMs}
        donguArasiMs={0}
        canli={canli}
        zIndex={10}
        ilkDokunusKaresi={1}
      />

      {/* ===== PENCERE KASASI (statik) — Işıl'ın ÖNÜNDE; saksı beli örter ===== */}
      <img
        src={pencereGorsel}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ zIndex: PENCERE_Z, objectFit: 'fill' }}
      />

      {/* ===== ÜZGÜN ÇİÇEK (sol alt) — dokununca üzgün göz kırpma döngüsü ===== */}
      <TiklamaliSprite
        frames={cicekKareleri}
        olcek={CICEK.olcek}
        x={CICEK.x}
        y={CICEK.y}
        frameSuresiMs={CICEK_TEMPO.frameSuresiMs}
        bekleKare={CICEK_TEMPO.bekleKare}
        beklemeSuresiMs={CICEK_TEMPO.beklemeSuresiMs}
        donguArasiMs={0}
        canli={canli}
        zIndex={20}
        ipucuYuzde={CICEK_IPUCU}
      />

      {/* ===== UÇURTMA (gökyüzü) — serbestçe sürüklenir, bırakınca döner ===== */}
      <SurukleUcurtma
        src={ucurtmaGorsel}
        canli={canli}
        zIndex={30}
        onTutmaBasla={() => setUcurtmaTutuldu(true)} // ilk tutuşta el ipucu kalkar
      />

      {/* ===== "TUTUP SÜRÜKLE" EL İPUCU — uçurtma ilk kez tutulana dek üstünde durur ===== */}
      {canli && !ucurtmaTutuldu && (
        <SurukleIpucu style={{ left: `${UCURTMA_EL.x}%`, top: `${UCURTMA_EL.y}%`, zIndex: 40 }} />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------
   SÜRÜKLE-UÇURTMA — tutulup serbestçe sürüklenen tam-kare uçurtma

   Sayfa-3'teki SurukleIsil'in birebir aynısı (tam 16:9 şeffaf tuvale gömülü
   öğe; konum bir SARMALAYICI'ya translate3d ile imperatif yazılır → GPU,
   akıcı; piksel-hassas tutma alfaHarita + TiklamaKayit ile). FARKLAR:
   - Koku/duraklat geri çağrıları YOK (bu sahnede duman yok).
   - HOME = uçurtmanın doğal opak merkezi → açılışta tasarlandığı yerde durur.
   - Ölçek 1 (doğal boyut). Bırakılınca yumuşakça doğal yerine döner.
---------------------------------------------------------------- */
function SurukleUcurtma({ src, canli = true, zIndex = 30, onTutmaBasla }) {
  const sarmaRef = useRef(null) // konumlanan dış sarmalayıcı (transform)
  const imgRef = useRef(null) // tam-kaplama uçurtma <img> (isabet kutusu)
  const imgObjRef = useRef(null) // alfa testi için Image nesnesi
  const ofsetRef = useRef({ x: 0, y: 0 }) // o anki translate (px) — EV'e göre
  const surukRef = useRef(null) // aktif sürükleme bilgisi

  const canliRef = useRef(canli)
  canliRef.current = canli

  // Tutma geri çağrısı — pencere listener'ı stale closure yakalamasın diye ref'te.
  const onTutmaBaslaRef = useRef(onTutmaBasla)
  onTutmaBaslaRef.current = onTutmaBasla

  const [merkez, setMerkez] = useState(null) // {cx,cy} opak merkez (0..1)
  const [hazir, setHazir] = useState(false) // ev konumuna oturdu mu (görünürlük)

  const merkezRef = useRef(null)
  merkezRef.current = merkez

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('ucurtma-suruk'))

  // Alfa testi için Image + opak merkez (tutma + ev hesabı)
  useEffect(() => {
    const im = new Image()
    imgObjRef.current = im
    const hesapla = () => {
      const m = opakMerkez(im)
      if (m) setMerkez(m)
    }
    im.src = src
    if (im.complete && im.naturalWidth) hesapla()
    else im.onload = hesapla
  }, [src])

  // translate'i imperatif yaz (gecisli=true → yumuşak yaylanma)
  const transformYaz = (x, y, gecisli = false) => {
    const el = sarmaRef.current
    if (!el) return
    el.style.transition = gecisli
      ? 'transform 420ms cubic-bezier(0.22,1,0.36,1)'
      : 'none'
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  // Sahne (kapsayıcı) ölçüsü — % ↔ px dönüşümü için
  const sahneRect = () => sarmaRef.current?.parentElement?.getBoundingClientRect()

  // Belirli bir merkez-%'yi sağlayan ofseti (px) hesapla
  const yuzdedenOfset = (hedefX, hedefY) => {
    const r = sahneRect()
    const m = merkezRef.current
    if (!r || !m) return { x: 0, y: 0 }
    return {
      x: ((hedefX - m.cx * 100) / 100) * r.width,
      y: ((hedefY - m.cy * 100) / 100) * r.height,
    }
  }

  // EV (doğal) konumuna yerleştir
  const eveYerlestir = (gecisli) => {
    const o = yuzdedenOfset(UCURTMA_HOME.x, UCURTMA_HOME.y)
    ofsetRef.current = o
    transformYaz(o.x, o.y, gecisli)
  }

  const hareket = (e) => {
    const d = surukRef.current
    if (!d) return
    const r = sahneRect()
    const m = merkezRef.current
    if (!r || !m) return
    let nx = d.baseX + (e.clientX - d.startX)
    let ny = d.baseY + (e.clientY - d.startY)
    // Merkezi SINIR kutusunda tut (ekrandan çıkmasın)
    const cxMin = ((UCURTMA_SINIR.xMin - m.cx * 100) / 100) * r.width
    const cxMax = ((UCURTMA_SINIR.xMax - m.cx * 100) / 100) * r.width
    const cyMin = ((UCURTMA_SINIR.yMin - m.cy * 100) / 100) * r.height
    const cyMax = ((UCURTMA_SINIR.yMax - m.cy * 100) / 100) * r.height
    nx = Math.max(cxMin, Math.min(cxMax, nx))
    ny = Math.max(cyMin, Math.min(cyMax, ny))
    ofsetRef.current = { x: nx, y: ny }
    transformYaz(nx, ny, false)
  }

  const birak = () => {
    window.removeEventListener('pointermove', hareket)
    window.removeEventListener('pointerup', birak)
    const d = surukRef.current
    surukRef.current = null
    if (!d) return
    // Bırakıldı → uçurtma yumuşakça doğal yerine döner.
    eveYerlestir(true)
  }

  // Tutma (BookReader capture'ından oynat(e) gelir) → sürüklemeyi başlat
  const basla = (e) => {
    if (!canliRef.current) return
    const o = ofsetRef.current
    surukRef.current = { startX: e.clientX, startY: e.clientY, baseX: o.x, baseY: o.y }
    onTutmaBaslaRef.current?.() // ilk tutuşta sahne el ipucunu kaldırır
    window.addEventListener('pointermove', hareket)
    window.addEventListener('pointerup', birak)
  }

  // En güncel fonksiyonları ref'te tut (kayıt defteri stale closure yakalamasın)
  const fnRef = useRef({})
  fnRef.current.hitTest = (cx, cy) => noktaDolu(imgRef.current, imgObjRef.current, cx, cy)
  fnRef.current.basla = basla

  // Kayıt defterine yaz / sil (sürüklemeyi oynat(e) olarak veriyoruz)
  useEffect(() => {
    if (!kayit) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex,
      hitTest: (x, y) => fnRef.current.hitTest(x, y),
      oynat: (e) => fnRef.current.basla(e),
    })
    return () => kayit.cikar(id)
  }, [kayit, zIndex])

  // Merkez hazır olunca EV konumuna otur + görünür yap; ekran boyutu değişince
  // (sürüklenmiyorsa) EV ofsetini güncelle. useLayoutEffect → ilk düştüğü
  // karede zaten doğru yerde (sıçrama olmaz).
  useLayoutEffect(() => {
    if (!merkez) return
    eveYerlestir(false)
    setHazir(true)
    const ebeveyn = sarmaRef.current?.parentElement
    let ro
    if (ebeveyn) {
      ro = new ResizeObserver(() => {
        if (!surukRef.current) eveYerlestir(false)
      })
      ro.observe(ebeveyn)
    }
    return () => ro?.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merkez])

  // Sürükleme listener'ları kalmasın diye temizlik (güvenlik)
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', hareket)
      window.removeEventListener('pointerup', birak)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // Konumlanan sarmalayıcı (transform imperatif yazılır → JSX'te transform
    // VERİLMEZ). <img> YALNIZCA merkez hesaplandıktan sonra render edilir (sıçrama fix).
    <div
      ref={sarmaRef}
      className="absolute inset-0"
      style={{ zIndex, willChange: 'transform' }}
    >
      {merkez && (
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          style={{
            opacity: hazir ? 1 : 0,
            transition: 'opacity 280ms ease',
            objectFit: 'fill',
          }}
        />
      )}
    </div>
  )
}

export default SevgiSahne4
