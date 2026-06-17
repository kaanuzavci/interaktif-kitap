import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

/* ---------------------------------------------------------------
   FRAME'LERİ OTOMATİK YÜKLEME (import.meta.glob)
   Klasördeki tüm pozları sıralı bir url dizisine çevirir.
---------------------------------------------------------------- */
const frameModulleri = import.meta.glob(
  '../../assets/characters/isil-yurume/*.png',
  { eager: true, import: 'default' },
)
const frames = Object.keys(frameModulleri)
  .sort()
  .map((dosyaYolu) => frameModulleri[dosyaYolu])

export const ISIL_KARE_SAYISI = frames.length

/* Her pozun ekranda kalma süresi (ms) - VARSAYILAN. */
const FRAME_SURESI_MS = 150

/**
 * IsilYurume: Işıl'ın yürüme animasyonu (sprite animasyon).
 *
 * PERFORMANS (Chrome'da kare atlama / kayma sorununun kökten çözümü):
 *  - SRC DEĞİŞİMİ YOK: tüm kareler BİR KEZ <img> olarak basılır, üst üste
 *    bindirilir ve yalnızca `opacity` ile gösterilir/gizlenir. Böylece her
 *    karede decode/paint beklemesi olmaz; geçiş compositor'da (GPU) olur.
 *  - rAF + GERÇEK SÜRE (delta): hangi karede olunacağı geçen GERÇEK süreden
 *    hesaplanır (setInterval drift'i yok). CPU yoğun olsa/sekme arka plana
 *    geçse bile zamanla senkron kalır.
 *
 * İKİ KULLANIM:
 *  1) Kendi kendine (LoadingScreen): `isPlaying` ile YERİNDE yürür; bileşen
 *     kendi rAF döngüsünü çalıştırır.
 *  2) KONTROLLÜ (yürüyüş sahnesi): `kontrollu` verilirse iç döngü çalışmaz;
 *     üst bileşen TEK rAF döngüsünden ref ile `kareGoster(i)` çağırır
 *     (konum + kare aynı döngüde → asla kaymaz).
 *
 * Props:
 *  - width        : karakter genişliği (örn. 200, "18vw", "100%")
 *  - style        : ek stil (parent'tan)
 *  - isPlaying    : (kontrolsüz mod) true -> yürür, false -> duruş karesi
 *  - frameSuresiMs: bir pozun süresi (adım temposu)
 *  - kontrollu    : true -> iç döngü yok; kare dışarıdan ref ile yönetilir
 *
 * Imperative handle (ref):
 *  - kareGoster(i): i. kareyi göster (opacity)
 */
const IsilYurume = forwardRef(function IsilYurume(
  {
    width = 200,
    style = {},
    isPlaying = false,
    frameSuresiMs = FRAME_SURESI_MS,
    kontrollu = false,
  },
  ref,
) {
  const imgRefleri = useRef([]) // her karenin <img> elemanı
  const aktifRef = useRef(0) // o an görünen kare
  const rafRef = useRef(0)
  const playingRef = useRef(isPlaying)
  const sureRef = useRef(frameSuresiMs)
  playingRef.current = isPlaying
  sureRef.current = frameSuresiMs

  // Belirli kareyi göster — yalnızca iki <img>'in opacity'sini değiştir
  // (src'ye dokunmaz → decode yok; GPU compositor işi).
  const kareGoster = (i) => {
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

  useImperativeHandle(ref, () => ({ kareGoster }), [])

  // KONTROLSÜZ mod: kendi rAF döngüsü (delta/gerçek süre) ile yerinde yürü
  useEffect(() => {
    if (kontrollu || frames.length === 0) return
    let baslangic

    const tik = (now) => {
      rafRef.current = requestAnimationFrame(tik)
      if (!playingRef.current) {
        baslangic = now
        if (aktifRef.current !== 0) kareGoster(0)
        return
      }
      if (baslangic === undefined) baslangic = now
      const idx = Math.floor((now - baslangic) / sureRef.current) % frames.length
      kareGoster(idx)
    }
    rafRef.current = requestAnimationFrame(tik)

    // Sekmeye dönünce zamanı sıfırla (uzun süre arka planda kaldıysa
    // tek seferde sıçramasın; döngü zaten gerçek süreye göre toparlar).
    const gorunur = () => {
      if (document.visibilityState === 'visible') baslangic = undefined
    }
    document.addEventListener('visibilitychange', gorunur)

    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', gorunur)
    }
  }, [kontrollu])

  if (frames.length === 0) return null

  // Tüm kareler üst üste; ilk kare AKIŞTA (kapsayıcıya en-boy verir),
  // diğerleri absolute olarak tam üstüne biner. Sadece biri opak.
  return (
    <div
      style={{ width, position: 'relative', ...style }}
      className="pointer-events-none select-none"
    >
      {frames.map((src, i) => (
        <img
          key={i}
          ref={(el) => (imgRefleri.current[i] = el)}
          src={src}
          alt={i === 0 ? 'Işıl' : ''}
          draggable={false}
          decoding="async"
          fetchPriority={i === 0 ? 'high' : 'low'}
          style={{
            display: 'block',
            width: '100%',
            opacity: i === 0 ? 1 : 0,
            willChange: 'opacity',
            ...(i === 0 ? {} : { position: 'absolute', inset: 0, height: '100%' }),
          }}
        />
      ))}
    </div>
  )
})

export default IsilYurume
