import { useEffect, useRef, useState } from 'react'

/* ===============================================================
   TIKLAMALI SPRITE — tam-kare (1920x1080) bir kare dizisini sahneye
   ölçekleyip konumlandırarak gösteren, tıklayınca oynayan katman.

   Tavşan (kütük) ve uğurböceği gibi varlıklar için kullanılır.
   Karelerin öznesi (kütük/uğurböceği) kendi karesinde belli bir
   yerde duruyor; biz tüm kareyi AYNI transform ile (ölçek + kaydırma)
   sahnedeki doğru yere oturtuyoruz. Tüm kareler aynı transform'u
   paylaştığı için animasyon kaymaz.

   - frames        : sıralı kare url'leri (tam-kare png'ler)
   - olcek/x/y      : yerleştirme transform'u (ölçek, sol/üst kaydırma %)
                      kare bir noktası (px%,py%) -> (x + olcek*px, y + olcek*py)
   - frameSuresiMs  : kare temposu
   - tekrar         : tıklayınca diziyi kaç kez oynatsın (sonra 1. kareye döner)
   - hotspot        : {left,top,width,height} (% ) -> tıklanabilir alan
   - etiket         : erişilebilirlik etiketi
   - canli          : false ise etkileşim yok, dinlenme karesi (sayfa çevirme
                      sırasındaki donuk kopya için)
   - zIndex         : katman sırası (varsayılan 10)
=============================================================== */
function TiklamaliSprite({
  frames,
  olcek = 1,
  x = 0,
  y = 0,
  frameSuresiMs = 90,
  tekrar = 1,
  hotspot,
  etiket = 'Dokun',
  canli = true,
  zIndex = 10,
}) {
  const [frameIndex, setFrameIndex] = useState(0)
  const [oynat, setOynat] = useState(false)
  const turRef = useRef(0) // tamamlanan tur sayısı

  // Kareleri önceden tarayıcı önbelleğine al (ilk oynatma titremesin)
  useEffect(() => {
    frames.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [frames])

  // Oynatma döngüsü: son kareye gelince ya yeni tura başla ya da dur
  useEffect(() => {
    if (!oynat) return
    const id = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length) {
          turRef.current += 1
          if (turRef.current >= tekrar) {
            clearInterval(id)
            setOynat(false)
            turRef.current = 0
            return 0 // dinlenme karesi (1. kare)
          }
          return 0 // sonraki tura baştan
        }
        return prev + 1
      })
    }, frameSuresiMs)
    return () => clearInterval(id)
  }, [oynat, frames, frameSuresiMs, tekrar])

  const tikla = () => {
    if (!canli || oynat) return
    turRef.current = 0
    setFrameIndex(0)
    setOynat(true)
  }

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
