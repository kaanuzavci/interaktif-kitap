import { useEffect, useRef } from 'react'
import { Howl } from 'howler'
import { SAYFA_CEVIRME_SESI } from '../audio/karmaSesleri.js'

/* ===============================================================
   useSayfaSesi — sayfa çevirme sesi (Howler.js)

   Her sayfa çevrildiğinde kâğıt/kitap sesi çalar. Ses global ses
   ayarına bağlıdır (Howler.mute() App'te yönetiliyor; kapalıyken
   bu ses de çalmaz çünkü Howler tüm sesleri birden susturur).

   SES DOSYASI: sounds/karma/"sayfa çevirme sesi.mpeg" (karmaSesleri
   bulur). Dosya yoksa SAYFA_CEVIRME_SESI null döner ve ses sessizce
   atlanır — derleme KIRILMAZ.

   GECİKME DÜZELTMESİ: dosyanın başında ~0.86 sn SESSİZLİK var
   (ffmpeg silencedetect: ses 0.865–1.585 sn arasında). Baştan çalınca
   "geriden geliyor" hissi veriyordu; sprite ile sessizlik atlanır →
   ses tam çevirme anında duyulur.
=============================================================== */

// Sessizliği atlayan dilim: 850 ms'den başla, 780 ms çal.
const CEVIR_DILIM = { cevir: [850, 780] }

export function useSayfaSesi() {
  const howlRef = useRef(null)

  // Howl nesnesini bir kez kur (dosya varsa)
  useEffect(() => {
    if (!SAYFA_CEVIRME_SESI) return
    howlRef.current = new Howl({
      src: [SAYFA_CEVIRME_SESI],
      format: ['mpeg'],
      volume: 0.6,
      preload: true,
      sprite: CEVIR_DILIM,
    })
    return () => {
      howlRef.current?.unload()
      howlRef.current = null
    }
  }, [])

  // Sayfa çevrilince çağrılır. Ses yoksa hiçbir şey yapmaz.
  const calSayfaSesi = () => {
    howlRef.current?.play('cevir')
  }

  return calSayfaSesi
}

export default useSayfaSesi
