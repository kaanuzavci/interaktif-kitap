import { useEffect, useRef } from 'react'
import { Howl } from 'howler'

/* ===============================================================
   useSayfaSesi — sayfa çevirme sesi (Howler.js)

   Her sayfa çevrildiğinde kâğıt/kitap sesi çalar. Ses global ses
   ayarına bağlıdır (Howler.mute() App'te yönetiliyor; kapalıyken
   bu ses de çalmaz çünkü Howler tüm sesleri birden susturur).

   SES DOSYASI: src/assets/sounds/sayfa-cevir.mp3 (henüz EKLENMEDİ).
   Dosya eklenince kod otomatik bulur. Dosya yoksa import.meta.glob
   boş döner ve ses sessizce atlanır — derleme KIRILMAZ.
   (Statik "import ...mp3" yazsaydık dosya yokken build patlardı.)
=============================================================== */

// sayfa-cevir.* (mp3/ogg/wav) dosyasını ara — varsa url'ini al.
const sesModulleri = import.meta.glob(
  '../assets/sounds/sayfa-cevir.{mp3,ogg,wav}',
  { eager: true, import: 'default' },
)
const sesUrl = Object.values(sesModulleri)[0] || null

export function useSayfaSesi() {
  const howlRef = useRef(null)

  // Howl nesnesini bir kez kur (dosya varsa)
  useEffect(() => {
    if (!sesUrl) return
    howlRef.current = new Howl({ src: [sesUrl], volume: 0.6, preload: true })
    return () => {
      howlRef.current?.unload()
      howlRef.current = null
    }
  }, [])

  // Sayfa çevrilince çağrılır. Ses yoksa hiçbir şey yapmaz.
  const calSayfaSesi = () => {
    howlRef.current?.play()
  }

  return calSayfaSesi
}

export default useSayfaSesi
