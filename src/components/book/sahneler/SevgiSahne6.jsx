import TiklamaliSprite from '../TiklamaliSprite.jsx'
import useOrtamSesi from '../../../hooks/useOrtamSesi.js'
import { KUS_SESI } from '../../../audio/karmaSesleri.js'

/* ===============================================================
   SEVGİ — 6. SAHNE İÇERİĞİ (kır: Işıl uçurtma uçuruyor)

   Arka plan (arka_plan6.jpg: ağaçlar + çalılar + çiçekli çayır + bulutlu
   gökyüzü) Sahne tarafından çizilir. Bu dosya üzerine binen ÖĞELERİ ekler:

   Katmanlar (alttan üste):
     arka_plan6.jpg   (Sahne çiziyor)        — kır manzarası
     Işıl (syf6/isil, 8 kare) (TiklamaliSprite) — sağda, ipi tutuyor;
                                                dokununca döngüye girer
     uçurtma (syf6/ucurtma, 11 kare) (TiklamaliSprite) — gökyüzünde;
                                                dokununca döngüye girer

   Kareler tam 16:9 tuvale gömülüdür (4096→1920 indirgendi, sayfa-5
   güneş/ay kararıyla aynı: arka plan zaten 1080p, kitap tuvalinden büyük
   çözünürlük GPU belleğini boşa şişirir) → olcek/x/y GEREKMEZ, tam-kaplama
   bindirilir; uçurtmanın ipi Işıl'ın avucuna birebir oturur.

   ETKİLEŞİM (sayfa-4'teki Işıl/çiçek ile birebir aynı his):
   - Her iki öğe de ilk dokunuşa kadar dinlenme karesinde durur, üstünde
     "dokun" ipucu nabız atar; dokununca yıldız parıltısıyla DÖNGÜYE girer.
   - Dokunma piksel-hassastır (alfa testi) ve animasyon başladıktan sonra
     öğe dokunmayı yutmaz → sayfa çevirme önceliği korunur.
=============================================================== */

/* Kare dizilerini otomatik topla (sıralı) — diğer sahnelerle aynı desen */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const isilKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf6/isil/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const ucurtmaKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf6/ucurtma/*.webp', {
    eager: true,
    import: 'default',
  }),
)

// 🧒 IŞIL (sağda, ipi tutuyor) — 8 kare; yumuşak, sakin bir salınım döngüsü.
// Dokun ipucu opak merkezinde (göğsünde) kendiliğinden doğru durur.
const ISIL_TEMPO = { frameSuresiMs: 150, donguArasiMs: 700 }

// 🪁 UÇURTMA (gökyüzünde) — 11 kare; süzülme/salınım döngüsü. Opak merkez
// uzun ipin ortasına düştüğünden "dokun" ipucu elle uçurtma GÖVDESİNE alınır.
const UCURTMA_TEMPO = { frameSuresiMs: 130, donguArasiMs: 0 }
const UCURTMA_IPUCU = { x: 37, y: 19 } // sahne %'si — kırmızı puantiyeli gövde

function SevgiSahne6({ canli = true }) {
  // 🐦 KUŞ SESİ — kır sahnesi açıkken HAFİFÇE, döngüde duyulur (anlatımı
  // bastırmaz). Sayfa çevirme önizlemesinde (canli=false) çalmaz.
  useOrtamSesi(KUS_SESI, canli, { volume: 0.16, loop: true })

  return (
    <div className="absolute inset-0">
      {/* ===== UÇURTMA — dokununca süzülme döngüsü =====
          Işıl'ın ARKASINDA çizilir (Işıl daha üstte): ip/uçurtma
          Işıl'ın arkasından geçer. */}
      <TiklamaliSprite
        frames={ucurtmaKareleri}
        frameSuresiMs={UCURTMA_TEMPO.frameSuresiMs}
        donguArasiMs={UCURTMA_TEMPO.donguArasiMs}
        canli={canli}
        zIndex={10}
        ipucuYuzde={UCURTMA_IPUCU}
      />

      {/* ===== IŞIL — dokununca salınım döngüsü; uçurtmanın ÜSTÜNDE ===== */}
      <TiklamaliSprite
        frames={isilKareleri}
        frameSuresiMs={ISIL_TEMPO.frameSuresiMs}
        donguArasiMs={ISIL_TEMPO.donguArasiMs}
        canli={canli}
        zIndex={20}
      />
    </div>
  )
}

export default SevgiSahne6
