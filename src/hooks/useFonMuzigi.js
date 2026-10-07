import { useEffect, useRef } from 'react'
import { Howl } from 'howler'
import { FON_MUZIGI } from '../audio/karmaSesleri.js'
import { kitapDuraklatMi } from './kitapDuraklat.js'

/* ===============================================================
   useFonMuzigi — FON MÜZİĞİ (anlatımın arkasında sürekli döngü)

   Kitap açıkken düşük ses seviyesinde SÜREKLİ döngüde çalar; anlatıcı ve
   konuşma seslerinin (volume ~0.9) ARKASINDA kalır, onları bastırmaz.

   Kontroller:
   - `acik`        : müzik anahtarı (App'teki `muzik`) VE kitabın açık olması.
                     false olunca müzik hiç çalmaz / durur.
   - `duraklatildi`: DURDUR düğmesi — müziği de duraklatır/sürdürür.
   - Global mute   : SoundToggle → Howler.mute() TÜM sesleri birden susturur,
                     dolayısıyla ses kapalıyken bu müzik de duyulmaz.
=============================================================== */

// Anlatımı bastırmayacak kadar kısık fon seviyesi (istek üzerine yine kısıldı).
const FON_SES = 0.05

export function useFonMuzigi(acik, duraklatildi) {
  const howlRef = useRef(null)

  // Kitap açık + müzik anahtarı açıkken müziği kur ve döngüde başlat.
  useEffect(() => {
    if (!FON_MUZIGI || !acik) return
    const h = new Howl({
      src: [FON_MUZIGI],
      format: ['mpeg'],
      loop: true,
      volume: FON_SES,
    })
    howlRef.current = h
    // Duraklatılmış girildiyse başlatma (aşağıdaki duraklat effect'i sürdürür).
    if (!kitapDuraklatMi()) h.play()
    return () => {
      h.stop()
      h.unload()
      howlRef.current = null
    }
  }, [acik])

  // DURDUR / DEVAM — müziği olduğu yerden duraklat/sürdür.
  useEffect(() => {
    const h = howlRef.current
    if (!h) return
    if (duraklatildi) {
      if (h.playing()) h.pause()
    } else if (!h.playing()) {
      h.play()
    }
  }, [duraklatildi])
}

export default useFonMuzigi
