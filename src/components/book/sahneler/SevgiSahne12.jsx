import TiklamaliSprite from '../TiklamaliSprite.jsx'
import useOrtamSesi from '../../../hooks/useOrtamSesi.js'
import { ISILTI_SESI } from '../../../audio/karmaSesleri.js'
import { sahneAnlatiminiBaslat } from '../../../hooks/useSahneSesi.js'

/* ===============================================================
   SEVGİ — 12. SAHNE İÇERİĞİ (KAPANIŞ: solda mutlu/konuşan çiçek)

   Arka plan (arka_plan12.jpg: SOLDA sarı daire + SAĞDA mint sulu boya)
   Sahne tarafından çizilir. Bu dosya üzerine binen ÖĞEYİ ekler:

   Katmanlar (alttan üste):
     arka_plan12.jpg  (Sahne çiziyor)          — sarı daire + mint
     çiçek (syf12/cicek, 73 kare) (TiklamaliSprite) — SOLDA saksılı gülen
                       ayçiçeği; dokununca gülümseme/konuşma döngüsüne girer

   Kareler tam 16:9 tuvale (1920x1080) gömülüdür — çiçek zaten kendi
   içinde SOLA yerleşiktir (sayfa-6 Işıl/uçurtma ile aynı desen) → olcek/x/y
   GEREKMEZ, tam-kaplama bindirilir. Yalnızca yüz ifadesi (göz/ağız) değişir;
   gövde/saksı sabit kaldığından döngü sıçramasızdır (kare0 = dinlenme:
   gözler kapalı gülümseme).

   ETKİLEŞİM (diğer çiçek sahneleriyle aynı his):
   - İlk dokunuşa kadar dinlenme karesinde durur; üstünde "dokun" ipucu
     nabız atar. Dokununca yıldız parıltısıyla DÖNGÜYE girer (turlar arası
     kısa dinlenme). Dokunma piksel-hassastır (alfa testi) ve animasyon
     başladıktan sonra öğe dokunmayı yutmaz → sayfa çevirme önceliği korunur.

   ANLATIM SESİ bu sayfada OTOMATİK BAŞLAMAZ: çiçeğe ilk dokunuşta
   (konuşma döngüsü başlarken) sahneAnlatiminiBaslat() ile başlar
   (useSahneSesi ELLE_BASLAYANLAR listesi index 12'yi içerir).

   BİTİŞ (kutlama) EKRANI bu sahnede TETİKLENMEZ: anlatım bitince
   BookReader tetikler (useSahneSesi onBitti → kitapBitis sinyali) →
   akış: çiçeğe dokun → çiçek konuşur → konuşma biter → kutlama.
=============================================================== */

/* Kare dizilerini otomatik topla — dosya adındaki SON sayıya göre SAYISAL
   sırala (düz string sort 100+ karede sırayı bozar; burada 73 kare olsa da
   sağlam olsun diye sayısal; bkz. sayfa-8 kelebek düzeltmesi). */
function kareleriTopla(moduller) {
  const sayi = (yol) => {
    const m = yol.match(/(\d+)(?=\.\w+$)/)
    return m ? Number(m[1]) : 0
  }
  return Object.keys(moduller)
    .sort((a, b) => sayi(a) - sayi(b))
    .map((yol) => moduller[yol])
}
const cicekKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf12/cicek/*.webp', {
    eager: true,
    import: 'default',
  }),
)

// 🌻 MUTLU ÇİÇEK (solda) — 73 kare; gülümseme/konuşma döngüsü, turlar arası
// kısa dinlenme (kare0: gözler kapalı gülümseme).
const CICEK_TEMPO = { frameSuresiMs: 80, donguArasiMs: 700 }
// Dokun ipucu çiçeğin YÜZÜNE otursun (tam-tuvalde sol-üstteki yüz ≈ %28,31).
const CICEK_IPUCU = { x: 28, y: 31 }

// ✦ YAPRAK PARILTILARI — ayçiçeğinin sarı yaprak uçları çevresine dağılmış
// minik yıldızlar (yüz ≈ %28,31; yapraklar bunun etrafında halka). Her biri
// kademeli gecikmeyle yanıp söner → yapraklar "parıldar". (x/y = sahne %'si,
// b = boyut cqw, g = animasyon gecikmesi ms.)
const PARILTILAR = [
  { x: 28, y: 6, b: 2.3, g: 0 }, //    üst yaprak
  { x: 37, y: 13, b: 1.9, g: 900 }, //  üst-sağ
  { x: 41, y: 27, b: 2.5, g: 500 }, //  sağ
  { x: 37, y: 41, b: 2.0, g: 1300 }, // alt-sağ
  { x: 28, y: 49, b: 2.2, g: 300 }, //  alt
  { x: 19, y: 41, b: 1.9, g: 1100 }, // alt-sol
  { x: 15, y: 27, b: 2.4, g: 150 }, //  sol
  { x: 19, y: 13, b: 2.0, g: 700 }, //  üst-sol
]

function SevgiSahne12({ canli = true }) {
  // ✨ IŞILTI SESİ — yapraklardaki parıltıya eşlik eden yumuşak şıngırtı;
  // düşük sesle 3 KEZ çalar, sonra susar (sürekli döngü rahatsız ediyordu).
  // Önizlemede (canli=false) çalmaz.
  useOrtamSesi(ISILTI_SESI, canli, { volume: 0.22, tekrar: 3 })

  return (
    <div className="absolute inset-0">
      {/* ===== MUTLU ÇİÇEK — dokununca gülümseme/konuşma döngüsü ===== */}
      <TiklamaliSprite
        frames={cicekKareleri}
        frameSuresiMs={CICEK_TEMPO.frameSuresiMs}
        donguArasiMs={CICEK_TEMPO.donguArasiMs}
        canli={canli}
        zIndex={10}
        ipucuYuzde={CICEK_IPUCU}
        onOynat={sahneAnlatiminiBaslat}
      />

      {/* ===== YAPRAK PARILTILARI — çiçeğin ÜSTÜNDE, dokunuşu geçirir ===== */}
      <div className="pointer-events-none absolute inset-0 z-20 select-none">
        {PARILTILAR.map((p, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.b}cqw`,
              lineHeight: 1,
              color: '#fff',
              textShadow:
                '0 0 6px rgba(255,209,102,0.95), 0 0 2px rgba(255,255,255,0.95)',
              animation: `pariltiTwinkle 2200ms ease-in-out ${p.g}ms infinite`,
            }}
          >
            ✦
          </span>
        ))}
      </div>
    </div>
  )
}

export default SevgiSahne12
