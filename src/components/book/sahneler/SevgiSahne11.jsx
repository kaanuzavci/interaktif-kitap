import { useContext, useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { TiklamaKayitContext } from '../tiklamaKayit.js'
import { noktaDolu } from '../alfaHarita.js'
import { useHareketAzalt } from '../../../hooks/useHareketAzalt.js'
import { kitapSaati } from '../../../hooks/kitapDuraklat.js'
import DokunIpucu from '../DokunIpucu.jsx'
import Parilti, { PARILTI_SURE_MS } from '../Parilti.jsx'

// Sayfa-11 görselleri (aşamalar/rozet tam 16:9 tuvale gömülü; yıldız kırpık)
import asama1 from '../../../assets/backgrounds/sayfa11/1.webp'
import asama2 from '../../../assets/backgrounds/sayfa11/2.webp'
import asama3 from '../../../assets/backgrounds/sayfa11/3.webp'
import asama4 from '../../../assets/backgrounds/sayfa11/4.webp'
import asama5 from '../../../assets/backgrounds/sayfa11/5.webp'
import rozetGorsel from '../../../assets/backgrounds/sayfa11/Rozet.webp'
import yildizGorsel from '../../../assets/backgrounds/sayfa11/yıldız.webp'

/* ===============================================================
   SEVGİ — 11. SAHNE İÇERİĞİ (OYUN: çiçeği sula, canlandır!)

   Arka plan (arka_plan11.jpg: açık mint sulu boya) Sahne tarafından
   çizilir. Düzen referans görseldeki gibi: SOLDA saksıda solgun çiçek,
   SAĞDA pembe su kabı, SAĞ ÜSTTE 3 yıldız yuvası.

   OYUN AKIŞI (istenen yapı):
   1. Su kabının üstünde "dokun" halkası durur. DOKUNUNCA su kabı uçarak
      çiçeğin başına gider, eğilir (su_kabi kareleri) ve SU DÖKER (su
      kareleri). Çiçek BİR AŞAMA canlanır (1→2→3→4 çapraz-geçiş) ve sağ
      üstte 1 YILDIZ parıltıyla belirir. Kap evine geri döner.
   2. Bu ÜÇ KEZ yapılır (her sulamada 1 yıldız → toplam 3).
   3. Üçüncü sulamadan sonra çiçek GÜLÜMSER (4→5) ve ekrana ROZET gelir
      (pop) + KONFETİ patlar + rozet üstünde yıldız parıltısı.

   KATMANLAR (alttan üste):
     arka_plan11.jpg (Sahne çiziyor)
     çiçek aşamaları 1..5 (5 tam-tuval <img>, opacity çapraz-geçiş)  z6
     su kabı (12 kare, tek <img> imperatif src)                       z14
     su (16 kare, tek <img> imperatif src) — KABIN ÖNÜNDE             z16
     yıldız yuvaları (3 konumlu <img>; kazanılınca pop + parıltı)     z20
     rozet (tam-tuval <img>; final pop + konfeti)                     z30

   Su kabı/su kareleri tam 16:9 tuvale gömülü (4096→1920 indirildi):
   kabın uçuş yolu ve eğilme pozu, suyun döküldüğü yer KARELERİN İÇİNDE
   çizilidir → koreografi tuvale oturur, konum ayarı gerekmez.

   PERFORMANS: kap+su tek'er <img>'e imperatif src yazılır (GPU'da 1'er
   doku); kareler mount'ta decode edilerek ısıtılır. Aşama görselleri 5
   adet statik doku (sayfa-5'teki katman sayısıyla aynı mertebe).

   DİĞER SAYFALARLA PARALELLİK: dokunma piksel-hassastır (kabın o anki
   karesinin alfası); animasyon oynarken isabet false → sayfa çevirme
   önceliği; kitapSaati durdur düğmesinde koreografiyi dondurur; hareket
   azalt modunda uçuş atlanır (dokun → aşama ilerler, yıldız belirir).
=============================================================== */

/* Kare dizilerini otomatik topla (sıralı) — diğer sahnelerle aynı desen */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const kabKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf11/su_kabi/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const suKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf11/su/*.webp', {
    eager: true,
    import: 'default',
  }),
)

const ASAMALAR = [asama1, asama2, asama3, asama4, asama5]

// ⏱️ TEMPOLAR (ms/kare) — 👉 hız ayarı buradan
const KAB_MS = 80 // kabın gidiş/dönüş uçuşu (12 kare ≈ 1 sn)
const SU_MS = 75 // su dökme (16 kare ≈ 1.2 sn)
const SU_TEKRAR = 2 // su animasyonu kaç tur dökülsün (2 tur ≈ 2.4 sn)
const GULUMSE_BEKLE_MS = 700 // 3. sulama sonrası 4→5 gülümseme beklemesi
const ROZET_BEKLE_MS = 900 // gülümseme → rozet arası bekleme

// 🚿 SU KABI dinlenirken "dokun" halkasının yeri (sahne %'si — kabın gövdesi)
const KAB_IPUCU = { x: 72.5, y: 70 }

// 🏅 ROZET AYARI — Rozet.webp'de madalya tuvalin ortasında DEĞİL (%39,51'de,
// canlanan çiçeğin üstüne denk geliyor). Bu kaydırma onu sahne ortasına
// (referans mockup'taki gibi) taşır. x/y sahne %'si, olcek=1 doğal boyut.
const ROZET_AYAR = { x: 10.6, y: -1.1, olcek: 1 }

// ⭐ YILDIZ YUVALARI (sağ üst; referans görselden) — sol-üst köşe + genişlik
// (sahne %'si). Kırpık yıldız 408x393 → yükseklik = w*(393/408)*(16/9).
const YILDIZ_W = 4.6
const YILDIZLAR = [
  { left: 79.9, top: 3.3 },
  { left: 86.3, top: 3.3 },
  { left: 92.7, top: 3.3 },
]

function SevgiSahne11({ canli = true }) {
  const azalt = useHareketAzalt()
  const azaltRef = useRef(azalt)
  azaltRef.current = azalt
  const canliRef = useRef(canli)
  canliRef.current = canli

  // ---- Görünür durum (render) ----
  const [asama, setAsama] = useState(0) // 0..4 → ASAMALAR indeksi
  const [yildizSayisi, setYildizSayisi] = useState(0) // 0..3 kazanılan yıldız
  const [yildizParilti, setYildizParilti] = useState(null) // yeni kazanılan yıldızın indeksi
  const [rozet, setRozet] = useState(false)
  const [ipucuGizle, setIpucuGizle] = useState(false) // koreografi sırasında halka gizli

  // ---- Koreografi (rAF, ref'lerle) ----
  const durumRef = useRef('hazir') // hazir | gidis | sulama | donus | final | bitti
  const sulamaRef = useRef(0) // tamamlanan sulama sayısı
  const t0Ref = useRef(0) // aktif segmentin başlangıcı (kitapSaati)
  const rafRef = useRef(0)

  const kabImgRef = useRef(null) // su kabı <img> (isabet kutusu + imperatif src)
  const suImgRef = useRef(null) // su <img> (imperatif src)
  const kabKareRef = useRef(0) // o an gösterilen kap karesi
  const kabObjRef = useRef([]) // alfa testi + decode için Image nesneleri

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('sulama-oyunu'))

  const kabYaz = (f) => {
    const i = Math.max(0, Math.min(kabKareleri.length - 1, f))
    if (i === kabKareRef.current) return
    kabKareRef.current = i
    if (kabImgRef.current) kabImgRef.current.src = kabKareleri[i]
  }
  const suYaz = (f) => {
    if (suImgRef.current) suImgRef.current.src = suKareleri[f]
  }
  const suGoster = (ac) => {
    if (suImgRef.current) suImgRef.current.style.opacity = ac ? 1 : 0
  }

  // Bir sulama tamamlandı: aşama ilerle + yıldız kazan (parıltıyla)
  const sulamaTamam = () => {
    sulamaRef.current += 1
    const n = sulamaRef.current
    setAsama(n) // 1..3 → görsel 2..4
    setYildizSayisi(n)
    setYildizParilti(n - 1)
    setTimeout(() => setYildizParilti(null), PARILTI_SURE_MS)
  }

  // FİNAL: çiçek gülümser (5. görsel) → rozet + konfeti
  const final = () => {
    durumRef.current = 'final'
    setTimeout(() => {
      setAsama(4) // gülümseme (5.png)
      setTimeout(() => {
        durumRef.current = 'bitti'
        setRozet(true)
        if (!azaltRef.current) {
          // KONFETİ — sol ve sağ alttan iki patlama + tepeden yıldız yağmuru
          const ortak = { zIndex: 9999, disableForReducedMotion: true }
          confetti({ ...ortak, particleCount: 90, spread: 70, origin: { x: 0.25, y: 0.85 } })
          confetti({ ...ortak, particleCount: 90, spread: 70, origin: { x: 0.75, y: 0.85 } })
          setTimeout(
            () =>
              confetti({
                ...ortak,
                particleCount: 60,
                spread: 120,
                startVelocity: 28,
                scalar: 0.9,
                shapes: ['star'],
                colors: ['#FFD54F', '#FFB300', '#FFF176', '#F06292'],
                origin: { x: 0.5, y: 0.15 },
              }),
            350,
          )
        }
      }, ROZET_BEKLE_MS)
    }, GULUMSE_BEKLE_MS)
  }

  // rAF döngüsü — kabın uçuşu + su dökme (kitapSaati: durdurunca donar)
  const tik = (rafNow) => {
    const d = durumRef.current
    if (d !== 'gidis' && d !== 'sulama' && d !== 'donus') {
      rafRef.current = 0
      return
    }
    const gecen = kitapSaati(rafNow) - t0Ref.current
    if (d === 'gidis') {
      const idx = Math.floor(gecen / KAB_MS)
      if (idx >= kabKareleri.length) {
        durumRef.current = 'sulama'
        t0Ref.current = kitapSaati(rafNow)
        kabYaz(kabKareleri.length - 1)
        suGoster(true)
      } else kabYaz(idx)
    } else if (d === 'sulama') {
      const toplam = suKareleri.length * SU_TEKRAR
      const idx = Math.floor(gecen / SU_MS)
      if (idx >= toplam) {
        suGoster(false)
        sulamaTamam()
        durumRef.current = 'donus'
        t0Ref.current = kitapSaati(rafNow)
      } else suYaz(idx % suKareleri.length)
    } else {
      // donus: kareleri tersten oynat (kap evine döner)
      const idx = Math.floor(gecen / KAB_MS)
      if (idx >= kabKareleri.length) {
        kabYaz(0)
        if (sulamaRef.current >= 3) {
          final()
          rafRef.current = 0
          return
        }
        durumRef.current = 'hazir'
        setIpucuGizle(false)
        rafRef.current = 0
        return
      }
      kabYaz(kabKareleri.length - 1 - idx)
    }
    rafRef.current = requestAnimationFrame(tik)
  }

  // DOKUNUŞ: kap hazırdaysa sulama koreografisini başlat
  const oynat = () => {
    if (!canliRef.current || durumRef.current !== 'hazir') return
    setIpucuGizle(true)
    if (azaltRef.current) {
      // Hareket azalt: uçuş/dökme atlanır → doğrudan sonuç
      sulamaTamam()
      if (sulamaRef.current >= 3) final()
      return
    }
    durumRef.current = 'gidis'
    t0Ref.current = kitapSaati(performance.now())
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tik)
  }

  // Kareleri önbelleğe al + decode ısıt (kap → su → aşamalar → rozet/yıldız).
  // YALNIZCA canli iken: canli=false (çevirme önizlemesi) sadece statik ilk
  // kareyi gösterir (aşağıdaki erken return) → kareleri ısıtmak israftır.
  useEffect(() => {
    if (!canli) return
    kabObjRef.current = kabKareleri.map((u) => { const im = new Image(); im.src = u; return im })
    const suObj = suKareleri.map((u) => { const im = new Image(); im.src = u; return im })
    const digerObj = [...ASAMALAR, rozetGorsel, yildizGorsel].map((u) => { const im = new Image(); im.src = u; return im })
    let iptal = false
    const dec = (im) => (im?.decode ? im.decode().catch(() => {}) : Promise.resolve())
    const sira = [...kabObjRef.current, ...suObj, ...digerObj]
    const isit = (i) => {
      if (iptal || i >= sira.length) return
      dec(sira[i]).then(() => isit(i + 1))
    }
    isit(0)
    return () => { iptal = true }
  }, [canli])

  // Tıklama kaydı — yalnızca kap HAZIR'ken, kabın o anki karesinin alfasıyla
  const fnRef = useRef({})
  fnRef.current.hitTest = (cx, cy) =>
    durumRef.current === 'hazir' && sulamaRef.current < 3
      ? noktaDolu(kabImgRef.current, kabObjRef.current[kabKareRef.current], cx, cy)
      : false
  fnRef.current.oynat = oynat
  useEffect(() => {
    if (!kayit || !canli) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex: 14,
      hitTest: (x, y) => fnRef.current.hitTest(x, y),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, canli])

  // Sekmeye dönüş + temizlik (rAF ve konfeti kalıntısı kalmasın)
  useEffect(() => {
    const gorunur = () => {
      const d = durumRef.current
      if (
        document.visibilityState === 'visible' &&
        (d === 'gidis' || d === 'sulama' || d === 'donus') &&
        !rafRef.current
      ) {
        rafRef.current = requestAnimationFrame(tik)
      }
    }
    document.addEventListener('visibilitychange', gorunur)
    return () => {
      document.removeEventListener('visibilitychange', gorunur)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      confetti.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const yildizH = YILDIZ_W * (393 / 408) * (16 / 9) // yükseklik (sahne %'si)

  // ---- DONUK (canli=false): çevirme önizlemesi — başlangıç düzeni ----
  if (!canli) {
    return (
      <div className="absolute inset-0">
        <img src={asama1} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" style={{ zIndex: 6, objectFit: 'fill' }} />
        <img src={kabKareleri[0]} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" style={{ zIndex: 14, objectFit: 'fill' }} />
        {YILDIZLAR.map((y, i) => (
          <img key={i} src={yildizGorsel} alt="" draggable={false} className="pointer-events-none absolute select-none" style={{ left: `${y.left}%`, top: `${y.top}%`, width: `${YILDIZ_W}%`, zIndex: 20, opacity: 0.25, filter: 'grayscale(0.6)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      {/* ===== ÇİÇEK AŞAMALARI — 5 tam-tuval katman, opacity çapraz-geçiş ===== */}
      {ASAMALAR.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          style={{
            zIndex: 6,
            objectFit: 'fill',
            // Rozet gelince (yıldızlar tamam) çiçek de kaybolur → sadece rozet kalır
            opacity: rozet ? 0 : asama === i ? 1 : 0,
            transition: 'opacity 550ms ease',
          }}
        />
      ))}

      {/* ===== SU (dökülen damlalar) — yalnızca sulama sırasında görünür.
          Kabın ÖNÜNDE (z16 > z14): damlalar kabın ağzından önde akar. ===== */}
      <img
        ref={suImgRef}
        src={suKareleri[0]}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ zIndex: 16, objectFit: 'fill', opacity: 0, transition: 'opacity 150ms ease' }}
      />

      {/* ===== SU KABI — kareleri rAF imperatif yazar (uçuş + eğilme) ===== */}
      <img
        ref={kabImgRef}
        src={kabKareleri[0]}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        // Rozet gelince su kabı da kaybolur → sadece rozet kalır
        style={{ zIndex: 14, objectFit: 'fill', opacity: rozet ? 0 : 1, transition: 'opacity 450ms ease' }}
      />

      {/* ===== YILDIZ YUVALARI (sağ üst) — kazanınca pop + parıltı ===== */}
      {YILDIZLAR.map((y, i) => {
        const kazanildi = i < yildizSayisi
        return (
          <img
            key={i}
            src={yildizGorsel}
            alt=""
            draggable={false}
            className={`pointer-events-none absolute select-none ${kazanildi ? 'animate-pop' : ''}`}
            style={{
              left: `${y.left}%`,
              top: `${y.top}%`,
              width: `${YILDIZ_W}%`,
              zIndex: 20,
              // Rozet gelince yıldız yuvaları da kaybolur → sadece rozet kalır
              opacity: rozet ? 0 : kazanildi ? 1 : 0.25,
              filter: kazanildi ? 'none' : 'grayscale(0.6)',
              transition: 'opacity 300ms ease, filter 300ms ease',
            }}
          />
        )
      })}
      {yildizParilti !== null && (
        <Parilti
          style={{
            left: `${YILDIZLAR[yildizParilti].left + YILDIZ_W / 2}%`,
            top: `${YILDIZLAR[yildizParilti].top + yildizH / 2}%`,
            zIndex: 26,
          }}
        />
      )}

      {/* ===== ROZET (final) — pop ile belirir; üstünde yıldız parıltısı ===== */}
      {rozet && (
        <>
          {/* animate-pop transform'u sarmalayıcıda; AYAR kaydırması img'de
              (ikisi aynı öğede olsaydı pop animasyonu kaydırmayı ezerdi). */}
          <div className="pointer-events-none absolute inset-0 animate-pop" style={{ zIndex: 30 }}>
            <img
              src={rozetGorsel}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none"
              style={{
                objectFit: 'fill',
                transform: `translate(${ROZET_AYAR.x}%, ${ROZET_AYAR.y}%) scale(${ROZET_AYAR.olcek})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
          <Parilti style={{ left: '50%', top: '30%', zIndex: 34 }} />
        </>
      )}

      {/* ===== "DOKUN" HALKASI — kap hazırken gövdesinin üstünde ===== */}
      {!ipucuGizle && !rozet && sulamaRef.current < 3 && (
        <DokunIpucu style={{ left: `${KAB_IPUCU.x}%`, top: `${KAB_IPUCU.y}%`, zIndex: 22 }} />
      )}
    </div>
  )
}

export default SevgiSahne11
