import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from '../tiklamaKayit.js'
import { opakMerkez, noktaDolu } from '../alfaHarita.js'
import { useHareketAzalt } from '../../../hooks/useHareketAzalt.js'
import TiklanirGorsel from '../TiklanirGorsel.jsx'
import DokunNoktasi from '../DokunNoktasi.jsx'

// Sayfa-3 görselleri (hepsi tam 16:9 tuvale gömülü)
import isilGorsel from '../../../assets/backgrounds/sayfa3/isil.png'
import kekRafi from '../../../assets/backgrounds/sayfa3/kek_rafi.png'

/* ===============================================================
   SEVGİ — 3. SAHNE İÇERİĞİ (mutfak: Işıl'ı keke götür)

   Arka plan (arka_plan3.jpg) Sahne tarafından çizilir; bu dosya
   üzerine binen ÖĞELERİ ekler:

   Katmanlar (alttan üste):
     arka_plan3.jpg  (Sahne çiziyor)          — mutfak + masa + kek
     kek_rafi.png    (TiklanirGorsel)         — duvarda; GİZLİ, dokununca belirir
     Işıl (isil.png) (SurukleIsil)            — TUTULUP keke SÜRÜKLENİR
     duman           (KareAnimasyon)          — Işıl keke varınca pastadan tüter

   ETKİLEŞİM:
   - KEK RAFI açılışta GÖRÜNMEZ; yerinde nabız atan "dokun" halkası durur.
     Dokununca belirir ve kalır (sayfa-2'deki kalemlerle birebir aynı mantık).
     Sahne her açılışta sıfırdan kurulduğu için (BookReader key) her gelişte
     yeniden gizli başlar.
   - KEK: üstündeki dokun işaretine dokununca pastadan KOKU (duman) tüter.
     Duman'ı başlatan TEK şey budur (Işıl'ı sürüklemek başlatmaz).
   - IŞIL tutulup serbestçe SÜRÜKLENİR (bırakılınca yumuşakça EV'e döner).
     Işıl TUTULURKEN koku animasyonu DURAKLAR (o anki karede donar); Işıl
     BIRAKILINCA koku kaldığı yerden oynamaya devam eder.

   ───────────────────────────────────────────────────────────────
   👉 KONUMLAR sahne %'sidir (x soldan, y yukarıdan). Aşağıdan ayarla.
   ─────────────────────────────────────────────────────────────── */

/* Duman karelerini otomatik topla (sıralı) — diğer sahnelerle aynı desen */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const dumanKareleri = kareleriTopla(
  import.meta.glob('../../../assets/animations/duman_animasyon/*.png', {
    eager: true,
    import: 'default',
  }),
)

// 🗄️ KEK RAFI (duvarda, sağ üst) — tam 16:9 tuval; left/top/width=tam kaplama.
// kutuTiklama: raf silüetini çevreleyen kutuya dokunmak yeter (raflar arası
// boşluğa/işarete dokununca da gelir; tam piksele denk getirmek gerekmez).
const RAF = { left: '0%', top: '0%', width: '100%' }

// 🍰 KEK (masada, sağ alt) — arka plana gömülü; üstünde dokun işareti durur,
// dokununca pastadan KOKU/duman tüter. (x,y) sahne %'si, yaricap = dokunma
// dairesinin yarıçapı (sahne genişliği %'si).
const KEK = { x: '82%', y: '71%', yaricap: 9 }

// 🧒 IŞIL — yan profilde, doğal merkezi ~(47%, 51.5%). Sahne-3'te EV konumu
// SOL kenarda ve AŞAĞIDA durur → ayakları kadraja girmez (kırpılır), tıpkı
// hedef görseldeki gibi. Serbestçe sürüklenir; BIRAKILINCA yumuşakça EV
// konumuna geri döner. (Duman'ı Işıl değil, KEK tıklaması başlatır.)
const ISIL_OLCEK = 1.15            // referans görselle aynı boyut (biraz büyük)
const ISIL_HOME = { x: 9, y: 85 }  // ev merkezi (% sahne) — sol kenar, ayaklar kırpık
// Sürükleme sınırları (Işıl merkezi bu kutudan çıkamaz → ekranda kalır)
const SINIR = { xMin: 6, xMax: 78, yMin: 46, yMax: 88 }

// Geliştirici/önizleme: ?kek varsa raf açık + duman oynar başlar (screenshot)
const KEK_DEBUG =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('kek')

function SevgiSahne3({ canli = true }) {
  // Koku (duman) tetiklendi mi? — yalnızca KEK tıklamasıyla açılır.
  const [dumanAktif, setDumanAktif] = useState(KEK_DEBUG)
  // Işıl şu an tutulup sürükleniyor mu? — tutulurken koku DURAKLAR.
  const [isilTutuluyor, setIsilTutuluyor] = useState(false)

  return (
    <div className="absolute inset-0">
      {/* ===== KEK RAFI (duvarda) — açılışta GİZLİ; dokununca belirir =====
          Tam 16:9 tuval; kutuTiklama: raf silüetini çevreleyen kutuya
          dokunmak yeter (iki raf arasındaki boşluğa/işarete dokununca da gelir). */}
      <TiklanirGorsel
        src={kekRafi}
        left={RAF.left}
        top={RAF.top}
        width={RAF.width}
        canli={canli}
        zIndex={12}
        baslangicGorunur={KEK_DEBUG}
        kutuTiklama
      />

      {/* ===== KEK (masada) — üstünde dokun işareti; dokununca KOKU tüter =====
          Kendi görseli yok (kek arka plana gömülü); yalnızca dokunma noktası.
          ?kek önizlemesinde duman zaten açık olduğundan işaret göstermez. */}
      <DokunNoktasi
        x={KEK.x}
        y={KEK.y}
        yaricap={KEK.yaricap}
        canli={canli && !KEK_DEBUG}
        zIndex={16}
        onTetik={() => setDumanAktif(true)}
      />

      {/* ===== IŞIL (sürüklenebilir) — tutulurken koku DURAKLAR, bırakınca devam ===== */}
      <SurukleIsil
        src={isilGorsel}
        canli={canli}
        zIndex={20}
        onTutmaBasla={() => setIsilTutuluyor(true)}
        onBirak={() => setIsilTutuluyor(false)}
      />

      {/* ===== DUMAN/KOKU (pastadan tüter) — tam-kaplama; KEK tıklayınca döngüde =====
          duman_animasyon tuvali 16:9 ve duman tam kek konumundan yükselir,
          bu yüzden tam-kaplama yeterli (ayrı konumlama gerekmez). frame_01
          boş olduğundan tetiklenene kadar görünmez. gizle: Işıl tutulurken
          duman tamamen gizlenir, bırakılınca yeniden belirir ve kaldığı
          yerden devam eder. */}
      <DumanEfekti
        frames={dumanKareleri}
        oynat={dumanAktif && canli}
        duraklat={isilTutuluyor}
        gizle={isilTutuluyor}
        frameSuresiMs={80}
        style={{ zIndex: 30 }}
      />
    </div>
  )
}

/* ---------------------------------------------------------------
   DUMAN EFEKTİ — FLICKER'SIZ kare oynatıcı (IsilYurume tekniği)

   SORUN: tek <img>'in src'sini her karede değiştiren oynatıcı, İLK turda
   her kareyi ilk gösterimde (ekran boyutunda) decode ettiğinden "bozuk
   ampul" gibi yanıp söner; sonraki turlar (kareler önbellekte) akıcıdır.

   ÇÖZÜM: TÜM kareler üst üste <img> olarak basılır ve animasyon yalnızca
   OPACITY ile sürülür (src DEĞİŞMEZ → decode YOK → compositor işi). Kareler
   sahne açılır açılmaz ekran boyutunda decode edilir; tetiklenince ilk tur
   da kusursuz akar. frame_01 boş olduğundan oynat=false iken görünmez.
---------------------------------------------------------------- */
function DumanEfekti({ frames, oynat, duraklat = false, gizle = false, frameSuresiMs = 80, style }) {
  const imgRefleri = useRef([])
  const aktifRef = useRef(0)
  const oynatRef = useRef(oynat)
  oynatRef.current = oynat
  const duraklatRef = useRef(duraklat)
  duraklatRef.current = duraklat
  const gecenRef = useRef(0) // oynatılan birikmiş süre (ms) — duraklatınca korunur
  const azalt = useHareketAzalt()
  const azaltRef = useRef(azalt)
  azaltRef.current = azalt

  // Yalnızca iki <img>'in opacity'sini değiştir (decode yok → GPU/compositor)
  const goster = (i) => {
    const n = frames.length
    if (!n) return
    const yeni = ((i % n) + n) % n
    const eski = aktifRef.current
    if (yeni === eski) return
    const a = imgRefleri.current[eski]
    const b = imgRefleri.current[yeni]
    if (a) a.style.opacity = '0'
    if (b) b.style.opacity = '1'
    aktifRef.current = yeni
  }

  // Tek rAF döngüsü (delta birikimli) — duraklat'ta kare donar, sürede de durur.
  useEffect(() => {
    if (!frames.length) return
    let raf = 0
    let sonZaman // önceki tik zamanı (delta için)
    const tik = (now) => {
      raf = requestAnimationFrame(tik)
      if (!oynatRef.current || azaltRef.current) {
        gecenRef.current = 0
        sonZaman = undefined
        goster(0) // tetiklenmedi: boş kare (görünmez)
        return
      }
      if (duraklatRef.current) {
        // DURAKLAT: kareyi dondur — süreyi biriktirme, karesini değiştirme
        sonZaman = undefined
        return
      }
      if (sonZaman === undefined) sonZaman = now
      gecenRef.current += now - sonZaman
      sonZaman = now
      const idx = Math.floor(gecenRef.current / frameSuresiMs) % frames.length
      goster(idx)
    }
    raf = requestAnimationFrame(tik)
    const gorunur = () => {
      // Sekmeye dönünce delta'yı sıfırla (arka planda geçen süre sayılmasın)
      if (document.visibilityState === 'visible') sonZaman = undefined
    }
    document.addEventListener('visibilitychange', gorunur)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', gorunur)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, frameSuresiMs])

  if (!frames.length) return null

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        ...style,
        opacity: gizle ? 0 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      {frames.map((src, i) => (
        <img
          key={i}
          ref={(el) => (imgRefleri.current[i] = el)}
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          className="absolute inset-0 h-full w-full select-none"
          style={{ objectFit: 'fill', opacity: i === 0 ? 1 : 0, willChange: 'opacity' }}
        />
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------
   SURUKLE-IŞIL — tutulup keke sürüklenen tam-kare karakter

   - Işıl tam 16:9 şeffaf tuvale gömülüdür; tam-kaplama <img> olarak çizilir,
     konumu bir SARMALAYICI'ya verilen translate3d ile sürülür (GPU; left/top
     değil → akıcı).
   - PİKSEL-HASSAS TUTMA: dikdörtgen yok. Tıklama kaydı (TiklamaKayit) +
     alfa testi (alfaHarita) ile yalnızca Işıl'ın görünen silüeti tutulur;
     etrafındaki şeffaf tuval sayfa-çevirmeyi/diğer tıklamaları engellemez.
   - EV KONUMU: Işıl açılışta SOL kenarda, aşağıda (ayakları kırpık) durur.
   - SÜRÜKLEME: BookReader yüzey-capture'ı silüete isabet edince oynat(e)
     çağırır → burada sürükleme başlar (window pointermove/up). Konum imperatif
     yazılır (React render yok → akıcı). TUTMA başlayınca onTutmaBasla(), BIRAKINCA
     onBirak() çağrılır (sahne bunlarla koku animasyonunu duraklatır/sürdürür) ve
     Işıl yumuşakça EV konumuna geri döner.
---------------------------------------------------------------- */
function SurukleIsil({ src, canli = true, zIndex = 20, onTutmaBasla, onBirak }) {
  const sarmaRef = useRef(null) // konumlanan dış sarmalayıcı (transform)
  const imgRef = useRef(null) // tam-kaplama Işıl <img> (isabet kutusu)
  const imgObjRef = useRef(null) // alfa testi için Image nesnesi
  const ofsetRef = useRef({ x: 0, y: 0 }) // o anki translate (px) — EV'e göre
  const surukRef = useRef(null) // aktif sürükleme bilgisi

  const canliRef = useRef(canli)
  canliRef.current = canli

  // Tutma/bırakma geri çağrıları — pencere listener'ları stale closure
  // yakalamasın diye en güncelini ref'te tut.
  const onTutmaBaslaRef = useRef(onTutmaBasla)
  onTutmaBaslaRef.current = onTutmaBasla
  const onBirakRef = useRef(onBirak)
  onBirakRef.current = onBirak

  const [merkez, setMerkez] = useState(null) // {cx,cy} opak merkez (0..1)
  const [hazir, setHazir] = useState(false) // ev konumuna oturdu mu (görünürlük)

  const merkezRef = useRef(null)
  merkezRef.current = merkez

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('isil-suruk'))

  // Alfa testi için Image + opak merkez (tutma + hedef hesabı)
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

  // EV konumuna yerleştir (ölçek merkez etrafında olduğundan merkez-% sabit kalır)
  const eveYerlestir = (gecisli) => {
    const o = yuzdedenOfset(ISIL_HOME.x, ISIL_HOME.y)
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
    const cxMin = ((SINIR.xMin - m.cx * 100) / 100) * r.width
    const cxMax = ((SINIR.xMax - m.cx * 100) / 100) * r.width
    const cyMin = ((SINIR.yMin - m.cy * 100) / 100) * r.height
    const cyMax = ((SINIR.yMax - m.cy * 100) / 100) * r.height
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

    // Tutma bitti → koku animasyonu devam etsin; Işıl yumuşakça EV'e döner.
    onBirakRef.current?.()
    eveYerlestir(true)
  }

  // Tutma (BookReader capture'ından oynat(e) gelir) → sürüklemeyi başlat
  const basla = (e) => {
    if (!canliRef.current) return
    const o = ofsetRef.current
    surukRef.current = { startX: e.clientX, startY: e.clientY, baseX: o.x, baseY: o.y }
    // Tutma başladı → koku animasyonu duraklasın
    onTutmaBaslaRef.current?.()
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

  // Merkez hazır olunca EV konumuna otur + görünür yap; ekran ölçüsü değişince
  // (yeniden boyut) sürüklenmiyorsa EV ofsetini güncelle.
  //
  // JUMP FİX: useLayoutEffect (boyamadan ÖNCE, senkron) → Işıl <img>'i
  // ekrana ilk DÜŞTÜĞÜ karede zaten EV konumundadır. (Önceki rAF sürümünde
  // konumlama bir kare gecikiyordu; ayrıca <img> yalnızca merkez bilinince
  // render edilir, böylece doğal merkez/translate(0,0) konumunda hiç boyanmaz
  // → açılışta "ortada belirip sonra sola kayma" olmaz.)
  useLayoutEffect(() => {
    if (!merkez) return
    eveYerlestir(false) // boyamadan önce EV konumuna otur
    setHazir(true) // ardından yumuşakça belir (opacity)
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

  // Ölçek Işıl'ın MERKEZİ etrafında (transformOrigin = opak merkez) → merkez-%
  // konumu ölçekten etkilenmez, tüm sürükleme/hedef matematiği geçerli kalır.
  const imgStil = {
    opacity: hazir ? 1 : 0,
    transition: 'opacity 280ms ease',
    transform: `scale(${ISIL_OLCEK})`,
    transformOrigin: merkez ? `${merkez.cx * 100}% ${merkez.cy * 100}%` : 'center',
  }

  return (
    // Konumlanan sarmalayıcı (transform imperatif yazılır → JSX'te transform
    // VERİLMEZ ki React her render'da translate(0,0)'a sıfırlamasın) + Işıl <img>.
    // img pointer-events YOK: tutma kaydı + alfa testiyle yapılır. <img> YALNIZCA
    // merkez hesaplandıktan sonra render edilir (jump fix — bkz. useLayoutEffect).
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
          style={imgStil}
        />
      )}
    </div>
  )
}

export default SevgiSahne3
