import TiklamaliSprite from '../TiklamaliSprite.jsx'
import TiklanirGorsel from '../TiklanirGorsel.jsx'
import kalemler from '../../../assets/backgrounds/sayfa2/kalemler.png'

/* ===============================================================
   SEVGİ — 2. SAHNE İÇERİĞİ (oda: Işıl çiçeği uzatıyor + Canım)

   Arka plan (arka_plan2.jpg) Sahne tarafından çizilir; bu dosya
   üzerine binen ÖĞELERİ ekler:

   Katmanlar (alttan üste):
     arka_plan2.jpg  (Sahne çiziyor)          — oda + pencere + masa
     kalemler.png    (TiklanirGorsel)         — masada; GİZLİ, dokununca belirir
     Canım (çiçek)   (TiklamaliSprite)        — sağda; GİZLİ, dokununca belirir+kırpar
     Işıl (çiçekle)  (TiklamaliSprite)        — solda; DOKUNUNCA çiçeği uzatır

   ETKİLEŞİM:
   - KALEMLER ve CANIM açılışta GÖRÜNMEZ; yalnızca yerlerinde nabız atan
     "dokun" halkası durur. Boşken o noktaya dokununca belirirler (Canım
     ayrıca göz kırpma döngüsüne girer; kalemler sadece görünür/kalır).
   - IŞIL değişmedi: dinlenme karesinde durur, dokununca çiçeği uzatır.
   - İlk dokunuş yalnızca görünen piksellerde çalışır (alfaHarita.js +
     BookReader alfa-testi); halka kaybolur. Sahne her açılışta sıfırdan
     kurulduğu için (BookReader key) her gelişte yeniden gizli başlar.

   ───────────────────────────────────────────────────────────────
   👉 KONUMLARI BURADAN AYARLA: Sayılar sahne %'sidir.
      - KALEMLER: TiklanirGorsel (left/top/width).
      - CICEK / ISIL: TiklamaliSprite ölçek+konumu → olcek (büyüklük, 1=tam),
        x (sağ/sol %), y (aşağı/yukarı %). Kare tuvali tam 16:9 olduğundan
        olcek=1 sahneyi tam doldurur; x/y kareyi kaydırır.
   ───────────────────────────────────────────────────────────────

   NOT: Çiçek de Işıl da tam 16:9 tuvale gömülüdür (içerik şeffaf zeminde).
=============================================================== */

/* Kare dizilerini otomatik topla (sıralı) — SevgiSahne1 ile aynı desen */
function kareleriTopla(moduller) {
  return Object.keys(moduller)
    .sort()
    .map((yol) => moduller[yol])
}
const cicekKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/cicek_animasyon/*.png', {
    eager: true,
    import: 'default',
  }),
)
const isilKareleri = kareleriTopla(
  import.meta.glob('../../../assets/characters/isil_cicegi_birak/*.png', {
    eager: true,
    import: 'default',
  }),
)

// ✏️ KALEMLER (dokununca belirir) — masaya oturan kalemler. left/top: sol-üst köşe (%).
const KALEMLER = { left: '-3%', top: '60%', width: '20%' }

// 🌻 CANIM (büyük çiçek, sağda) — olcek=büyüklük, x=sağ/sol, y=aşağı/yukarı (%).
const CICEK = { olcek: 0.94, x: 35, y: 31 }

// 🧒 IŞIL (sol-orta) — olcek=büyüklük, x=sağ/sol, y=aşağı/yukarı (%).
const ISIL = { olcek: 1, x: -0.2, y: 0 }

/* OYNATMA TEMPOSU (TiklamaliSprite) — dokununca DÖNGÜDE:
   frameSuresiMs = her karenin temel süresi; bekleKare=0 → 1. kare (dinlenme)
   ek olarak beklemeSuresiMs kadar daha durur. Böylece:
   - Canım: poz1 (gözler açık) uzun, poz2 (kapalı) kısa → doğal göz kırpma.
   - Işıl : poz1 (dik tutuş) uzun, poz2 (öne uzatma) → sakin "al bunu". */
const CICEK_TEMPO = { frameSuresiMs: 180, bekleKare: 0, beklemeSuresiMs: 2000 } // 2180 açık / 180 kapalı (biraz hızlandı)
const ISIL_TEMPO = { frameSuresiMs: 1300, bekleKare: 0, beklemeSuresiMs: 450 } // 1750 tutuş / 1300 uzatma (biraz hızlandı)

function SevgiSahne2({ canli = true }) {
  return (
    <div className="absolute inset-0">
      {/* ===== KALEMLER (masada) — açılışta GİZLİ; dokununca belirir =====
          Statik değil: yerinde "dokun" halkası durur, dokununca kalemler
          görünür ve kalır (animasyon yok). */}
      <TiklanirGorsel
        src={kalemler}
        left={KALEMLER.left}
        top={KALEMLER.top}
        width={KALEMLER.width}
        canli={canli}
        zIndex={10}
      />

      {/* ===== CANIM (sağ) — açılışta GİZLİ; dokununca belirip göz kırpar =====
          gizliBaslat: ilk dokunuşa kadar görünmez (yalnızca halka); dokununca
          belirir VE göz kırpma döngüsü başlar. */}
      <TiklamaliSprite
        frames={cicekKareleri}
        olcek={CICEK.olcek}
        x={CICEK.x}
        y={CICEK.y}
        frameSuresiMs={CICEK_TEMPO.frameSuresiMs}
        bekleKare={CICEK_TEMPO.bekleKare}
        beklemeSuresiMs={CICEK_TEMPO.beklemeSuresiMs}
        donguArasiMs={0}
        canli={canli}
        zIndex={15}
        gizliBaslat
      />

      {/* ===== IŞIL (sol-orta) — dokununca tutuş/uzatış döngüsü =====
          İlk dokunuşta pose 02 (kare 1) ile başlar; sonraki turlar normal 01→02. */}
      <TiklamaliSprite
        frames={isilKareleri}
        olcek={ISIL.olcek}
        x={ISIL.x}
        y={ISIL.y}
        frameSuresiMs={ISIL_TEMPO.frameSuresiMs}
        bekleKare={ISIL_TEMPO.bekleKare}
        beklemeSuresiMs={ISIL_TEMPO.beklemeSuresiMs}
        donguArasiMs={0}
        canli={canli}
        zIndex={20}
        ilkDokunusKaresi={1}
      />
    </div>
  )
}

export default SevgiSahne2
