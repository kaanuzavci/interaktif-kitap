import { useEffect, useRef } from 'react'
import { Howl } from 'howler'
import { useKitapDuraklat, kitapDuraklatMi } from './kitapDuraklat.js'

/* ===============================================================
   useOrtamSesi — sahneye özel ORTAM/EFEKT sesi (döngülü, kısık)

   Bir sahne CANLI olduğu sürece verilen sesi (ör. kuş cıvıltısı, ışıltı
   şıngırtısı) düşük ses seviyesinde döngüde çalar; sahne kapanınca (unmount)
   veya `aktif` false olunca susar. Sayfa-çevirme önizlemelerinde sahne
   canli=false çizildiğinden (aktif=false) ses çalmaz — yalnızca gerçek
   canlı sahnede duyulur.

   - `aktif`  : genelde sahnenin `canli` prop'u.
   - `tekrar` : >0 verilirse SONSUZ döngü yerine ses o kadar KEZ çalar,
                sonra susar (ör. sayfa-13 ısıltı: 3 kez). loop yok sayılır.
   - DURDUR   : useKitapDuraklat ile sesi de duraklatır/sürdürür.
   - Global mute (Howler.mute) tüm sesleri susturduğundan buna da uygulanır.
=============================================================== */

export function useOrtamSesi(url, aktif, { volume = 0.2, loop = true, tekrar = 0 } = {}) {
  const howlRef = useRef(null)
  // tekrar modunda tüm çalmalar tamamlandı mı? (DEVAM'da yeniden başlatmayalım)
  const bittiRef = useRef(false)
  const duraklatildi = useKitapDuraklat()

  // Sahne canlı + ses varken kur ve (duraklatılmış değilse) başlat.
  useEffect(() => {
    if (!url || !aktif) return
    bittiRef.current = false
    const h = new Howl({ src: [url], format: ['mpeg'], loop: tekrar > 0 ? false : loop, volume })
    if (tekrar > 0) {
      let calinan = 1 // ilk çalma aşağıda başlıyor
      h.on('end', () => {
        if (calinan < tekrar) { calinan += 1; h.play() }
        else bittiRef.current = true
      })
    }
    howlRef.current = h
    if (!kitapDuraklatMi()) h.play()
    return () => {
      h.stop()
      h.unload()
      howlRef.current = null
    }
    // volume/loop/tekrar sahne ömrü boyunca sabittir; sadece url/aktif izlenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, aktif])

  // DURDUR / DEVAM — tekrarları bitmiş sesi DEVAM yeniden başlatmaz.
  useEffect(() => {
    const h = howlRef.current
    if (!h) return
    if (duraklatildi) {
      if (h.playing()) h.pause()
    } else if (!h.playing() && !bittiRef.current) {
      h.play()
    }
  }, [duraklatildi])
}

export default useOrtamSesi
