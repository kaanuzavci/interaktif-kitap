import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TiklamaKayitContext } from './tiklamaKayit.js'

/* ===============================================================
   TIKLAMALI SPRITE — tam-kare bir kare dizisini sahneye ölçekleyip
   konumlandıran, tıklayınca SÜREKLİ oynayan katman (kütük, uğurböceği).

   DAVRANIŞ:
   - İlk dokunuşa kadar animasyon oynamaz (dinlenme karesinde durur) ve
     üstünde "dokun" ipucu (nabız atan daireler) görünür.
   - Bir kez dokununca animasyon DÖNGÜYE girer: bir tur oynar, kısa bir
     süre dinlenir (donguArasiMs), tekrar oynar… (tekrar dokunmaya gerek
     yok, ipucu daireleri kaybolur).

   PİKSEL-HASSAS TIKLAMA:
   - Dikdörtgen hotspot YOK. Tıklama, sprite'ın O AN GÖSTERİLEN karesinin
     ALFA kanalına göre test edilir (BookReader yönetir). Yalnızca görünen
     (saydam olmayan) pikseller tıklanabilir; etrafı/altı değil.
   - Ölçüm oransal (getBoundingClientRect + alfa haritası) olduğundan her
     ekran boyutunda (telefon/tablet) birebir doğrudur.

   SAĞLAMLIK: Kare animasyonu React render döngüsünden bağımsız tek bir
   rAF döngüsüdür; gerçek geçen süreye göre (modulo toplam) kare seçer.

   Props: frames, olcek, x, y, frameSuresiMs, bekleKare, beklemeSuresiMs,
          donguArasiMs, canli, zIndex
=============================================================== */

// Alfa haritası çözünürlüğü (px). Doğal kare 960px.
const HIT_GENISLIK = 240
// Bu alfa değerinin (0-255) üstü "dolu/görünen" piksel sayılır (yumuşak
// kenarları dışarıda bırakacak kadar yüksek → daha keskin silüet).
const ALFA_ESIK = 40
// Çok küçük dokunma toleransı (yaklaşık px) — yalnızca anti-alias/keskinlik
// payı; nesnenin dışına taşmayı önler.
const DOKUNMA_TOLERANS_PX = 4

// --- Alfa haritası + opak sınır (bbox) önbelleği (kare URL'sine göre) ---
const alfaCache = new Map()
let paylasilanCanvas = null
let paylasilanCtx = null

function alfaHaritasiAl(im) {
  if (!im || !im.complete || !im.naturalWidth) return null
  const onbellek = alfaCache.get(im.src)
  if (onbellek) return onbellek
  if (!paylasilanCanvas) {
    paylasilanCanvas = document.createElement('canvas')
    paylasilanCtx = paylasilanCanvas.getContext('2d', { willReadFrequently: true })
  }
  const olcek = HIT_GENISLIK / im.naturalWidth
  const w = HIT_GENISLIK
  const h = Math.max(1, Math.round(im.naturalHeight * olcek))
  paylasilanCanvas.width = w
  paylasilanCanvas.height = h
  paylasilanCtx.clearRect(0, 0, w, h)
  try {
    paylasilanCtx.drawImage(im, 0, 0, w, h)
    const data = paylasilanCtx.getImageData(0, 0, w, h).data
    // Opak piksellerin sınır kutusu (ipucu dairesini ortalamak için)
    let minx = w, miny = h, maxx = -1, maxy = -1
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        if (data[(yy * w + xx) * 4 + 3] > ALFA_ESIK) {
          if (xx < minx) minx = xx
          if (xx > maxx) maxx = xx
          if (yy < miny) miny = yy
          if (yy > maxy) maxy = yy
        }
      }
    }
    const bbox = maxx >= 0 ? { minx, miny, maxx, maxy } : null
    const harita = { w, h, data, bbox }
    alfaCache.set(im.src, harita)
    return harita
  } catch {
    return null
  }
}

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
      const h = alfaHaritasiAl(im0)
      if (h && h.bbox) {
        setMerkez({
          cx: (h.bbox.minx + h.bbox.maxx) / 2 / h.w,
          cy: (h.bbox.miny + h.bbox.maxy) / 2 / h.h,
        })
      }
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
    baslangicRef.current = performance.now()
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tik)
  }

  // Piksel-hassas isabet testi: ekran noktasını sprite'ın doğal pikseline
  // çevir, O AN gösterilen karenin alfasına bak (küçük tolerans ile).
  const noktaDolu = (cx, cy) => {
    const img = imgRef.current
    if (!img) return false
    const r = img.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return false
    const fx = (cx - r.left) / r.width
    const fy = (cy - r.top) / r.height
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return false
    const im = imgObjRef.current[aktifKareRef.current] || imgObjRef.current[0]
    const harita = alfaHaritasiAl(im)
    if (!harita) return true
    const { w, h, data } = harita
    const gx = Math.min(w - 1, Math.max(0, Math.round(fx * (w - 1))))
    const gy = Math.min(h - 1, Math.max(0, Math.round(fy * (h - 1))))
    const slop = Math.max(0, Math.round((DOKUNMA_TOLERANS_PX / r.width) * w))
    for (let dy = -slop; dy <= slop; dy++) {
      for (let dx = -slop; dx <= slop; dx++) {
        const px = gx + dx
        const py = gy + dy
        if (px < 0 || px >= w || py < 0 || py >= h) continue
        if (data[(py * w + px) * 4 + 3] > ALFA_ESIK) return true
      }
    }
    return false
  }

  // En güncel fonksiyonları ref'te tut (kayıt defteri stale closure yakalamasın)
  const fnRef = useRef({})
  fnRef.current.hitTest = noktaDolu
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

  // Dinlenme karesinin opak merkezi → ipucu dairesinin sahne-% konumu.
  // Kutu sahnede: sol=x%, üst=y%, genişlik/yükseklik = 100*olcek% olduğundan
  // merkez = x + cx*100*olcek (yatay), y + cy*100*olcek (dikey).
  const ipucuStili =
    merkez && {
      left: `${x + merkez.cx * 100 * olcek}%`,
      top: `${y + merkez.cy * 100 * olcek}%`,
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
        }}
      />

      {/* DOKUN İPUCU — ilk dokunuşa kadar nesnenin üstünde nabız atan daireler */}
      {canli && !oynadi && ipucuStili && (
        <div
          className="pointer-events-none absolute"
          style={{
            ...ipucuStili,
            width: '6cqw',
            height: '6cqw',
            transform: 'translate(-50%, -50%)',
            zIndex: zIndex + 3,
          }}
        >
          <span className="animate-dokun-ping absolute inset-0 rounded-full border-2 border-white" />
          <span
            className="animate-dokun-ping absolute inset-0 rounded-full border-2 border-gunes"
            style={{ animationDelay: '0.75s' }}
          />
          <span className="absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85 shadow" />
        </div>
      )}
    </>
  )
}

export default TiklamaliSprite
