import { useEffect, useState } from 'react'
import KonumluSprite from '../KonumluSprite.jsx'
import { sahneAnlatiminiBaslat, sahneAnlatimDinle } from '../../../hooks/useSahneSesi.js'

/* ===============================================================
   SEVGİ — 10. SAHNE İÇERİĞİ (Işıl portresi — kapanış)

   Arka plan (arka_plan10.jpg: sarı fon + turuncu daire) Sahne tarafından
   çizilir. Üzerine tek öğe biner:

     Işıl (syf10/isil, 6 kare) (KonumluSprite) — dairenin ortasında büst;
       dokununca tatlı bir gülümseme/kıpırdanma döngüsüne girer.

   Kareler 2480x3508 tuvalden ortak alfa kutusuyla kırpılıp 2000px
   yüksekliğe indirildi ("ekranın ~2 katı" kuralı — kalite korunur;
   scripts/hazirla-sayfa6-8.mjs). Konum, referans görselle sharp kompoziti
   karşılaştırılarak seçildi (gövdesi sahne dibinde kırpılır).

   ETKİLEŞİM diğer sayfalarla birebir aynı: dokun halkası → parıltı →
   sonsuz döngü; alfa tıklaması; oynarken sayfa çevirme önceliği.

   ANLATIM SESİ bu sayfada OTOMATİK BAŞLAMAZ: Işıl'a ilk dokunuşta
   (hareket başlarken) sahneAnlatiminiBaslat() ile başlar (useSahneSesi'nin
   ELLE_BASLAYANLAR listesi index 10'u içerir).

   KONUŞMA BİTİNCE ağız döngüsü YUMUŞAKÇA durur: mevcut tur son karesine
   kadar oynar, sonra dinlenme karesinde (frame_01) kalır — ani atlama yok
   (KonumluSprite yumusakDur + sahneAnlatimDinle). TEKRAR düğmesi anlatımı
   baştan çalınca ağız döngüsü de kaldığı yerden yeniden başlar.
=============================================================== */

/* Kare dizilerini otomatik topla (sıralı) — diğer sahnelerle aynı desen */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const isilKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf10/isil/*.webp', {
    eager: true,
    import: 'default',
  }),
)

// 🧒 IŞIL (dairenin ortasında, büst) — 👉 konum/boyut buradan ayarlanır.
const ISIL = { left: '9.5%', top: '4.5%', width: '43.6%' }
// Tempo: 6 kare yumuşak gülümseme; turlar arası kısa dinlenme.
const ISIL_TEMPO = { frameSuresiMs: 160, donguArasiMs: 800 }

function SevgiSahne10({ canli = true }) {
  // Konuşma (anlatım) bitti mi? Bitince ağız döngüsü yumuşakça durur;
  // TEKRAR ile anlatım yeniden başlarsa ('basladi') döngü devam eder.
  const [konusmaBitti, setKonusmaBitti] = useState(false)
  useEffect(() => {
    if (!canli) return
    return sahneAnlatimDinle((olay) => {
      if (olay === 'bitti') setKonusmaBitti(true)
      else if (olay === 'basladi') setKonusmaBitti(false)
    })
  }, [canli])

  return (
    <div className="absolute inset-0">
      <KonumluSprite
        frames={isilKareleri}
        left={ISIL.left}
        top={ISIL.top}
        width={ISIL.width}
        frameSuresiMs={ISIL_TEMPO.frameSuresiMs}
        donguArasiMs={ISIL_TEMPO.donguArasiMs}
        canli={canli}
        zIndex={10}
        onOynat={sahneAnlatiminiBaslat}
        yumusakDur={konusmaBitti}
      />
    </div>
  )
}

export default SevgiSahne10
