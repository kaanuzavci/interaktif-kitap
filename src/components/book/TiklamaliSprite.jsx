import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TiklamaKayitContext } from './tiklamaKayit.js'
import { opakMerkez, noktaDolu } from './alfaHarita.js'
import DokunIpucu from './DokunIpucu.jsx'
import Parilti, { PARILTI_SURE_MS } from './Parilti.jsx'

/* ===============================================================
   TIKLAMALI SPRITE — tam-kare bir kare dizisini sahneye ölçekleyip
   konumlandıran, tıklayınca SÜREKLİ oynayan katman (kütük, uğurböceği).

   DAVRANIŞ:
   - İlk dokunuşa kadar animasyon oynamaz (dinlenme karesinde durur) ve
     üstünde "dokun" ipucu (nabız atan daireler) görünür.
   - Bir kez dokununca animasyon DÖNGÜYE girer: bir tur oynar, kısa bir
     süre dinlenir (donguArasiMs), tekrar oynar… (tekrar dokunmaya gerek
     yok, ipucu daireleri kaybolur).

   GİZLİ BAŞLAT (gizliBaslat):
   - true ise sprite AÇILIŞTA GÖRÜNMEZ (yalnızca dokun halkası durur);
     ilk dokunuşta yumuşakça belirir VE döngüye girer. Tıklama yine alfa
     testiyle (dinlenme karesinin silüeti) çalışır — görünmez olması
     yalnızca opaklıktır, kutu ve alfa haritası yerinde durur.

   PİKSEL-HASSAS TIKLAMA:
   - Dikdörtgen hotspot YOK. Tıklama, sprite'ın O AN GÖSTERİLEN karesinin
     ALFA kanalına göre test edilir (BookReader yönetir). Yalnızca görünen
     (saydam olmayan) pikseller tıklanabilir; etrafı/altı değil.
   - Alfa mantığı paylaşımlı alfaHarita.js'tendir (TiklanirGorsel ile aynı).

   SAĞLAMLIK: Kare animasyonu React render döngüsünden bağımsız tek bir
   rAF döngüsüdür; gerçek geçen süreye göre (modulo toplam) kare seçer.

   Props: frames, olcek, x, y, frameSuresiMs, bekleKare, beklemeSuresiMs,
          donguArasiMs, canli, zIndex, gizliBaslat
=============================================================== */

function TiklamaliSprite({
  frames,
  olcek = 1,
  x = 0,
  y = 0,
  frameSuresiMs = 90,
  bekleKare = null,
  beklemeSuresiMs = 0,
  donguArasiMs = 0,
  canli = true,
  zIndex = 10,
  gizliBaslat = false,
  ilkDokunusKaresi = 0, // ilk dokunuşta bu kareden başla (indeks); sonraki turlar normal
  ipucuYuzde = null, // {x,y} sahne %'si — verilirse "dokun" ipucu opak merkez
  // yerine TAM bu noktada durur (ör. uzun saplı saksılı çiçekte yüzün üstü)
}) {
  const imgRef = useRef(null)
  const imgObjRef = useRef([]) // alfa testi için Image nesneleri
  const aktifKareRef = useRef(0) // o an gösterilen kare indeksi
  const oynatRef = useRef(false) // döngü açık mı?
  const baslangicRef = useRef(0) // döngü başlangıç zamanı (ms)
  const rafRef = useRef(0)
  const canliRef = useRef(canli)
  canliRef.current = canli

  const [oynadi, setOynadi] = useState(false) // ipucunu gizlemek için
  const [parilti, setParilti] = useState(false) // ilk dokunuş yıldız patlaması
  const [merkez, setMerkez] = useState(null) // {cx,cy} frame0 opak merkezi (0..1)

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('sprite'))

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
    // İlk dokunuş parıltısı (yıldızlar) — öğe "parıltıyla gelmiş" gibi olur
    setParilti(true)
    setTimeout(() => setParilti(false), PARILTI_SURE_MS)
    // İlk dokunuşta istenen kareden başla: zaman çizelgesini o karenin
    // başlangıç anına ofsetleyerek ilk gösterilen kare ilkDokunusKaresi olur.
    // Sonraki turlar modulo döngü ile normal (kare 0'dan) oynar.
    const simdi = performance.now()
    if (ilkDokunusKaresi > 0 && dongu.seg.length > ilkDokunusKaresi) {
      // İlk N karenin toplam süresini hesapla → zamanı o kadar geri al
      const ofset = ilkDokunusKaresi > 0 ? dongu.seg[ilkDokunusKaresi - 1].until : 0
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

  // gizliBaslat: ilk dokunuşa (oynadi) kadar görünmez; sonra yumuşakça belir.
  const gorunur = !gizliBaslat || oynadi

  // Dinlenme karesinin opak merkezi → ipucu dairesinin sahne-% konumu.
  // Kutu sahnede: sol=x%, üst=y%, genişlik/yükseklik = 100*olcek% olduğundan
  // merkez = x + cx*100*olcek (yatay), y + cy*100*olcek (dikey).
  const ipucuStili =
    (ipucuYuzde || merkez) && {
      left: ipucuYuzde ? `${ipucuYuzde.x}%` : `${x + merkez.cx * 100 * olcek}%`,
      top: ipucuYuzde ? `${ipucuYuzde.y}%` : `${y + merkez.cy * 100 * olcek}%`,
      zIndex: zIndex + 3,
    }

  return (
    <>
      {/* Kare görseli — src JSX'te VERİLMEZ; rAF imperatif yazar. */}
      <img
        ref={imgRef}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{
          zIndex,
          transformOrigin: 'top left',
          transform: `translate(${x}%, ${y}%) scale(${olcek})`,
          opacity: gorunur ? 1 : 0,
          transition: 'opacity 360ms ease',
        }}
      />

      {/* DOKUN İPUCU — ilk dokunuşa kadar nesnenin üstünde nabız atan daireler */}
      {canli && !oynadi && ipucuStili && <DokunIpucu style={ipucuStili} />}

      {/* İLK DOKUNUŞ PARILTISI — aynı noktada yıldızlar saçılır (tek seferlik) */}
      {canli && parilti && ipucuStili && (
        <Parilti style={{ ...ipucuStili, zIndex: zIndex + 4 }} />
      )}
    </>
  )
}

export default TiklamaliSprite
