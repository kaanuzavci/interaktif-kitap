import { useEffect, useRef } from 'react'

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

/* Her pozun ekranda kalma süresi (ms) - VARSAYILAN (SevgiSahne1 override eder). */
const FRAME_SURESI_MS = 150

/**
 * IsilYurume: Işıl'ın yürüme animasyonu (sprite animasyon).
 *
 * NEDEN requestAnimationFrame + imperatif <img>?
 *  Eski sürüm setInterval + React state kullanıyordu. Işıl yürürken
 *  (CSS konum geçişi + sık yeniden render + ağır layout) React, kare
 *  state güncellemelerini erteleyebiliyor; CSS konumu bağımsız
 *  ilerlediği için karakter "kayarak" gidiyor ama kare donuyordu
 *  (F5'e kadar düzelmiyordu).
 *
 *  Bu sürümde animasyon React render döngüsünden TAMAMEN bağımsız:
 *   - Tek bir rAF döngüsü component yaşadığı sürece çalışır; üst
 *     bileşen ne kadar yeniden render olursa olsun ASLA teardown olmaz.
 *   - Kare doğrudan <img>'in src'sine (ref ile) yazılır → React
 *     reconcile'ı kareyi sıfırlayamaz, ertelenemez.
 *   - İlerleme GERÇEK geçen süreye göre (drift yok, kendini düzeltir).
 *   - isPlaying / frameSuresiMs ref ile okunur → döngü prop değişince
 *     yeniden kurulmaz (eski hatanın kök nedeni buydu).
 *
 * Props:
 *  - width        : karakter genişliği (örn. 200, "18vw", "100%")
 *  - style        : ek stil (parent'tan)
 *  - isPlaying    : true -> yürüme oynar, false -> ilk karede (duruş) durur
 *  - frameSuresiMs: bir pozun süresi (adım temposu)
 */
function IsilYurume({
  width = 200,
  style = {},
  isPlaying = false,
  frameSuresiMs = FRAME_SURESI_MS,
}) {
  const imgRef = useRef(null)
  // Prop'ları ref'te tutuyoruz ki rAF döngüsü onları güncel okusun
  // ama prop değişince effect yeniden KURULMASIN (döngü hiç ölmesin).
  const playingRef = useRef(isPlaying)
  const sureRef = useRef(frameSuresiMs)
  playingRef.current = isPlaying
  sureRef.current = frameSuresiMs

  // Frame'leri tarayıcı önbelleğine al (ilk turda titreme olmasın)
  useEffect(() => {
    frames.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [])

  // Tek seferlik rAF döngüsü — component yaşadığı sürece çalışır
  useEffect(() => {
    if (frames.length === 0) return

    let rafId
    let sonZaman // son kare değişim zamanı
    let idx = 0

    // Başlangıç karesi (duruş pozu) — imperatif
    if (imgRef.current) imgRef.current.src = frames[0]

    const tik = (zaman) => {
      rafId = requestAnimationFrame(tik)

      // Duruyorsa: ilk karede (duruş pozu) bekle
      if (!playingRef.current) {
        if (idx !== 0) {
          idx = 0
          if (imgRef.current) imgRef.current.src = frames[0]
        }
        sonZaman = zaman
        return
      }

      if (sonZaman === undefined) sonZaman = zaman
      // Yeterince süre geçtiyse bir sonraki kareye geç (gerçek süreye göre)
      if (zaman - sonZaman >= sureRef.current) {
        sonZaman = zaman
        idx = (idx + 1) % frames.length
        if (imgRef.current) imgRef.current.src = frames[idx]
      }
    }

    rafId = requestAnimationFrame(tik)
    return () => cancelAnimationFrame(rafId)
  }, [])

  if (frames.length === 0) return null

  // DİKKAT: src JSX'te VERİLMEZ; rAF döngüsü imperatif olarak yazar.
  // (src'yi JSX'e koyarsak React her render'da onu sıfırlar ve
  //  imperatif güncellemeyle çakışır.)
  return (
    <img
      ref={imgRef}
      alt="Işıl"
      draggable={false}
      style={{ width, ...style }}
      className="pointer-events-none select-none"
    />
  )
}

export default IsilYurume
