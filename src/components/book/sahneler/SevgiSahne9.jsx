import KonumluSprite from '../KonumluSprite.jsx'

/* ===============================================================
   SEVGİ — 9. SAHNE İÇERİĞİ (Işıl üzgün çiçekle konuşuyor)

   Arka plan (arka_plan9.jpg: krem + pembe dalga + kurdele/kalp) Sahne
   tarafından çizilir. Bu dosya üzerine binen ÖĞELERİ ekler:

   Katmanlar (alttan üste):
     arka_plan9.jpg   (Sahne çiziyor)      — fon
     Işıl (syf9/isil, 12 kare)  (KonumluSprite) — solda büst; dokununca
                       konuşma/gülümseme döngüsüne girer
     çiçek (syf9/cicek, 75 kare) (KonumluSprite) — sağda saksılı üzgün
                       ayçiçeği; dokununca dertlenme (konuşma + göz kırpma)
                       döngüsüne girer

   Kareler ortak alfa kutusundan kırpıldı (scripts/hazirla-sayfa6-8.mjs):
   - Işıl 2480x3508 → kırpık + 1700px yüksekliğe indirildi ("ekranın ~2
     katı" kuralı; 4K kitapta bile doğal çözünürlük üstü — kalite korunur).
   - Çiçek 1920x1080 → 531x999 kırpık, doğal ölçek (piksel kaybı yok).
   KonumluSprite left/top/width ile referans görseldeki yerlerine oturur
   (sharp kompozitiyle karşılaştırılarak seçildi).

   ETKİLEŞİM (diğer sayfalarla birebir aynı his): ilk dokunuşa kadar
   dinlenme karesi + "dokun" halkası; dokununca parıltı + sonsuz döngü;
   piksel-hassas alfa tıklaması; animasyon başlayınca sayfa çevirme önceliği.

   ───────────────────────────────────────────────────────────────
   👉 KONUMLAR sahne %'sidir. Aşağıdaki sabitlerden ayarla.
   ─────────────────────────────────────────────────────────────── */

/* Kare dizilerini otomatik topla (sıralı) — diğer sahnelerle aynı desen */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const isilKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf9/isil/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const cicekKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/syf9/cicek/*.webp', {
    eager: true,
    import: 'default',
  }),
)

// 🧒 IŞIL (solda, büst) — alt kesiği sahne dibinin ALTINDA kalacak şekilde
// yerleştirilir (gövdesi kadrajdan çıkar, referanstaki gibi).
const ISIL = { left: '13.2%', top: '16.4%', width: '40.6%' }
// Tempo: 12 kare konuşma/gülümseme; turlar arası kısa nefes.
const ISIL_TEMPO = { frameSuresiMs: 150, donguArasiMs: 700 }

// 🌻 ÜZGÜN ÇİÇEK (sağda, saksılı) — saksının altı sahne dibinde kırpılır.
const CICEK = { left: '59.4%', top: '41.4%', width: '24.3%' }
// Tempo: 75 kare dertlenme (konuşma + göz kırpma); turlar arası dinlenme.
const CICEK_TEMPO = { frameSuresiMs: 70, donguArasiMs: 900 }
// Dokun ipucu çiçeğin YÜZÜNE otursun (kütle merkezi sapa/saksıya düşüyor).
// Görsel kutusunun %'si (KonumluSprite ipucuYuzde).
const CICEK_IPUCU = { x: 48.4, y: 30.7 }

function SevgiSahne9({ canli = true }) {
  return (
    <div className="absolute inset-0">
      {/* ===== IŞIL — dokununca konuşma/gülümseme döngüsü ===== */}
      <KonumluSprite
        frames={isilKareleri}
        left={ISIL.left}
        top={ISIL.top}
        width={ISIL.width}
        frameSuresiMs={ISIL_TEMPO.frameSuresiMs}
        donguArasiMs={ISIL_TEMPO.donguArasiMs}
        canli={canli}
        zIndex={10}
      />

      {/* ===== ÜZGÜN ÇİÇEK — dokununca dertlenme döngüsü ===== */}
      <KonumluSprite
        frames={cicekKareleri}
        left={CICEK.left}
        top={CICEK.top}
        width={CICEK.width}
        frameSuresiMs={CICEK_TEMPO.frameSuresiMs}
        donguArasiMs={CICEK_TEMPO.donguArasiMs}
        canli={canli}
        zIndex={12}
        ipucuYuzde={CICEK_IPUCU}
      />
    </div>
  )
}

export default SevgiSahne9
