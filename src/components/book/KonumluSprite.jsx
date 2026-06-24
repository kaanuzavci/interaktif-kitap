import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TiklamaKayitContext } from './tiklamaKayit.js'
import { opakMerkez, noktaDolu } from './alfaHarita.js'
import DokunIpucu from './DokunIpucu.jsx'
import Parilti, { PARILTI_SURE_MS } from './Parilti.jsx'

/* ===============================================================
   KONUMLU SPRITE — TiklamaliSprite gibi tıklayınca SÜREKLİ oynayan
   bir kare dizisi; FARKI: tam-16:9 tuvale gömülü değildir.

   TiklamaliSprite, tam-kare (16:9) bir tuvali sahneye STRETCH eder
   (h-full w-full) ve olcek/x/y ile kaydırır — kareler 16:9 olduğu için
   bozulma olmaz. Ama bu sahnedeki Işıl portresi DİKEY (2480x3508); onu
   16:9'a esnetmek yatay sıkıştırır. Bu bileşen bunun yerine TiklanirGorsel
   gibi sayfada left/top/width ile konumlanan, EN-BOY oranını KORUYAN tek
   bir <img>'dir (auto yükseklik) ve üstüne TiklamaliSprite'ın kanıtlanmış
   kare-döngü mantığını koyar.

   DAVRANIŞ (TiklamaliSprite ile birebir aynı his):
   - İlk dokunuşa kadar animasyon oynamaz (dinlenme karesinde durur) ve
     görselin opak merkezinde "dokun" ipucu (nabız atan daireler) durur.
   - Bir kez dokununca animasyon DÖNGÜYE girer; ipucu kaybolur, aynı
     noktada bir yıldız parıltısı patlar (tek seferlik).

   PİKSEL-HASSAS TIKLAMA: dikdörtgen hotspot yok; o an gösterilen karenin
   ALFA kanalına göre test edilir (alfaHarita.js + BookReader kaydı), tıpkı
   TiklamaliSprite/TiklanirGorsel gibi.

   Props: frames, left, top, width (sahne %'si), frameSuresiMs, bekleKare,
          beklemeSuresiMs, donguArasiMs, canli, zIndex, ilkDokunusKaresi
=============================================================== */
function KonumluSprite({
  frames,
  left = '0%',
  top = '0%',
  width = '20%',
  frameSuresiMs = 120,
  bekleKare = null,
  beklemeSuresiMs = 0,
  donguArasiMs = 0,
  canli = true,
  zIndex = 10,
  ilkDokunusKaresi = 0, // ilk dokunuşta bu kareden başla; sonraki turlar normal
}) {
  const imgRef = useRef(null) // görünen (konumlanmış) <img> — isabet kutusu
  const imgObjRef = useRef([]) // alfa testi için Image nesneleri
  const aktifKareRef = useRef(0) // o an gösterilen kare indeksi
  const oynatRef = useRef(false) // döngü açık mı?
  const baslangicRef = useRef(0) // döngü başlangıç zamanı (ms)
  const rafRef = useRef(0)
  const canliRef = useRef(canli)
  canliRef.current = canli

  // İLK src JSX'te verilir (auto-yükseklik <img> boyutu hemen oturur, boş
  // kare/zıplama olmaz). Sabit kabul edildiğinden React mount sonrası bir
  // daha YAZMAZ → rAF'ın imperatif src değişimleriyle çakışmaz.
  const [ilkSrc] = useState(() => frames[0])

  const [oynadi, setOynadi] = useState(false) // ipucunu gizlemek için
  const [parilti, setParilti] = useState(false) // ilk dokunuş yıldız patlaması
  const [merkez, setMerkez] = useState(null) // {cx,cy} frame0 opak merkezi (0..1)

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('konumlu-sprite'))

  // Zaman çizelgesi: bir tur kareler + (varsa) döngü-arası dinlenme (frame 0).
  const dongu = useMemo(() => {
    if (!frames.length) return { seg: [], total: 0 }
    const seg = []
    let t = 0
    for (let f = 0; f < frames.length; f++) {
      let dur = frameSuresiMs
      if (bekleKare !== null && f === bekleKare && beklemeSuresiMs > 0) dur += beklemeSuresiMs
      t += dur
      seg.push({ frame: f, until: t })
    }
    if (donguArasiMs > 0) {
      t += donguArasiMs
      seg.push({ frame: 0, until: t }) // döngüler arası: dinlenme karesinde bekle
    }
    return { seg, total: t }
  }, [frames.length, frameSuresiMs, bekleKare, beklemeSuresiMs, donguArasiMs])

  // Kareleri önbelleğe al + alfa testi için Image nesneleri + ipucu merkezi
  useEffect(() => {
    imgObjRef.current = frames.map((url) => {
      const im = new Image()
      im.src = url
      return im
    })
    const im0 = imgObjRef.current[0]
    const merkeziHesapla = () => {
      const m = opakMerkez(im0)
      if (m) setMerkez(m)
    }
    if (im0 && im0.complete && im0.naturalWidth) merkeziHesapla()
    else if (im0) im0.onload = merkeziHesapla
  }, [frames])

  // Başlangıçta dinlenme karesi + unmount temizliği
  useEffect(() => {
    aktifKareRef.current = 0
    if (imgRef.current && frames.length) imgRef.current.src = frames[0]
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [frames])

  const kareYaz = (f) => {
    aktifKareRef.current = f
    if (imgRef.current) imgRef.current.src = frames[f]
  }

  // rAF döngüsü — yalnızca oynarken; SONSUZ (modulo toplam süre)
  const tik = (zaman) => {
    if (!oynatRef.current || dongu.total === 0) {
      rafRef.current = 0
      return
    }
    const gecen = (zaman - baslangicRef.current) % dongu.total
    let f = frames.length - 1
    for (let k = 0; k < dongu.seg.length; k++) {
      if (gecen < dongu.seg[k].until) {
        f = dongu.seg[k].frame
        break
      }
    }
    if (f !== aktifKareRef.current) kareYaz(f)
    rafRef.current = requestAnimationFrame(tik)
  }

  // İLK dokunuş döngüyü başlatır; sonrakiler yok sayılır
  const oynat = () => {
    if (!canliRef.current || frames.length === 0) return
    if (oynatRef.current) return
    oynatRef.current = true
    setOynadi(true)
    setParilti(true)
    setTimeout(() => setParilti(false), PARILTI_SURE_MS)
    // İlk dokunuşta istenen kareden başla: zaman çizelgesini o karenin
    // başlangıç anına ofsetle (TiklamaliSprite ile aynı).
    const simdi = performance.now()
    if (ilkDokunusKaresi > 0 && dongu.seg.length > ilkDokunusKaresi) {
      const ofset = dongu.seg[ilkDokunusKaresi - 1].until
      baslangicRef.current = simdi - ofset
    } else {
      baslangicRef.current = simdi
    }
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tik)
  }

  // En güncel fonksiyonları ref'te tut (kayıt defteri stale closure yakalamasın)
  const fnRef = useRef({})
  fnRef.current.hitTest = (cx, cy) =>
    noktaDolu(imgRef.current, imgObjRef.current[aktifKareRef.current] || imgObjRef.current[0], cx, cy)
  fnRef.current.oynat = oynat

  // Kayıt defterine yaz / sil
  useEffect(() => {
    if (!kayit) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex,
      hitTest: (x2, y2) => fnRef.current.hitTest(x2, y2),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, zIndex])

  // Sekmeye dönülünce: oynuyor olması gerekirken döngü durmuşsa yeniden başlat
  useEffect(() => {
    const gorunur = () => {
      if (document.visibilityState === 'visible' && oynatRef.current && !rafRef.current) {
        rafRef.current = requestAnimationFrame(tik)
      }
    }
    document.addEventListener('visibilitychange', gorunur)
    return () => document.removeEventListener('visibilitychange', gorunur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (frames.length === 0) return null

  return (
    // Konumlanan sarmalayıcı (sahne %'si). İçinde EN-BOY oranını koruyan
    // tek <img> (w-full → auto yükseklik). DokunIpucu/Parilti sarmalayıcıya
    // (yani görsel kutusuna) göre konumlanır.
    <div className="pointer-events-none absolute" style={{ left, top, width, zIndex }}>
      {/* Kare görseli — ilk src JSX'te; sonraki kareleri rAF imperatif yazar. */}
      <img
        ref={imgRef}
        src={ilkSrc}
        alt=""
        draggable={false}
        className="block w-full select-none"
      />

      {/* DOKUN İPUCU — ilk dokunuşa kadar görselin opak merkezinde nabız atar. */}
      {canli && !oynadi && merkez && (
        <DokunIpucu style={{ left: `${merkez.cx * 100}%`, top: `${merkez.cy * 100}%`, zIndex: zIndex + 3 }} />
      )}

      {/* İLK DOKUNUŞ PARILTISI — aynı noktada yıldızlar saçılır (tek seferlik) */}
      {canli && parilti && merkez && (
        <Parilti style={{ left: `${merkez.cx * 100}%`, top: `${merkez.cy * 100}%`, zIndex: zIndex + 4 }} />
      )}
    </div>
  )
}

export default KonumluSprite
