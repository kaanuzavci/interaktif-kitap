import { useState, useEffect } from 'react'

/* ---------------------------------------------------------------
   FRAME'LERİ OTOMATİK YÜKLEME

   40 ayrı "import ... from ..." satırı yazmak yerine Vite'ın
   import.meta.glob() özelliğini kullanıyoruz: verilen desene uyan
   TÜM dosyaları tek seferde import eder ve bir obje döndürür:

     { '../../assets/.../isil_frame_01.png': 'dosyanın-url-i', ... }

   - eager: true        -> dosyalar hemen yüklensin (lazy değil)
   - import: 'default'  -> direkt url string'i gelsin

   Avantajı: klasöre frame eklenince/silinince kodu değiştirmek
   gerekmez, dizi kendini günceller.
---------------------------------------------------------------- */
const frameModulleri = import.meta.glob(
  '../../assets/characters/isil-yurume/isil_frame_*.png',
  { eager: true, import: 'default' },
)

/* GEÇİCİ AYAR - POZ_ATLAMA:
   Elimizdeki 40 dosyada her poz 5 kez tekrarlanıyor (01-05 aynı,
   06-10 aynı...). Hepsini oynatsak her poz ekranda 5x80=400ms kalır
   ve yürüyüş kesik kesik görünürdü. Bu yüzden 5'te 1 dosya alıyoruz
   -> 8 benzersiz poz, her biri 80ms.
   Gerçek 40 farklı pozlu export gelince bu değeri 1 yap, bitti. */
const POZ_ATLAMA = 5

// Objeyi sıralı bir diziye çevir: [url01, url06, url11, ...]
// Dosya adlarındaki numaralar 01, 02 ... şeklinde sıfır dolgulu olduğu
// için alfabetik sıralama (sort) aynı zamanda sayısal sıralamadır.
// filter ile her POZ_ATLAMA dosyadan sadece ilkini alıyoruz.
const frames = Object.keys(frameModulleri)
  .sort()
  .filter((_, sira) => sira % POZ_ATLAMA === 0)
  .map((dosyaYolu) => frameModulleri[dosyaYolu])

// Saniyede ~12 kare (çizgi film hızı) -> her kare 80ms görünür
const FRAME_SURESI_MS = 80

/**
 * IsilYurume: Işıl'ın yürüme animasyonu (sprite animasyon).
 *
 * Çalışma mantığı:
 *  - Tek bir <img> var; her 80ms'de src'si bir sonraki frame'le değişiyor.
 *  - Son frame'den sonra başa dönüyor (% operatörü ile, aşağıda).
 *
 * Props:
 *  - width     : karakterin genişliği (örn. 200 veya "18vw")
 *  - style     : pozisyon vb. için ek stil (parent'tan gelir)
 *  - isPlaying : true  -> yürüme animasyonu oynar
 *                false -> ilk frame'de (duruş pozu) sabit durur
 */
function IsilYurume({ width = 200, style = {}, isPlaying = false }) {
  // Şu an gösterilen frame'in dizideki sırası (0'dan başlar)
  const [frameIndex, setFrameIndex] = useState(0)

  /* Frame'leri tarayıcı hafızasına ÖNCEDEN yükle (preload).
     Bunu yapmazsak: animasyonun ilk turunda her frame internetten/
     diskten ilk kez yüklenir ve görüntü titrer. new Image() ile
     görünmez birer kopya oluşturmak, hepsini önbelleğe alır.
     [] bağımlılığı: component ilk ekrana geldiğinde 1 kez çalışır. */
  useEffect(() => {
    frames.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [])

  /* Animasyon döngüsü.
     isPlaying değiştiğinde bu effect yeniden çalışır:
     - true ise: 80ms'de bir frameIndex'i artıran bir zamanlayıcı kur.
       "% frames.length" sihri: 39'dan sonra 40 % 40 = 0 -> başa döner.
     - false ise: zamanlayıcı kurma, duruş pozuna (frame 0) dön.
     return edilen fonksiyon "temizlik"tir: component ekrandan kalkınca
     veya isPlaying değişince eski zamanlayıcıyı iptal eder
     (yoksa zamanlayıcılar birikir ve animasyon hızlanırdı!). */
  useEffect(() => {
    if (!isPlaying) {
      setFrameIndex(0) // duruş pozisyonu = ilk frame
      return
    }

    const zamanlayici = setInterval(() => {
      setFrameIndex((onceki) => (onceki + 1) % frames.length)
    }, FRAME_SURESI_MS)

    return () => clearInterval(zamanlayici) // temizlik
  }, [isPlaying])

  // Klasör boşsa (frame'ler henüz eklenmemişse) hata vermeden çık
  if (frames.length === 0) return null

  return (
    <img
      src={frames[frameIndex]}
      alt="Işıl"
      draggable={false}
      style={{ width, ...style }}
      className="pointer-events-none select-none"
    />
  )
}

export default IsilYurume
