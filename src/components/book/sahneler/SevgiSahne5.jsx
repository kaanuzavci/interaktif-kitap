import { useContext, useEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from '../tiklamaKayit.js'
import { noktaDolu } from '../alfaHarita.js'
import { useHareketAzalt } from '../../../hooks/useHareketAzalt.js'
import { kitapSaati } from '../../../hooks/kitapDuraklat.js'
import DokunIpucu from '../DokunIpucu.jsx'

// Sayfa-5 görselleri (gökyüzü = tam 16:9 jpg; bulutlar = şeffaf ön-plan png)
// NOT: gündüz gökyüzü TABAN katmandır → sahne `arkaplan` olarak çizilir.
import geceGok from '../../../assets/backgrounds/sayfa5/gece_gökyüzü.jpg'
import gunduzBulut from '../../../assets/backgrounds/sayfa5/gündüz_bulut.webp'
import geceBulut from '../../../assets/backgrounds/sayfa5/gece_bulut.webp'

/* ===============================================================
   SEVGİ — 5. SAHNE İÇERİĞİ (gökyüzü: güneş ↔ ay döngüsü)

   AKIŞ (örnek görsellerdeki gibi):
     1. Açılış GÜNDÜZ: güneş doğar (kayarak gelir), ortada durur; üstünde
        "dokun" göstergesi belirir.
     2. Güneşe DOKUN → güneş göz kırpıp sallanır, sonra batarak kayıp
        gider; gündüz→gece crossfade SALLANMA başlarken devreye girer
        (dokunur dokunmaz değil); ardından AY gelir (kayarak doğar).
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
     - güneş doğuş (dogus): TAMAMI oynar — soldan kayıp gelir, 14. karede
       ortaya OTURUR ve ardından göz KIRPAR (17-18 gözler kapalı); kırpma
       ayrıca gunesBekle sırasında blinkDongusu() ile ara sıra tekrarlanır
     - güneş batış (batis): TAMAMI oynar — önce göz kırpıp hafif sağa-sola
       SALLANIR (1-7), sonra ortadan kayıp GİDER (son kare boş)
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
  import.meta.glob('../../../assets/characters/günes_animasyonlari/günes_dogus/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const gunesBatis = kareleriTopla(
  import.meta.glob('../../../assets/characters/günes_animasyonlari/günes_batis/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const ayGelis = kareleriTopla(
  import.meta.glob('../../../assets/characters/ay_animasyonlari/ay_gelis/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const ayZzz = kareleriTopla(
  import.meta.glob('../../../assets/characters/ay_animasyonlari/ay_zzz/*.webp', {
    eager: true,
    import: 'default',
  }),
)

/* --- SEGMENT SINIRLARI (kare piksel-fark ölçümüyle çıkarıldı) ---
   dogus: TAMAMI oynar → 0..14 soldan gelip oturur (REST=14); 15..24
   oturmuş halde göz KIRPMA (17-18 gözler kapalı, kalanı duruş kopyası).
   batis: TAMAMI oynar, iki tempoda → giriş 0..7 (duruş + kırpma + hafif
   sağa-sola sallanma) bir tık YAVAŞ oynar ki sallanma doğal görünsün;
   8..25 kayıp gider (normal tempo); 26 boş.
   Giriş İKİYE bölünür: A=0..2, B=3..7 — gece crossfade dokunur dokunmaz
   DEĞİL, B'ye (sallanma karesi 04'e) gelince başlar → 1.3 sn'lik solma
   güneş kayıp giderken tamamlanır.
   gelis: 0..10 geliş (REST=10); 11-23 aynı durak → atlanır; 24..34 gidiş (34 boş). */
const SUN_RISE = [0, gunesDogus.length - 1]
const SUN_SET_GIRIS_A = [0, 2]
const SUN_SET_GIRIS_B = [3, 7]
const SUN_SET = [8, gunesBatis.length - 1]
const MOON_IN = [0, 10]
const MOON_OUT = [24, ayGelis.length - 1]
const SUN_REST_IDX = 14
const MOON_REST_IDX = 10
const SUN_BLINK = [SUN_REST_IDX, 19] // 14..19: duruş → kırpma (17-18 kapalı) → duruş

/* Tempo (ms/kare) ve crossfade — kareler zaten yumuşatma (ease) içerdiğinden
   düz oynatım yeterli.

   ⏱️ TEMPO KURALI — değerler EKRAN TAZELEME ADIMININ TAM KATI olmalı.
   Kare seçimi rAF içinde `floor(geçen / MS)` ile yapılır; rAF 60 Hz'de her
   16,667 ms'de bir tetiklenir. MS bu adımın tam katı DEĞİLSE kareler eşit
   sürelerde durmaz: ör. 90 ms → 5,4 adım → kareler 5,5,6,5,5,6 adım durur
   (%20 dalgalanma) → gözle "titreme/takılma" olarak okunur.
   Aşağıdaki değerler tam kat seçildi (yanlarında adım sayısı yazıyor).
   NOT: 33,33 / 66,67 / 100 / 150 / 200 aynı zamanda 90 ve 120 Hz ekranlarda
   da tam kat düşer → yüksek tazelemeli tabletlerde de düzgün akar. */
const SUN_MS = 66.67 // 4 adım — doğuş/batış kayışı (25 kare ≈ 1,67 sn)
const SUN_GIRIS_MS = 150 // 9 adım — batış girişi (kırpma + SALLANMA): 8 kare ≈ 1,2 sn.
// (Eskiden 90 ms → 0,72 sn idi; sallanma "çok hızlı" göründüğü için yavaşlatıldı.)
const MOON_MS = 100 // 6 adım — ay geliş/gidiş; güneşten bir tık yavaş, daha sakin
const ZZZ_MS = 200 // 12 adım — uyku "z" süzülmesi: 21 kare ≈ 4,2 sn/tur.
// (Eskiden 130 ms → 2,73 sn idi; "çok hızlı geçiyor" denince uykulu tempoya çekildi.)
const BLINK_MS = 66.67 // 4 adım — güneşin ara sıra göz kırpması
const BLINK_BEKLEME_MIN = 2600 // iki kırpma arası min bekleme (ms)
const BLINK_BEKLEME_MAX = 5200 // iki kırpma arası max bekleme (ms) — rastgelelik daha canlı hissettirir
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
    let braf = 0

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
      setGirisA: dilim(IM.batis, SUN_SET_GIRIS_A),
      setGirisB: dilim(IM.batis, SUN_SET_GIRIS_B),
      set: dilim(IM.batis, SUN_SET),
      moonIn: dilim(IM.gelis, MOON_IN),
      moonOut: dilim(IM.gelis, MOON_OUT),
      blink: dilim(IM.dogus, SUN_BLINK),
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
    const durdurBlink = () => { if (braf) cancelAnimationFrame(braf); braf = 0 }

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
      // kitapSaati: durdur düğmesi geçiş animasyonunu dondurur
      const t0 = kitapSaati(performance.now())
      yaz(liste[0])
      const tik = (rafNow) => {
        if (iptal) { raf = 0; return }
        const idx = Math.floor((kitapSaati(rafNow) - t0) / ms)
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
      const t0 = kitapSaati(performance.now())
      const tik = (rafNow) => {
        if (iptal) { zraf = 0; return }
        zyaz(z[Math.floor((kitapSaati(rafNow) - t0) / ZZZ_MS) % z.length])
        zraf = requestAnimationFrame(tik)
      }
      zraf = requestAnimationFrame(tik)
    }

    // Güneş dinlenirken ara sıra göz kırpar: rastgele bekleme + SEG.blink oynatımı,
    // bitince kendini yeniden zamanlar. Durum gunesBekle'den çıkınca (bekle tik'i
    // her karede durumRef kontrol eder) kendiliğinden durur.
    const blinkDongusu = () => {
      durdurBlink()
      if (azaltRef.current || !SEG.blink.length) return // hareket azalt: kırpma yok
      const bekleme = BLINK_BEKLEME_MIN + Math.random() * (BLINK_BEKLEME_MAX - BLINK_BEKLEME_MIN)
      const t0 = kitapSaati(performance.now())
      const bekle = (rafNow) => {
        if (iptal || durumRef.current !== 'gunesBekle') { braf = 0; return }
        if (kitapSaati(rafNow) - t0 >= bekleme) {
          braf = 0
          oynat(SEG.blink, BLINK_MS, () => { if (!iptal && durumRef.current === 'gunesBekle') blinkDongusu() })
          return
        }
        braf = requestAnimationFrame(bekle)
      }
      braf = requestAnimationFrame(bekle)
    }

    // Durum geçiş tablosu
    const git = (yeni) => {
      durumRef.current = yeni
      setDurum(yeni)
      if (yeni === 'dogus') { setGece(false); oynat(SEG.rise, SUN_MS, () => git('gunesBekle')) }
      else if (yeni === 'gunesBekle') { yaz(SEG.sunRest); blinkDongusu() }
      else if (yeni === 'batis') {
        durdurBlink()
        // Giriş (kırpma+sallanma) yavaş, kayıp gitme normal tempoda.
        // Gece crossfade dokunuşta DEĞİL, sallanma karesine (04) gelince başlar.
        oynat(SEG.setGirisA, SUN_GIRIS_MS, () => {
          setGece(true)
          oynat(SEG.setGirisB, SUN_GIRIS_MS, () => oynat(SEG.set, SUN_MS, () => git('ayGelis')))
        })
      }
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
    const dec = (im) => (im?.decode ? im.decode().catch(() => { }) : Promise.resolve())
    Promise.allSettled([SEG.sunRest].map(dec)).then(() => { if (!iptal) git('gunesBekle') })
    Promise.allSettled([...IM.dogus, ...IM.batis, ...IM.gelis, ...IM.zzz].map(dec))

    return () => { iptal = true; durdur(); durdurZ(); durdurBlink(); apiRef.current = null }
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
