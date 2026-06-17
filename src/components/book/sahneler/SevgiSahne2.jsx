import TiklamaliSprite from '../TiklamaliSprite.jsx'
import kalemler from '../../../assets/backgrounds/kalemler.png'

/* ===============================================================
   SEVGİ — 2. SAHNE İÇERİĞİ (oda: Işıl çiçeği uzatıyor + Canım)

   Arka plan (arka_plan2.jpg) Sahne tarafından çizilir; bu dosya
   üzerine binen ÖĞELERİ ekler:

   Katmanlar (alttan üste):
     arka_plan2.jpg  (Sahne çiziyor)          — oda + pencere + masa
     kalemler.png    (bu dosya, statik)       — masada kalem kabı + kalemler
     Canım (çiçek)   (TiklamaliSprite)        — sağda; DOKUNUNCA göz kırpar
     Işıl (çiçekle)  (TiklamaliSprite)        — solda; DOKUNUNCA çiçeği uzatır

   ETKİLEŞİM (1. sahneyle BİREBİR aynı mantık):
   - Açılışta animasyonlar OYNAMAZ; dinlenme karesinde (poz 1) durur ve
     üstlerinde nabız atan "dokun" halkası görünür.
   - İlk dokunuşta (yalnızca görünen piksellerde — TiklamaliSprite +
     BookReader alfa-testi) DÖNGÜYE girer ve sürekli oynar; halka kaybolur.
   - Tıklama yönlendirmesi/halka/alfa-testi TiklamaliSprite + TiklamaKayit
     + BookReader.yuzeyPointerDown üçlüsünden gelir (tavşan/uğurböceğiyle aynı).

   ───────────────────────────────────────────────────────────────
   👉 KONUMLARI BURADAN AYARLA: Sayılar sahne %'sidir.
      - KALEMLER: statik <img> (left/top/width).
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

// ✏️ KALEMLER (statik) — masaya oturan kalemler. left/top: sol-üst köşe (%).
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
const CICEK_TEMPO = { frameSuresiMs: 200, bekleKare: 0, beklemeSuresiMs: 2400 } // 2600 açık / 200 kapalı
const ISIL_TEMPO = { frameSuresiMs: 1500, bekleKare: 0, beklemeSuresiMs: 500 } // 2000 tutuş / 1500 uzatma

function SevgiSahne2({ canli = true }) {
  return (
    <div className="absolute inset-0">
      {/* ===== KALEMLER (masada; statik, en altta) ===== */}
      <img
        src={kalemler}
        alt=""
        draggable={false}
        className="pointer-events-none absolute select-none"
        style={{ left: KALEMLER.left, top: KALEMLER.top, width: KALEMLER.width, zIndex: 10 }}
      />

      {/* ===== CANIM (sağ) — dokununca göz kırpma döngüsü ===== */}
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
      />

      {/* ===== IŞIL (sol-orta) — dokununca tutuş/uzatış döngüsü ===== */}
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
      />
    </div>
  )
}

export default SevgiSahne2
