import { useContext, useEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from '../tiklamaKayit.js'
import { noktaDolu } from '../alfaHarita.js'
import { useHareketAzalt } from '../../../hooks/useHareketAzalt.js'
import DokunIpucu from '../DokunIpucu.jsx'

// Sayfa-5 görselleri (gökyüzü = tam 16:9 jpg; bulutlar = şeffaf ön-plan png)
// NOT: gündüz gökyüzü TABAN katmandır → sahne `arkaplan` olarak çizilir.
import geceGok from '../../../assets/backgrounds/sayfa5/gece_gökyüzü.jpg'
import gunduzBulut from '../../../assets/backgrounds/sayfa5/gündüz_bulut.png'
import geceBulut from '../../../assets/backgrounds/sayfa5/gece_bulut.png'

/* ===============================================================
   SEVGİ — 5. SAHNE İÇERİĞİ (gökyüzü: güneş ↔ ay döngüsü)

   AKIŞ (örnek görsellerdeki gibi):
     1. Açılış GÜNDÜZ: güneş doğar (kayarak gelir), ortada durur; üstünde
        "dokun" göstergesi belirir.
     2. Güneşe DOKUN → güneş batarak kayıp gider; arka plan gündüz→gece
        crossfade eder; ardından AY gelir (kayarak doğar).
     3. Ay yerine oturunca (TEKRAR DOKUNMADAN) "zzz" uyku animasyonu başlar;
        ay üstünde yeni bir "dokun" göstergesi belirir.
     4. Aya DOKUN → ay kayarak gider; gece→gündüz crossfade; güneş yeniden
        doğar → 1. adıma döner (sonsuz döngü).
   Geçişler YALNIZCA güneş/ay'a dokununca olur (gündüz↔gece arası).

   KATMANLAR (alttan üste):
     gündüz_gökyüzü.jpg  (Sahne `arkaplan` — TABAN)
     gece_gökyüzü.jpg    (üstte; opacity ile crossfade)   z1
     güneş / ay          (tek <img>; kareler imperatif yazılır)  z10
     bulutlar (gündüz+gece, crossfade) — ÖN PLAN çerçeve   z20
     zzz                 (uyku göstergesi; ay uykudayken)  z22
     dokun ipucu                                            z25

   KARELER (4096→1920 indirgendi; opak siyah zzz → şeffaf krem'e işlendi):
     - güneş doğuş (dogus): kayıp gelir, ~14. karede ortaya OTURUR
     - güneş batış (batis): ortadan kayıp GİDER (son kare boş)
     - ay geliş  (gelis):  kayıp gelir → ORTADA DURAKLAR (10-24) → kayıp gider
       → geliş = gelis[0..10], gidiş = gelis[24..34] (aynı yayın iki yarısı)
     - ay zzz: yerinde süzülen tek "z" (döngü)

   PERFORMANS: tek <img>'e imperatif src yazılır (DOM'da tek doku) + kareler
   önceden decode edilir → mobil/tablet/masaüstü akıcı. rAF React render'dan
   bağımsızdır; gerçek geçen süreye göre kare seçer.
=============================================================== */

/* Kare URL'lerini sıralı topla (zero-padded adlar → leksikografik sıra doğru) */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const gunesDogus = kareleriTopla(
  import.meta.glob('../../../assets/characters/günes_animasyonlari/günes_dogus/*.png', {
    eager: true,
    import: 'default',
  }),
)
const gunesBatis = kareleriTopla(
  import.meta.glob('../../../assets/characters/günes_animasyonlari/günes_batis/*.png', {
    eager: true,
    import: 'default',
  }),
)
const ayGelis = kareleriTopla(
  import.meta.glob('../../../assets/characters/ay_animasyonlari/ay_gelis/*.png', {
    eager: true,
    import: 'default',
  }),
)
const ayZzz = kareleriTopla(
  import.meta.glob('../../../assets/characters/ay_animasyonlari/ay_zzz/*.png', {
    eager: true,
    import: 'default',
  }),
)

/* --- SEGMENT SINIRLARI (ölçülen kare merkezlerine göre seçildi) ---
   dogus: 0..14 doğar+oturur (15-24 aynı → atlanır). REST = 14.
   batis: 7..26 (0..6 sabit dinlenme → atlanır; 26 boş).
   gelis: 0..10 geliş (REST=10); 11-23 aynı durak → atlanır; 24..34 gidiş (34 boş). */
const SUN_RISE = [0, 14]
const SUN_SET = [7, gunesBatis.length - 1]
const MOON_IN = [0, 10]
const MOON_OUT = [24, ayGelis.length - 1]
const SUN_REST_IDX = 14
const MOON_REST_IDX = 10

/* Tempo (ms/kare) ve crossfade — kareler zaten yumuşatma (ease) içerdiğinden
   düz oynatım yeterli. */
const SUN_MS = 60
const MOON_MS = 62
const ZZZ_MS = 130
const CROSSFADE_MS = 1300

/* "Dokun" göstergesinin oturacağı yerler (sahne %'si) — güneş/ay yüzünün üstü */
const GUNES_IPUCU = { x: 51, y: 44 }
const AY_IPUCU = { x: 49, y: 45 }

function dilim(diziUrl, [a, b]) {
  return diziUrl.slice(a, b + 1)
}

function SevgiSahne5({ canli = true }) {
  const azalt = useHareketAzalt()
  const azaltRef = useRef(azalt)
  azaltRef.current = azalt
  const canliRef = useRef(canli)
  canliRef.current = canli

  // Yüksek seviye durum (render: dokun ipucu + gece/gündüz crossfade)
  const [durum, setDurum] = useState('hazir') // hazir|dogus|gunesBekle|batis|ayGelis|ayUyku|ayCikis
  const [gece, setGece] = useState(false)

  const mainRef = useRef(null) // güneş/ay <img> (imperatif src + isabet kutusu)
  const zzzRef = useRef(null) // zzz overlay <img>
  const durumRef = useRef('hazir')
  const kareImgRef = useRef(null) // o an gösterilen Image (alfa isabet testi için)
  const apiRef = useRef(null) // { git } — kayıt defterinin oynat'ı buradan çağırır

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('gunes-ay'))

  // --- DURUM MOTORU (canli iken) — yalnızca ref'ler + kararlı setter'lar
  // kullanır; stale closure yoktur. Karelerin tümü Image olarak preload edilir
  // ve decode beklenir (akıcı, flicker'sız). ---
  useEffect(() => {
    if (!canli) return
    let iptal = false
    let raf = 0
    let zraf = 0

    // Tüm kareleri Image olarak yükle (src=URL → tarayıcı getirir+cache'ler)
    const mk = (urls) => urls.map((u) => { const im = new Image(); im.src = u; return im })
    const IM = {
      dogus: mk(gunesDogus),
      batis: mk(gunesBatis),
      gelis: mk(ayGelis),
      zzz: mk(ayZzz),
    }
    const SEG = {
      rise: dilim(IM.dogus, SUN_RISE),
      set: dilim(IM.batis, SUN_SET),
      moonIn: dilim(IM.gelis, MOON_IN),
      moonOut: dilim(IM.gelis, MOON_OUT),
      sunRest: IM.dogus[SUN_REST_IDX],
      moonRest: IM.gelis[MOON_REST_IDX],
    }

    const yaz = (im) => {
      if (!im || !mainRef.current || kareImgRef.current === im) return
      mainRef.current.src = im.src
      kareImgRef.current = im
    }
    const zyaz = (im) => { if (im && zzzRef.current) zzzRef.current.src = im.src }
    const durdur = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }
    const durdurZ = () => { if (zraf) cancelAnimationFrame(zraf); zraf = 0 }

    // Bir kare listesini ms/kare hızında oynat; bitince son karede kal + done()
    const oynat = (liste, ms, done) => {
      durdur()
      if (!liste || liste.length === 0) { done?.(); return }
      if (azaltRef.current) {
        // Hareket azalt: kare animasyonu yok → doğrudan son kareye geç
        yaz(liste[liste.length - 1])
        setTimeout(() => { if (!iptal) done?.() }, 280)
        return
      }
      const t0 = performance.now()
      yaz(liste[0])
      const tik = (now) => {
        if (iptal) { raf = 0; return }
        const idx = Math.floor((now - t0) / ms)
        if (idx >= liste.length) { yaz(liste[liste.length - 1]); raf = 0; done?.(); return }
        yaz(liste[idx])
        raf = requestAnimationFrame(tik)
      }
      raf = requestAnimationFrame(tik)
    }

    // zzz döngüsü (yerinde süzülen tek "z")
    const baslaZ = () => {
      durdurZ()
      const z = IM.zzz
      if (!z.length) return
      if (azaltRef.current) { zyaz(z[Math.floor(z.length / 2)]); return }
      const t0 = performance.now()
      const tik = (now) => {
        if (iptal) { zraf = 0; return }
        zyaz(z[Math.floor((now - t0) / ZZZ_MS) % z.length])
        zraf = requestAnimationFrame(tik)
      }
      zraf = requestAnimationFrame(tik)
    }

    // Durum geçiş tablosu
    const git = (yeni) => {
      durumRef.current = yeni
      setDurum(yeni)
      if (yeni === 'dogus') { setGece(false); oynat(SEG.rise, SUN_MS, () => git('gunesBekle')) }
      else if (yeni === 'gunesBekle') { yaz(SEG.sunRest) }
      else if (yeni === 'batis') { setGece(true); oynat(SEG.set, SUN_MS, () => git('ayGelis')) }
      else if (yeni === 'ayGelis') { oynat(SEG.moonIn, MOON_MS, () => git('ayUyku')) }
      else if (yeni === 'ayUyku') { yaz(SEG.moonRest); baslaZ() }
      else if (yeni === 'ayCikis') { durdurZ(); setGece(false); oynat(SEG.moonOut, MOON_MS, () => git('dogus')) }
    }
    apiRef.current = { git }

    // İLK AÇILIŞ: güneş DOĞRUDAN ortada durur (animasyonsuz) — örnek görseldeki
    // gibi, hemen tıklanmaya hazır. Yalnızca dinlenme karesini decode edip
    // 'gunesBekle'ye geçeriz. (Döngüde tekrar gelişlerde güneş yine DOĞUŞ
    // animasyonuyla gelir — yalnızca ilk açılış animasyonsuzdur.) Kalan tüm
    // kareler arka planda ısıtılır ki ilk dokunuştaki batış/ay akıcı olsun.
    const dec = (im) => (im?.decode ? im.decode().catch(() => {}) : Promise.resolve())
    Promise.allSettled([SEG.sunRest].map(dec)).then(() => { if (!iptal) git('gunesBekle') })
    Promise.allSettled([...IM.dogus, ...IM.batis, ...IM.gelis, ...IM.zzz].map(dec))

    return () => { iptal = true; durdur(); durdurZ(); apiRef.current = null }
  }, [canli])

  // --- TIKLAMA KAYDI (yalnızca canli) — güneş/ay silüetine dokununca geçiş.
  // Geçiş/animasyon sırasında isabet testi false → SAYFA çevirme serbest. ---
  const fnRef = useRef({})
  fnRef.current.hitTest = (cx, cy) => {
    const d = durumRef.current
    if (d !== 'gunesBekle' && d !== 'ayUyku') return false // sadece dinlenme anında tıklanır
    return noktaDolu(mainRef.current, kareImgRef.current, cx, cy)
  }
  fnRef.current.oynat = () => {
    const d = durumRef.current
    if (d === 'gunesBekle') apiRef.current?.git('batis')
    else if (d === 'ayUyku') apiRef.current?.git('ayCikis')
  }
  useEffect(() => {
    if (!kayit || !canli) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex: 10,
      hitTest: (x, y) => fnRef.current.hitTest(x, y),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, canli])

  // ---- DONUK (canli=false): sayfa-çevirme önizlemesi için statik poster ----
  // Gündüz + oturmuş güneş + gündüz bulutları. Animasyon/etkileşim YOK.
  if (!canli) {
    return (
      <div className="absolute inset-0">
        <img
          src={gunesDogus[SUN_REST_IDX]}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          style={{ objectFit: 'fill', zIndex: 10 }}
        />
        <img
          src={gunduzBulut}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          style={{ objectFit: 'fill', zIndex: 20 }}
        />
      </div>
    )
  }

  // Dokun göstergesi yalnızca dinlenme durumlarında (geçişlerde gizli)
  const ipucu =
    durum === 'gunesBekle' ? GUNES_IPUCU : durum === 'ayUyku' ? AY_IPUCU : null

  const kareGecis = `opacity ${CROSSFADE_MS}ms ease`

  return (
    <div className="absolute inset-0">
      {/* GECE GÖKYÜZÜ — gündüz tabanın (arkaplan) üstünde crossfade */}
      <img
        src={geceGok}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ objectFit: 'fill', zIndex: 1, opacity: gece ? 1 : 0, transition: kareGecis }}
      />

      {/* GÜNEŞ / AY — tek <img>; kareleri rAF imperatif yazar (DOM'da tek doku).
          İlk paint için güneşin OTURMUŞ (ortadaki) karesi → açılışta animasyonsuz,
          doğrudan ortada görünür. */}
      <img
        ref={mainRef}
        src={gunesDogus[SUN_REST_IDX]}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ objectFit: 'fill', zIndex: 10 }}
      />

      {/* ZZZ — ay uykudayken görünür (süzülen krem "z" döngüsü) */}
      <img
        ref={zzzRef}
        src={ayZzz[0]}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{
          objectFit: 'fill',
          zIndex: 22,
          opacity: durum === 'ayUyku' ? 1 : 0,
          transition: 'opacity 450ms ease',
        }}
      />

      {/* BULUTLAR (ön-plan çerçeve) — gündüz/gece crossfade */}
      <img
        src={gunduzBulut}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ objectFit: 'fill', zIndex: 20, opacity: gece ? 0 : 1, transition: kareGecis }}
      />
      <img
        src={geceBulut}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ objectFit: 'fill', zIndex: 20, opacity: gece ? 1 : 0, transition: kareGecis }}
      />

      {/* DOKUN İPUCU — güneş/ay dinlenirken üstünde nabız atar */}
      {ipucu && <DokunIpucu style={{ left: `${ipucu.x}%`, top: `${ipucu.y}%`, zIndex: 25 }} />}
    </div>
  )
}

export default SevgiSahne5
