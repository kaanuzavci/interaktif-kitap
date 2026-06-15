import { useCallback, useEffect, useRef, useState } from 'react'

/* ===============================================================
   TIKLAMALI SPRITE — tam-kare (1920x1080) bir kare dizisini sahneye
   ölçekleyip konumlandırarak gösteren, tıklayınca oynayan katman.

   Tavşan (kütük) ve uğurböceği gibi varlıklar için kullanılır.

   YENİ: beklemeSuresiMs + bekleKare
   Tavşan gibi "çık → dur → geri gir" istenen animasyonlar için:
   belirtilen kareye (bekleKare) gelince animasyon duraklar,
   beklemeSuresiMs kadar bekler, sonra devam eder.

   - frames         : sıralı kare url'leri (tam-kare png'ler)
   - olcek/x/y      : yerleştirme transform'u (ölçek, sol/üst kaydırma %)
   - frameSuresiMs   : kare temposu
   - tekrar          : tıklayınca diziyi kaç kez oynatsın
   - bekleKare       : bu kareye gelince dur (null = durma)
   - beklemeSuresiMs  : bekleKare'de ne kadar dur (ms)
   - hotspot         : {left,top,width,height} (%) -> tıklanabilir alan
   - etiket          : erişilebilirlik etiketi
   - canli           : false ise etkileşim yok
   - zIndex          : katman sırası (varsayılan 10)
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
  const [frameIndex, setFrameIndex] = useState(0)
  const [oynat, setOynat] = useState(false)

  // Ref'ler ile interval/timeout yönetimi — state bağımsız, temiz temizlik
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const turRef = useRef(0)
  const frameRef = useRef(0) // interval içinden güncel frame'e erişim

  // Kareleri önceden tarayıcı önbelleğine al
  useEffect(() => {
    frames.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [frames])

  // Tüm zamanlayıcıları temizle
  const temizle = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Oynatma döngüsünü başlat
  const donguyuBaslat = useCallback(() => {
    temizle()

    intervalRef.current = setInterval(() => {
      const sonraki = frameRef.current + 1

      // Dizinin sonuna geldik — tur tamamla veya yeniden başla
      if (sonraki >= frames.length) {
        turRef.current += 1
        if (turRef.current >= tekrar) {
          temizle()
          frameRef.current = 0
          setFrameIndex(0)
          setOynat(false)
          turRef.current = 0
          return
        }
        // Sonraki tur
        frameRef.current = 0
        setFrameIndex(0)
        return
      }

      // Bekleme karesi kontrolü
      if (bekleKare !== null && sonraki === bekleKare && beklemeSuresiMs > 0) {
        frameRef.current = sonraki
        setFrameIndex(sonraki)
        // Interval'i durdur, bekle, sonra devam et
        clearInterval(intervalRef.current)
        intervalRef.current = null
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null
          donguyuBaslat()
        }, beklemeSuresiMs)
        return
      }

      frameRef.current = sonraki
      setFrameIndex(sonraki)
    }, frameSuresiMs)
  }, [frames.length, frameSuresiMs, tekrar, bekleKare, beklemeSuresiMs, temizle])

  // oynat state'i değiştiğinde döngüyü kontrol et
  useEffect(() => {
    if (oynat) {
      donguyuBaslat()
    }
    return temizle
  }, [oynat, donguyuBaslat, temizle])

  // Component unmount'ta temizle
  useEffect(() => temizle, [temizle])

  const tikla = useCallback(() => {
    if (!canli || oynat) return // oynuyorsa yoksay, başa sarma
    turRef.current = 0
    frameRef.current = 0
    setFrameIndex(0)
    setOynat(true)
  }, [canli, oynat])

  if (!frames.length) return null

  return (
    <>
      {/* Görsel katman — tam-bleed, transform ile sahneye oturtulur */}
      <img
        src={frames[frameIndex]}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{
          zIndex,
          transformOrigin: 'top left',
          transform: `translate(${x}%, ${y}%) scale(${olcek})`,
        }}
      />
      {/* Tıklama alanı — özneyi kapsayan saydam buton (yalnızca canlı modda) */}
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
