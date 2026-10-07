import { useContext, useEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from '../tiklamaKayit.js'
import { noktaDolu } from '../alfaHarita.js'
import { useHareketAzalt } from '../../../hooks/useHareketAzalt.js'
import { kitapSaati } from '../../../hooks/kitapDuraklat.js'
import KonumluSprite from '../KonumluSprite.jsx'
import DokunIpucu from '../DokunIpucu.jsx'
import Parilti, { PARILTI_SURE_MS } from '../Parilti.jsx'

// Sayfa-8 statik görselleri (tam 16:9 tuvale gömülü)
import isil1Gorsel from '../../../assets/backgrounds/sayfa8/isil1.webp'
import isil2Gorsel from '../../../assets/backgrounds/sayfa8/isil2.webp'

/* ===============================================================
   SEVGİ — 8. SAHNE İÇERİĞİ (oda: üzgün çiçek + çiçeğe konan kelebek)

   Arka plan (arka_plan8.jpg: sarı duvar + krem alan + saksı bitki + tablolar)
   Sahne tarafından çizilir. Bu dosya üzerine binen ÖĞELERİ ekler:

   Katmanlar (alttan üste):
     arka_plan8.jpg   (Sahne çiziyor)      — oda
     isil1.png        (statik <img>)       — solda yürüyen Işıl (tam-kaplama)
     isil2.png        (statik <img>)       — sağda yakın plan Işıl (tam-kaplama)
     çiçek (syf8/cicek, 48 kare) (KonumluSprite) — üzgün ayçiçeği; dokununca
                       yavaş, üzgün göz kırpma döngüsüne girer
     kelebek          (KelebekEfekti, CANVAS)    — aşağıda anlatılan akış

   KELEBEK AKIŞI — İKİ DOKUNUŞ (istenen yapı):
   - Açılışta kelebek1'in İLK karesi durur: kelebek, yürüyen Işıl'ın önünde
     havada; üstünde "dokun" ipucu nabız atar.
   - 1. DOKUNUŞTA kelebek1 TEK SEFER oynar: kelebek Işıl'ın önünden uçarak
     çiçeğin üstüne konar. Bu uçuş TEKRAR ETMEZ.
   - Uçuş bitince kelebek KONDUĞU KAREDE DURUR (konma OTOMATİK başlamaz);
     iniş noktasında 2. "dokun" ipucu belirir.
   - 2. DOKUNUŞTA kelebek2 (konma) DÖNGÜYE girer (kanat çırpıp süzülme;
     sonsuz tekrar). kelebek1'in son karesi = kelebek2'nin ilk karesi (aynı
     konum) → geçiş sıçramasızdır. Tekrar mantığı yalnızca konma üzerindedir.

   PERFORMANS: kelebek 104+84 = 188 tam-ekran kare → DumanEfekti'yle aynı
   CANVAS yaklaşımı (a02b160): DOM'da tek <canvas>, yalnızca aktif kare
   drawImage ile çizilir → GPU'da 1 doku. Kareler arka planda sırayla
   decode edilerek ısıtılır (f092c30 stutter fix'iyle aynı fikir).
   Çiçek kareleri ortak alfa kutusundan kırpıldı (1920x1080 → 542x1016,
   scripts/hazirla-sayfa6-8.mjs) → dosya/decode maliyeti ~%75 düştü;
   piksel kaybı yok, KonumluSprite ile eski yerine oturtulur.

   ───────────────────────────────────────────────────────────────
   👉 KONUMLAR sahne %'sidir. Aşağıdaki sabitlerden ayarla.
   ─────────────────────────────────────────────────────────────── */

/* Kare dizilerini otomatik topla — dosya adındaki SON sayıya göre SAYISAL
   sırala. DÜZ string sort KULLANILAMAZ: kelebek1 104 kareye kadar gider ve
   "frame_10"dan sonra "frame_100..104"ü getirir → uçuşun SONU (çiçeğe konma)
   dizinin ortasında belirir → tıklayınca kelebek bir an sona ışınlanıp geri
   döner ve animasyon parça parça oynar. Sayısal sıralama bunu tümden giderir. */
function kareleriTopla(moduller) {
  const sayi = (yol) => {
    const m = yol.match(/(\d+)(?=\.\w+$)/) // uzantıdan hemen önceki sayı
    return m ? Number(m[1]) : 0
  }
  return Object.keys(moduller)
    .sort((a, b) => sayi(a) - sayi(b))
    .map((yol) => moduller[yol])
}
const cicekKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf8/cicek/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const kelebekUcus = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf8/kelebek1/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const kelebekKonma = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf8/kelebek2/*.webp', {
    eager: true,
    import: 'default',
  }),
)

// 🌻 ÜZGÜN ÇİÇEK (sağ-orta, yakın plan Işıl'ın önünde) — kareler kırpık
// (542x1016); left/top/width sahne %'si, en-boy korunur. Değerler referans
// görselle sharp kompoziti karşılaştırılarak seçildi (saksı kadraj altında).
const CICEK = { left: '45.8%', top: '44.4%', width: '27.5%' }
// Tempo: 48 kare yavaş, üzgün göz kırpma; turlar arası kısa dinlenme.
const CICEK_TEMPO = { frameSuresiMs: 70, donguArasiMs: 900 }
// Dokun ipucu çiçeğin YÜZÜNE otursun (kütle merkezi sapa/saksıya düşüyor).
// Görsel kutusunun %'si (KonumluSprite ipucuYuzde).
const CICEK_IPUCU = { x: 49.4, y: 27.7 }

// 🦋 KELEBEK — kareler tam 16:9 tuvale gömülü; bekleme noktası, uçuş yolu ve
// konma yeri KARELERİN İÇİNDE çizilidir (kelebek1 kare-1: bekleme ~%34,27;
// kelebek1 son kare = kelebek2 kare-1: konma ~%64,38). Bu yüzden tek tek
// nokta ayarlanamaz; AŞAĞIDAKİ AYAR tüm kelebek katmanını (bekleme + uçuş +
// konma birlikte) kaydırır/ölçekler. x/y sahne %'si (+ sağa/aşağı), olcek=1
// doğal boyut. Dokun ipucu ve tıklama isabeti kendiliğinden birlikte kayar.
const KELEBEK_AYAR = { x: -3.8, y: 0, olcek: 1 }
// Bekleyen kelebeğin üstündeki "dokun" halkası (sahne %'si, AYAR ÖNCESİ —
// katman kaydırılınca halka da otomatik aynı kadar kayar).
const KELEBEK_IPUCU = { x: 34.6, y: 27.3 }
/* ⏱️ TEMPO KURALI — değerler EKRAN TAZELEME ADIMININ TAM KATI olmalı.
   Kare seçimi rAF içinde `floor(geçen / MS)` ile yapılır; rAF 60 Hz'de her
   16,667 ms'de bir tetiklenir. MS bu adımın tam katı DEĞİLSE kareler eşit
   sürelerde durmaz. ESKİ DEĞER 55 ms = 3,3 adımdı → kareler 4,3,3,4,3,3 adım
   duruyordu (%30 dalgalanma). Kelebek YAVAŞ ve DÜZGÜN süzüldüğü için bu
   düzensizlik en çok burada göze batıyordu ("uçuş takılmalı duruyor").
   33,33 ms = 60 Hz'de tam 2, 90 Hz'de 3, 120 Hz'de 4 adım → her ekranda düzgün. */
// İKİ SEGMENT AYNI TEMPODA: 1. dokunuş (uçuş) ile 2. dokunuş (konma döngüsü)
// aynı kelebeğin devamı; farklı hızda oynayınca 2. dokunuşta tempo düşüyor ve
// kelebek ağırlaşmış gibi görünüyordu. İkisi de 33,33 ms.
const KELEBEK_UCUS_MS = 33.33 // 2 adım (30 fps) — uçuş: 104 kare ≈ 3,5 sn (eski: 5,7 sn)
const KELEBEK_KONMA_MS = 33.33 // 2 adım (30 fps) — konma döngüsü: gidiş-dönüş ≈ 5,5 sn

// Ayar uygulanmış katman transform'u + ipucu konumu (sahne %'si)
const KELEBEK_TRANSFORM = `translate(${KELEBEK_AYAR.x}%, ${KELEBEK_AYAR.y}%) scale(${KELEBEK_AYAR.olcek})`
const KELEBEK_IPUCU_SON = {
  x: KELEBEK_IPUCU.x * KELEBEK_AYAR.olcek + KELEBEK_AYAR.x,
  y: KELEBEK_IPUCU.y * KELEBEK_AYAR.olcek + KELEBEK_AYAR.y,
}
// Kelebek çiçeğe konunca 2. "dokun" halkasının yeri (konma kare-0 ≈ %64,38;
// AYAR ile birlikte kayar). 2. dokunuş konma (kelebek2) döngüsünü başlatır.
const KELEBEK_KONMA_IPUCU = { x: 64.4, y: 38 }
const KELEBEK_KONMA_IPUCU_SON = {
  x: KELEBEK_KONMA_IPUCU.x * KELEBEK_AYAR.olcek + KELEBEK_AYAR.x,
  y: KELEBEK_KONMA_IPUCU.y * KELEBEK_AYAR.olcek + KELEBEK_AYAR.y,
}
// 🙀 Şaşkın Işıl (isil2) BAŞTA GİZLİ; bu noktada "dokun" halkası durur,
// dokununca resim belirir. Sahne %'si (yüz/kafa hizası).
const ISIL2_IPUCU = { x: 79, y: 33 }

function SevgiSahne8({ canli = true }) {
  return (
    <div className="absolute inset-0">
      {/* ===== IŞIL (solda, yürüyor) — statik tam-kaplama ===== */}
      <img
        src={isil1Gorsel}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ zIndex: 4, objectFit: 'fill' }}
      />

      {/* ===== IŞIL (sağda, yakın plan) — BAŞTA GİZLİ; yerinde "dokun" halkası,
              dokununca yumuşakça belirir. Çiçeğin ARKASINDA (zIndex 6). ===== */}
      <IsilReveal src={isil2Gorsel} canli={canli} zIndex={6} ipucuYuzde={ISIL2_IPUCU} />

      {/* ===== ÜZGÜN ÇİÇEK — dokununca üzgün göz kırpma döngüsü ===== */}
      <KonumluSprite
        frames={cicekKareleri}
        left={CICEK.left}
        top={CICEK.top}
        width={CICEK.width}
        frameSuresiMs={CICEK_TEMPO.frameSuresiMs}
        donguArasiMs={CICEK_TEMPO.donguArasiMs}
        canli={canli}
        zIndex={12}
        ipucuYuzde={CICEK_IPUCU}
      />

      {/* ===== KELEBEK — ilk dokunuşta tek sefer uçar, çiçeğe konar, döngüye girer ===== */}
      <KelebekEfekti
        ucusKareleri={kelebekUcus}
        konmaKareleri={kelebekKonma}
        canli={canli}
        zIndex={30}
      />
    </div>
  )
}

/* ---------------------------------------------------------------
   IŞIL REVEAL — tam-kaplama (16:9) bir görseli DOKUNUNCA gösterir.
   TiklanirGorsel'in tam-ekran sürümü: açılışta gizli (opacity 0), yerinde
   "dokun" halkası; dokununca yumuşakça belirir + parıltı. Tıklama piksel-
   hassastır (görselin alfası); kayıt defterine yazılır (BookReader dağıtır).
---------------------------------------------------------------- */
function IsilReveal({ src, canli = true, zIndex = 6, ipucuYuzde }) {
  const imgRef = useRef(null)
  const objRef = useRef(null) // alfa testi için Image
  const canliRef = useRef(canli)
  canliRef.current = canli
  const [gorunur, setGorunur] = useState(false)
  const gorunurRef = useRef(false)
  gorunurRef.current = gorunur
  const [parilti, setParilti] = useState(false)
  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('isil-reveal'))

  // Alfa testi için Image (yalnızca canli; önizleme kopyası hit-test edilmez)
  useEffect(() => {
    if (!canli) return
    const im = new Image()
    im.src = src
    objRef.current = im
  }, [src, canli])

  const oynat = () => {
    if (!canliRef.current || gorunurRef.current) return
    setGorunur(true)
    setParilti(true)
    setTimeout(() => setParilti(false), PARILTI_SURE_MS)
  }

  // SAYFA ÇEVİRME ÖNCELİĞİ: belirdikten sonra artık dokunmayı yutmaz.
  const fnRef = useRef({})
  fnRef.current.hitTest = (cx, cy) =>
    gorunurRef.current ? false : noktaDolu(imgRef.current, objRef.current, cx, cy)
  fnRef.current.oynat = oynat
  useEffect(() => {
    if (!kayit || !canli) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex,
      hitTest: (x, y) => fnRef.current.hitTest(x, y),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, canli, zIndex])

  return (
    <>
      <img
        ref={imgRef}
        src={src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ zIndex, objectFit: 'fill', opacity: gorunur ? 1 : 0, transition: 'opacity 360ms ease' }}
      />
      {canli && !gorunur && ipucuYuzde && (
        <DokunIpucu style={{ left: `${ipucuYuzde.x}%`, top: `${ipucuYuzde.y}%`, zIndex: zIndex + 3 }} />
      )}
      {canli && parilti && ipucuYuzde && (
        <Parilti style={{ left: `${ipucuYuzde.x}%`, top: `${ipucuYuzde.y}%`, zIndex: zIndex + 4 }} />
      )}
    </>
  )
}

/* ---------------------------------------------------------------
   KELEBEK EFEKTİ — CANVAS tabanlı "tek sefer uçuş → sonsuz konma" oynatıcı

   DumanEfekti (sayfa-3) ile aynı mobil-dostu iskelet: DOM'da tek <canvas>,
   yalnızca aktif kare drawImage ile çizilir (188 tam-ekran <img> yerine
   GPU'da 1 doku). FARKLARI:
   - İki segment: ucus (kelebek1) TEK SEFER oynar; bitince konma (kelebek2)
     SONSUZ döngüye girer. Uçuşun son karesi = konmanın ilk karesi (aynı
     konum) → geçiş sıçramasız.
   - Konma döngüsü İLERİ-GERİ (ping-pong) oynar: kelebek2'nin son karesi
     ilk karesinden UZAKTADIR (kelebek çiçekten kalkıp Işıl'ın saçına
     süzülür ve sağ üstte durur; ölçüldü: f01 %64,38 → f84 %83,8). Düz
     modulo döngü her turda köşeden çiçeğe IŞINLANMA yapardı; ileri-geri
     oynatınca kelebek aynı yoldan yumuşakça çiçeğe geri döner.
   - Dokunmayla tetiklenir: açılışta uçuşun ilk karesi çizilir, üstünde
     "dokun" ipucu durur; isabet piksel-hassastır (ilk karenin alfası).
     Uçuş başladıktan sonra isabet testi false döner → sayfa çevirme
     önceliği (diğer dokun-oynat öğeleriyle aynı kural).
   - kitapSaati: durdur düğmesi kelebeği olduğu karede dondurur.
   - Hareket azalt: uçuş oynatılmaz; dokununca kelebek doğrudan çiçeğin
     üstüne (konma karesine) geçer.
---------------------------------------------------------------- */
function KelebekEfekti({ ucusKareleri, konmaKareleri, canli = true, zIndex = 30 }) {
  const canvasRef = useRef(null)
  const ucusImgRef = useRef([]) // kelebek1 Image nesneleri
  const konmaImgRef = useRef([]) // kelebek2 Image nesneleri
  const aktifRef = useRef(null) // canvas'ta şu an çizili Image
  const durumRef = useRef('bekle') // bekle | ucus | kondu
  const baslangicRef = useRef(0) // aktif segmentin başlangıç zamanı (kitapSaati)
  const rafRef = useRef(0)

  const canliRef = useRef(canli)
  canliRef.current = canli
  const azalt = useHareketAzalt()
  const azaltRef = useRef(azalt)
  azaltRef.current = azalt

  const [oynadi, setOynadi] = useState(false) // 1. (bekleyen) ipucunu gizlemek için
  const [indi, setIndi] = useState(false) // uçuş bitti → çiçeğe kondu; 2. dokun bekleniyor
  const [pariltiKonum, setPariltiKonum] = useState(null) // {x,y} son dokunuş parıltısı

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('kelebek'))

  // Verilen sahne-% noktasında tek seferlik yıldız parıltısı
  const parla = (x, y) => {
    setPariltiKonum({ x, y })
    setTimeout(() => setPariltiKonum(null), PARILTI_SURE_MS)
  }

  // Belirli bir Image'i canvas'a çiz (öncekini sil) — DumanEfekti ile aynı.
  //
  // HAZIR OLMAYAN KARE: eskiden fonksiyon sessizce return ediyordu. Bu, kare
  // ilerlerken canvas'ın ESKİ karede DONMASINA, sonra hazır olan ileri kareye
  // SIÇRAMASINA yol açıyordu (algılanan "takılma"nın bir parçası). Artık kare
  // hazır değilse decode tetiklenir ve çözülür çözülmez —hâlâ istenen kare
  // ise— çizilir. Böylece donma+sıçrama yerine "biraz geç ama doğru" kare gelir.
  const bekleyenRef = useRef(null) // o an çizilmesi İSTENEN kare
  // Asıl çizim (kare hazır varsayılır)
  const cizHemen = (im) => {
    const canvas = canvasRef.current
    if (!canvas || !im || !im.naturalWidth) return
    const ctx = canvas.getContext('2d')
    if (canvas.width !== im.naturalWidth) {
      canvas.width = im.naturalWidth
      canvas.height = im.naturalHeight
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height)
    aktifRef.current = im
  }
  const ciz = (im) => {
    if (!canvasRef.current || !im || im === aktifRef.current) return
    bekleyenRef.current = im
    if (im.complete && im.naturalWidth) { cizHemen(im); return }
    // Hazır değil: decode'u tetikle, çözülünce —hâlâ istenen kareyse— çiz.
    // (Özyineleme yok: doğrudan cizHemen çağrılır.)
    im.decode?.().then(() => {
      if (bekleyenRef.current === im) cizHemen(im)
    }).catch(() => { })
  }

  // Kareleri Image olarak hazırla + arka planda sırayla decode et (ısıtma).
  //
  // ISITMA SIRASI — KONMA KARELERİ UÇUŞ BİTENE KADAR ERTELENİR.
  // Eskiden mount olur olmaz 187 karenin TAMAMI (uçuş + konma) tek zincirde
  // decode ediliyordu. Kullanıcı ipucuna genelde 1-2 sn içinde dokunduğu için
  // UÇUŞ OYNARKEN 84 konma karesi hâlâ decode ediliyordu → decode kuyruğu ve
  // bellek, oynayan karelerle yarışıyordu (uçuşta takılma). Konma kareleri
  // 2. dokunuştan önce hiç gerekmediğinden artık:
  //   mount  → uçuş kareleri (sırayla)
  //   uçuş ısınması bitti  VEYA  uçuş sona erdi → konma kareleri (sırayla)
  // Uçuş ısıtma zinciri oynatma yönüyle aynı sırada ilerlediğinden playhead'in
  // hep önünde kalır; o yüzden uçuş sırasında durdurulmaz.
  // YALNIZCA canli iken: canli=false (sayfa-çevirme önizlemesi) yalnızca ilk
  // kareyi statik <img> ile gösterir (aşağıdaki erken return) → 188 kelebek
  // karesini decode etmek saf israftır ve çevirme anında mobil belleği patlatır.
  const konmaIsitRef = useRef(null) // konma ısıtmasını başlatan fonksiyon (bir kez çalışır)
  useEffect(() => {
    if (!canli) return
    let iptal = false
    const mk = (urls) => urls.map((u) => { const im = new Image(); im.src = u; return im })
    ucusImgRef.current = mk(ucusKareleri)
    konmaImgRef.current = mk(konmaKareleri)

    const dec = (im) => (im?.decode ? im.decode().catch(() => { }) : Promise.resolve())
    // Zincirleme ısıtma: ağı/CPU'yu boğmadan sırayla decode et
    const zincir = (liste, i = 0) => {
      if (iptal || i >= liste.length) return
      dec(liste[i]).then(() => zincir(liste, i + 1))
    }

    let konmaBasladi = false
    konmaIsitRef.current = () => {
      if (iptal || konmaBasladi) return
      konmaBasladi = true
      zincir(konmaImgRef.current)
    }

    dec(ucusImgRef.current[0]).then(() => {
      if (iptal) return
      // Açılış karesi: bekleyen kelebek (durum ilerlemediyse)
      if (durumRef.current === 'bekle') ciz(ucusImgRef.current[0])
      // Önce UÇUŞ karelerini ısıt; zincir bitince konmaya geç
      const ucus = ucusImgRef.current.slice(1)
      const isitUcus = (i) => {
        if (iptal) return
        if (i >= ucus.length) { konmaIsitRef.current?.(); return }
        dec(ucus[i]).then(() => isitUcus(i + 1))
      }
      isitUcus(0)
    })
    return () => { iptal = true; konmaIsitRef.current = null }
  }, [ucusKareleri, konmaKareleri, canli])

  // rAF döngüsü — yalnızca ucus/kondu durumlarında çalışır
  const tik = (rafNow) => {
    const d = durumRef.current
    if (d !== 'ucus' && d !== 'kondu') { rafRef.current = 0; return }
    // kitapSaati: durdur düğmesine basılınca zaman donar → kare donar
    const gecen = kitapSaati(rafNow) - baslangicRef.current
    if (d === 'ucus') {
      const idx = Math.floor(gecen / KELEBEK_UCUS_MS)
      if (idx >= ucusImgRef.current.length) {
        // Uçuş bitti → çiçeğe KONDU. Konma OTOMATİK başlamaz: iniş karesinde
        // durur, 2. "dokun" halkası belirir; 2. dokunuş konma döngüsünü açar.
        durumRef.current = 'indi'
        konmaIsitRef.current?.() // konma kareleri artık gerekli → ısıtmayı başlat
        ciz(konmaImgRef.current[0]) // iniş karesi (kelebek2 kare-0)
        setIndi(true)
        rafRef.current = 0 // döngüyü durdur, 2. dokunuşu bekle
        return
      }
      ciz(ucusImgRef.current[idx])
    } else {
      // İleri-geri (ping-pong): 0..n-1..1 üçgen dalgası — dikişsiz tekrar
      const n = konmaImgRef.current.length || 1
      const adim = Math.floor(gecen / KELEBEK_KONMA_MS) % Math.max(1, 2 * n - 2)
      const idx = adim < n ? adim : 2 * n - 2 - adim
      ciz(konmaImgRef.current[idx])
    }
    rafRef.current = requestAnimationFrame(tik)
  }

  // İKİ DOKUNUŞ akışı:
  //  1) BEKLE  → dokun → UÇUŞ (bitince çiçeğe konar, 'indi' durumunda bekler)
  //  2) İNDİ   → dokun → KONMA döngüsü (sonsuz; tekrar mantığı yalnızca konma)
  const oynat = () => {
    if (!canliRef.current) return
    const d = durumRef.current
    if (d === 'bekle') {
      setOynadi(true)
      parla(KELEBEK_IPUCU_SON.x, KELEBEK_IPUCU_SON.y)
      if (azaltRef.current) {
        // Hareket azalt: uçuş yok → doğrudan iniş karesi + 2. dokun beklenir.
        durumRef.current = 'indi'
        konmaIsitRef.current?.() // uçuş atlandı → konma karelerini hemen ısıt
        ciz(konmaImgRef.current[0]) // ciz() kare hazır değilse decode edip kendi çizer
        setIndi(true)
        return
      }
      durumRef.current = 'ucus'
      baslangicRef.current = kitapSaati(performance.now())
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tik)
    } else if (d === 'indi') {
      // 2. dokunuş: konma döngüsünü başlat
      setIndi(false)
      parla(KELEBEK_KONMA_IPUCU_SON.x, KELEBEK_KONMA_IPUCU_SON.y)
      durumRef.current = 'kondu'
      baslangicRef.current = kitapSaati(performance.now())
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tik)
    }
  }

  // En güncel fonksiyonları ref'te tut (kayıt defteri stale closure yakalamasın)
  const fnRef = useRef({})
  // İKİ tıklanabilir an: BEKLE (bekleyen kelebek) ve İNDİ (çiçeğe konmuş
  // kelebek). Uçuş/konma OYNARKEN isabet false → sayfa çevirme önceliği.
  fnRef.current.hitTest = (cx, cy) => {
    const d = durumRef.current
    if (d === 'bekle') return noktaDolu(canvasRef.current, ucusImgRef.current[0], cx, cy)
    if (d === 'indi') return noktaDolu(canvasRef.current, konmaImgRef.current[0], cx, cy)
    return false
  }
  fnRef.current.oynat = oynat

  // Kayıt defterine yaz / sil
  useEffect(() => {
    if (!kayit || !canli) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex,
      hitTest: (x, y) => fnRef.current.hitTest(x, y),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, canli, zIndex])

  // Sekmeye dönülünce: oynuyor olması gerekirken döngü durmuşsa yeniden başlat
  useEffect(() => {
    const gorunur = () => {
      const d = durumRef.current
      if (document.visibilityState === 'visible' && (d === 'ucus' || d === 'kondu') && !rafRef.current) {
        rafRef.current = requestAnimationFrame(tik)
      }
    }
    document.addEventListener('visibilitychange', gorunur)
    return () => {
      document.removeEventListener('visibilitychange', gorunur)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- DONUK (canli=false): sayfa-çevirme önizlemesi — bekleyen kelebek ----
  if (!canli) {
    return (
      <img
        src={ucusKareleri[0]}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{
          zIndex,
          objectFit: 'fill',
          transform: KELEBEK_TRANSFORM,
          transformOrigin: 'top left',
        }}
      />
    )
  }

  return (
    <>
      {/* Tek canvas — yalnızca aktif kelebek karesi çizili (GPU'da 1 doku).
          KELEBEK_AYAR transform'u sarmalayıcıya uygulanır: görüntüyle birlikte
          isabet kutusu (getBoundingClientRect) da kayar → alfa tıklaması doğru. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex, transform: KELEBEK_TRANSFORM, transformOrigin: 'top left' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: 'fill' }}
        />
      </div>

      {/* DOKUN İPUCU 1 — bekleyen kelebeğin üstünde (uçuşa kadar) */}
      {!oynadi && (
        <DokunIpucu
          style={{ left: `${KELEBEK_IPUCU_SON.x}%`, top: `${KELEBEK_IPUCU_SON.y}%`, zIndex: zIndex + 3 }}
        />
      )}

      {/* DOKUN İPUCU 2 — kelebek çiçeğe konunca iniş noktasında (konmaya kadar) */}
      {indi && (
        <DokunIpucu
          style={{ left: `${KELEBEK_KONMA_IPUCU_SON.x}%`, top: `${KELEBEK_KONMA_IPUCU_SON.y}%`, zIndex: zIndex + 3 }}
        />
      )}

      {/* DOKUNUŞ PARILTISI — son dokunulan noktada yıldızlar saçılır */}
      {pariltiKonum && (
        <Parilti
          style={{ left: `${pariltiKonum.x}%`, top: `${pariltiKonum.y}%`, zIndex: zIndex + 4 }}
        />
      )}
    </>
  )
}

export default SevgiSahne8
