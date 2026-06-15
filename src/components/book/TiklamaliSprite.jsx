import { useEffect, useMemo, useRef } from 'react'

/* ===============================================================
   TIKLAMALI SPRITE — tam-kare bir kare dizisini sahneye ölçekleyip
   konumlandıran, tıklayınca oynayan katman (tavşan/kütük, uğurböceği).

   SAĞLAMLIK (önceki donma/takılma hatalarının kökten çözümü):
   - Kare animasyonu React render döngüsünden ve setInterval/setTimeout'tan
     TAMAMEN bağımsız. Tek bir requestAnimationFrame döngüsü, GERÇEK geçen
     süreye göre hangi karede olunması gerektiğini hesaplar (zaman çizelgesi).
   - Kare doğrudan <img>.src'ye (ref ile) yazılır → React erteleyemez/sıfırlayamaz.
   - Her TIKLAMA animasyonu BAŞTAN başlatır (baslangic = şimdi). Önceki oynatma
     yarım/takılı kalsa bile tıklayınca temiz başlar → ASLA kalıcı takılma olmaz.
   - Sekmeye geri dönülünce (visibilitychange) döngü kendini toparlar.
   - setInterval/setTimeout YOK → arka plan sekmesinde kısılıp takılı kalma yok.

   bekleKare/beklemeSuresiMs: tavşanın "çık → bekle → geri gir" duraklaması
   zaman çizelgesine süre eklenerek modellenir (yine elapsed-time, takılmaz).

   Props: frames, olcek, x, y, frameSuresiMs, tekrar, bekleKare,
          beklemeSuresiMs, hotspot, etiket, canli, zIndex
=============================================================== */
function TiklamaliSprite({
  frames,
  olcek = 1,
  x = 0,
  y = 0,
  frameSuresiMs = 90,
  tekrar = 1,
  bekleKare = null,
  beklemeSuresiMs = 0,
  hotspot,
  etiket = 'Dokun',
  canli = true,
  zIndex = 10,
}) {
  const imgRef = useRef(null)
  const baslangicRef = useRef(null) // oynatma başlangıç zamanı (ms); null = dinlenme
  const rafRef = useRef(0)
  const canliRef = useRef(canli)
  canliRef.current = canli

  // Zaman çizelgesi: kümülatif {frame, until} segmentleri + toplam süre.
  // `tekrar` kez tüm kareler oynar; bekleKare'de beklemeSuresiMs eklenir.
  const cizelge = useMemo(() => {
    if (!frames.length) return { seg: [], total: 0 }
    const seg = []
    let t = 0
    for (let tur = 0; tur < tekrar; tur++) {
      for (let f = 0; f < frames.length; f++) {
        let dur = frameSuresiMs
        if (bekleKare !== null && f === bekleKare && beklemeSuresiMs > 0) dur += beklemeSuresiMs
        t += dur
        seg.push({ frame: f, until: t })
      }
    }
    return { seg, total: t }
  }, [frames.length, frameSuresiMs, tekrar, bekleKare, beklemeSuresiMs])

  // Kareleri önceden tarayıcı önbelleğine al
  useEffect(() => {
    frames.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [frames])

  // Başlangıçta dinlenme karesi + unmount temizliği
  useEffect(() => {
    if (imgRef.current && frames.length) imgRef.current.src = frames[0]
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [frames])

  // rAF döngüsü — yalnızca oynarken çalışır, bitince temiz durur
  const tik = (zaman) => {
    const baslangic = baslangicRef.current
    if (baslangic === null || cizelge.seg.length === 0) {
      rafRef.current = 0
      return
    }
    const gecen = zaman - baslangic
    if (gecen >= cizelge.total) {
      // Bitti → dinlenme karesi, döngüyü durdur
      baslangicRef.current = null
      rafRef.current = 0
      if (imgRef.current) imgRef.current.src = frames[0]
      return
    }
    // Geçen süreye düşen kareyi bul
    let f = frames.length - 1
    for (let k = 0; k < cizelge.seg.length; k++) {
      if (gecen < cizelge.seg[k].until) {
        f = cizelge.seg[k].frame
        break
      }
    }
    if (imgRef.current) imgRef.current.src = frames[f]
    rafRef.current = requestAnimationFrame(tik)
  }

  // HER tıklama animasyonu baştan başlatır → asla takılı kalmaz
  const tikla = () => {
    if (!canliRef.current || frames.length === 0) return
    baslangicRef.current = performance.now()
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tik)
  }

  // Sekmeye dönülünce: oynuyor olması gerekirken döngü durmuşsa yeniden başlat
  useEffect(() => {
    const gorunur = () => {
      if (
        document.visibilityState === 'visible' &&
        baslangicRef.current !== null &&
        !rafRef.current
      ) {
        rafRef.current = requestAnimationFrame(tik)
      }
    }
    document.addEventListener('visibilitychange', gorunur)
    return () => document.removeEventListener('visibilitychange', gorunur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (frames.length === 0) return null

  // src JSX'te VERİLMEZ; rAF döngüsü imperatif yazar (React sıfırlamasın).
  // style (transform) JSX'te kalır ki ?ayar paneli canlı güncelleyebilsin.
  return (
    <>
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
      {canli && hotspot && (
        <button
          type="button"
          aria-label={etiket}
          onClick={tikla}
          className="absolute cursor-pointer rounded-2xl"
          style={{
            zIndex: zIndex + 1,
            left: hotspot.left,
            top: hotspot.top,
            width: hotspot.width,
            height: hotspot.height,
          }}
        />
      )}
    </>
  )
}

export default TiklamaliSprite
