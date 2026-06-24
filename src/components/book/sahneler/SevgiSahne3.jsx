import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from '../tiklamaKayit.js'
import { opakMerkez, noktaDolu } from '../alfaHarita.js'
import { useHareketAzalt } from '../../../hooks/useHareketAzalt.js'
import TiklanirGorsel from '../TiklanirGorsel.jsx'
import DokunNoktasi from '../DokunNoktasi.jsx'
import SurukleIpucu from '../SurukleIpucu.jsx'

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

/* Duman kare URL'lerini topla (sıralı). eager: false → modül başlangıcında
   25 PNG decode edilmez; URL'ler yalnızca DumanEfekti mount olunca lazy
   resolve edilir (Aşama 1+2: ~200 MB GPU bellek tasarrufu). */
const dumanGlobYollari = Object.keys(
  import.meta.glob('../../../assets/animations/duman_animasyon/*.png'),
).sort()
// Lazy resolve: URL'leri ilk ihtiyaçta yükle ve önbelleğe al
let _dumanUrlOnbellek = null
async function dumanUrlleriniYukle() {
  if (_dumanUrlOnbellek) return _dumanUrlOnbellek
  const moduller = import.meta.glob(
    '../../../assets/animations/duman_animasyon/*.png',
    { eager: true, import: 'default' },
  )
  _dumanUrlOnbellek = dumanGlobYollari.map((yol) => moduller[yol])
  return _dumanUrlOnbellek
}

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
// 🤚 "Tutup sürükle" el ipucu — Işıl'ın görünen gövdesinin üstünde durur
// (merkez aşağıda/kırpık kaldığından elle yukarı alındı). Sahne %'si.
const ISIL_EL = { x: 10, y: 64 }

// Geliştirici/önizleme: ?kek varsa raf açık + duman oynar başlar (screenshot)
const KEK_DEBUG =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('kek')

function SevgiSahne3({ canli = true }) {
  // Koku (duman) tetiklendi mi? — yalnızca KEK tıklamasıyla açılır.
  const [dumanAktif, setDumanAktif] = useState(KEK_DEBUG)
  // Işıl şu an tutulup sürükleniyor mu? — tutulurken koku DURAKLAR.
  const [isilTutuluyor, setIsilTutuluyor] = useState(false)
  // Işıl bu sayfada hiç tutuldu mu? — tutulunca "tutup sürükle" el ipucu kaybolur
  // (sayfaya tekrar gelince sahne sıfırlandığı için yeniden belirir).
  const [isilTutuldu, setIsilTutuldu] = useState(false)

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
        onTutmaBasla={() => {
          setIsilTutuluyor(true)
          setIsilTutuldu(true) // ilk tutuşta "tutup sürükle" el ipucu kalkar
        }}
        onBirak={() => setIsilTutuluyor(false)}
      />

      {/* ===== "TUTUP SÜRÜKLE" EL İPUCU — Işıl ilk kez tutulana dek üstünde durur ===== */}
      {canli && !isilTutuldu && (
        <SurukleIpucu style={{ left: `${ISIL_EL.x}%`, top: `${ISIL_EL.y}%`, zIndex: 40 }} />
      )}

      {/* ===== DUMAN/KOKU (pastadan tüter) — CANVAS TABANLI =====
          Eski yöntem: 25×<img> hepsi DOM'da, opacity ile saklanıyordu
          → ~200 MB GPU bellek. YENİ: tek <canvas>, sadece aktif kare
          çizilir → ~8 MB. Aynı görsel sonuç, %96 daha az bellek. */}
      <DumanEfekti
        yukleyici={dumanUrlleriniYukle}
        kareSayisi={dumanGlobYollari.length}
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
   DUMAN EFEKTİ — CANVAS TABANLI kare oynatıcı (MOBİL-DOSTU)

   ESKİ SORUN: 25 adet tam-ekran <img> hepsi DOM'da opacity ile
   saklanıyordu → her biri GPU tekstürü olarak tutulduğundan
   ~200 MB GPU belleği tüketiyordu. Masaüstünde sorun değildi ama
   mobil tarayıcılar (300-500 MB limit) çöküyordu.

   YENİ ÇÖZÜM: Tek bir <canvas> öğesi; sadece AKTİF kare canvas'a
   drawImage() ile çizilir. Önceki kare clearRect() ile silinir.
   Böylece GPU'da aynı anda yalnızca 1 tekstür (canvas) tutulur
   → ~200 MB → ~8 MB. Image nesneleri RAM'de (sıkıştırılmış) durur;
   tarayıcı gerektiğinde decode eder, gerekmeyince atar.

   FLICKER-SIZ BAŞLANGIÇ: Kareler arka planda Image nesneleri olarak
   preload edilir. Animasyon yalnızca en az 2 kare hazır olunca
   başlar. İlk kare (frame_01) zaten boş olduğundan tetiklenene
   kadar canvas boş kalır (görünmez).

   DURAKLAT / GİZLE: Aynı API — Işıl tutulurken canvas gizlenir
   (opacity:0) ve kare ilerlemez; bırakılınca kaldığı yerden devam.
---------------------------------------------------------------- */
function DumanEfekti({ yukleyici, kareSayisi = 0, oynat, duraklat = false, gizle = false, frameSuresiMs = 80, style }) {
  const canvasRef = useRef(null)
  const imglerRef = useRef([]) // Image nesneleri (preload)
  const aktifRef = useRef(-1) // canvas'ta şu an çizili kare
  const oynatRef = useRef(oynat)
  oynatRef.current = oynat
  const duraklatRef = useRef(duraklat)
  duraklatRef.current = duraklat
  const gecenRef = useRef(0)
  const azalt = useHareketAzalt()
  const azaltRef = useRef(azalt)
  azaltRef.current = azalt
  const hazirRef = useRef(false) // en az 2 kare decode edildi mi?
  const toplamRef = useRef(kareSayisi)
  toplamRef.current = kareSayisi

  // Mount olunca kare URL'lerini lazy yükle + Image nesneleri oluştur
  useEffect(() => {
    let iptal = false
    hazirRef.current = false
    imglerRef.current = []
    aktifRef.current = -1

    const yukle = async () => {
      const urls = await yukleyici()
      if (iptal || !urls?.length) return

      const imgs = urls.map((url) => {
        const im = new Image()
        im.src = url
        return im
      })
      imglerRef.current = imgs

      // İlk 2 kareyi bekle (flicker'sız başlangıç için yeterli)
      await Promise.allSettled([
        imgs[0]?.decode?.(),
        imgs[1]?.decode?.(),
      ])
      if (!iptal) hazirRef.current = true
    }
    yukle()
    return () => { iptal = true }
  }, [yukleyici])

  // Canvas'a belirli kareyi çiz (öncekini sil)
  const ciz = (idx) => {
    const canvas = canvasRef.current
    const imgs = imglerRef.current
    const n = imgs.length
    if (!canvas || !n) return
    const yeni = ((idx % n) + n) % n
    if (yeni === aktifRef.current) return

    const ctx = canvas.getContext('2d')
    const im = imgs[yeni]
    // Canvas boyutunu ilk çizimde ayarla (16:9 tuval boyutuna)
    if (im.naturalWidth && canvas.width !== im.naturalWidth) {
      canvas.width = im.naturalWidth
      canvas.height = im.naturalHeight
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (im.complete && im.naturalWidth) {
      ctx.drawImage(im, 0, 0, canvas.width, canvas.height)
    }
    aktifRef.current = yeni
  }

  // Temizle (boş kare göster)
  const temizle = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    aktifRef.current = -1
  }

  // Tek rAF döngüsü (delta birikimli)
  useEffect(() => {
    if (kareSayisi === 0) return
    let raf = 0
    let sonZaman
    const tik = (now) => {
      raf = requestAnimationFrame(tik)
      if (!oynatRef.current || azaltRef.current) {
        gecenRef.current = 0
        sonZaman = undefined
        temizle()
        return
      }
      if (!hazirRef.current) {
        sonZaman = undefined
        return
      }
      if (duraklatRef.current) {
        sonZaman = undefined
        return
      }
      if (sonZaman === undefined) sonZaman = now
      gecenRef.current += now - sonZaman
      sonZaman = now
      const n = imglerRef.current.length || 1
      const idx = Math.floor(gecenRef.current / frameSuresiMs) % n
      ciz(idx)
    }
    raf = requestAnimationFrame(tik)
    const gorunur = () => {
      if (document.visibilityState === 'visible') sonZaman = undefined
    }
    document.addEventListener('visibilitychange', gorunur)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', gorunur)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kareSayisi, frameSuresiMs])

  if (kareSayisi === 0) return null

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        ...style,
        opacity: gizle ? 0 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: 'fill' }}
      />
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
