import { useEffect, useState } from 'react'

/* ===============================================================
   KİTAP DURAKLAT — okuma ekranındaki "durdur/devam" düğmesinin beyni

   Sol üstteki durdur düğmesi basılınca SAYFADAKİ HER ŞEY duraklar:
   - CSS animasyonları  : BookReader köküne eklenen `.kitap-duraklat`
                          sınıfı (index.css) play-state'i durdurur.
   - rAF sprite döngüleri: projedeki tüm kare-animasyon döngüleri zamanı
                          buradaki kitapSaati()'nden okur; saat durunca
                          kareler oldukları yerde DONAR, devam edince
                          SIÇRAMADAN kaldıkları yerden sürer.
   - (İleride) sesli okuma: aynı durumu useKitapDuraklat() ile dinleyip
                          anlatım sesini duraklatacak/sürdürecek.

   kitapSaati(now): rAF zaman damgasını "duraklatılabilir" sanal zamana
   çevirir. Duraklatma süresi bir ofsette birikir; böylece
   `sanalZaman = gerçekZaman - toplamDuraklama` hep monoton ve süreklidir.
=============================================================== */

let duraklatildi = false
let ofset = 0 // bugüne dek biriken toplam duraklatma süresi (ms)
let duraklamaBasi = null // aktif duraklatmanın başladığı gerçek zaman
const dinleyiciler = new Set()

export function kitapDuraklatMi() {
  return duraklatildi
}

export function kitapDuraklatAyarla(deger) {
  if (deger === duraklatildi) return
  duraklatildi = deger
  dinleyiciler.forEach((f) => f(deger))
}

// rAF zaman damgası (veya performance.now()) → duraklatılabilir sanal zaman
export function kitapSaati(now) {
  if (duraklatildi) {
    if (duraklamaBasi === null) duraklamaBasi = now
    return duraklamaBasi - ofset // saat durdu: hep aynı değeri döndür
  }
  if (duraklamaBasi !== null) {
    ofset += now - duraklamaBasi // duraklatma bitti: süreyi ofsete ekle
    duraklamaBasi = null
  }
  return now - ofset
}

// React tarafı: duraklatma durumunu canlı dinle (buton, Lottie vb.)
export function useKitapDuraklat() {
  const [durum, setDurum] = useState(duraklatildi)
  useEffect(() => {
    dinleyiciler.add(setDurum)
    setDurum(duraklatildi) // abone olana kadar değişmiş olabilir
    return () => dinleyiciler.delete(setDurum)
  }, [])
  return durum
}

export default useKitapDuraklat
