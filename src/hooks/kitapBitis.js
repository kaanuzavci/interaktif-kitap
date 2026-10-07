import { useEffect, useState } from 'react'

/* ===============================================================
   KİTAP BİTİŞ — kitabın SON sayfasındaki kutlama (bitiş) ekranı sinyali

   Son sayfanın ANLATIM SESİ (konuşma) bitince bu sinyal true olur
   (BookReader, useSahneSesi'nin onBitti callback'inden tetikler; eskiden
   çiçeğe dokunuş + 15 sn sayaçtı — geç kalıyordu). BookReader sinyali
   useKitapBitis() ile dinler ve tam-ekran <BitisEkrani> kutlamasını
   gösterir (ekranın sağ/solundan yükselen baloncuklar + kutlama kartı).

   kitapDuraklat.js ile aynı basit yayın/abone (pub-sub) desenini kullanır.

   Sıfırlama BookReader'a aittir: kitaba giriş/çıkışta ve "Kitaba Dön" /
   "Tekrar Oyna" seçilince kitapBitisAyarla(false) çağrılır.
=============================================================== */

let bitti = false
const dinleyiciler = new Set()

export function kitapBittiMi() {
  return bitti
}

export function kitapBitisAyarla(deger) {
  if (deger === bitti) return
  bitti = deger
  dinleyiciler.forEach((f) => f(deger))
}

// React tarafı: bitiş durumunu canlı dinle (BookReader).
export function useKitapBitis() {
  const [durum, setDurum] = useState(bitti)
  useEffect(() => {
    dinleyiciler.add(setDurum)
    setDurum(bitti) // abone olana kadar değişmiş olabilir
    return () => dinleyiciler.delete(setDurum)
  }, [])
  return durum
}

export default useKitapBitis
