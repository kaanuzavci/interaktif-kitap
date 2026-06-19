/* ===============================================================
   PARILTI — "ilk dokunuş" yıldız patlaması (tek seferlik)

   Bir tıklama göstergesine (DokunIpucu) İLK kez dokunulduğunda, tam o
   noktadan yıldızlar dışarı saçılır ve sönerek kaybolur; ortada kısa bir
   ışık parlaması olur. Böylece beliren/oynayan öğe "parıltıyla gelmiş"
   gibi görünür. Yalnızca bir kez oynar (animasyonlar `both` → bitince
   görünmez kalır), sonra çağıran bileşen kısa süre sonra söker.

   Konum (left/top) + zIndex çağırandan `style` ile gelir; nokta, yıldız
   patlamasının MERKEZİDİR. Boyut/mesafe sahneye göre (cqw) ölçeklenir →
   telefon/tablette oransal. `.hareketsiz` (hareket azalt) altında tüm
   animasyonlar durduğundan parıltı da oynamaz (aşırı uyarım olmaz).
=============================================================== */

// Parıltının toplam SÜRESİ (ms): en geç başlayan yıldızın gecikmesi + uçuş
// süresi + küçük pay. Çağıranlar Parilti'yi bu süre sonunda söker (bkz.
// setTimeout) → animasyon bitince DOM'dan kalkar.
export const PARILTI_SURE_MS = 1700

// Yıldız uçuş süresi (ms) — gecikmelerle birlikte kademeli/yavaş saçılma.
const YILDIZ_SURE_MS = 1200

// Her yıldızın uçuş yönü/mesafesi (cqw), boyutu (cqw), dönüşü ve gecikmesi.
// Mesafeler sahne genişliğine göredir → her ekranda orantılı saçılır.
// Gecikmeler GENİŞ aralığa yayıldı (0–340ms) → "bir anda" değil, kademeli açılır.
const YILDIZLAR = [
  { dx: -7.5, dy: -4.0, boyut: 3.0, donus: -30, gecikme: 0 },
  { dx: 6.8, dy: -5.5, boyut: 2.6, donus: 28, gecikme: 110 },
  { dx: 8.2, dy: 2.4, boyut: 2.9, donus: 42, gecikme: 60 },
  { dx: -6.2, dy: 4.6, boyut: 2.4, donus: -22, gecikme: 180 },
  { dx: 1.4, dy: -8.2, boyut: 2.1, donus: 16, gecikme: 250 },
  { dx: -2.6, dy: 7.6, boyut: 2.2, donus: -16, gecikme: 140 },
  { dx: 4.6, dy: 0.6, boyut: 1.7, donus: 12, gecikme: 340 },
  { dx: -4.4, dy: -1.2, boyut: 1.7, donus: -12, gecikme: 290 },
]

function Parilti({ style }) {
  return (
    <div className="pointer-events-none absolute" style={{ width: 0, height: 0, ...style }}>
      {/* Ortadaki kısa ışık parlaması (biraz daha yumuşak/yavaş) */}
      <span
        className="absolute rounded-full"
        style={{
          left: 0,
          top: 0,
          width: '11cqw',
          height: '11cqw',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,224,138,0.55) 38%, transparent 70%)',
          animation: 'pariltiFlash 900ms ease-out both',
        }}
      />

      {/* Dışarı saçılan yıldızlar — kademeli gecikme + uzun uçuş = yavaş parıltı */}
      {YILDIZLAR.map((y, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            left: 0,
            top: 0,
            lineHeight: 1,
            color: '#fff',
            fontSize: `${y.boyut}cqw`,
            textShadow: '0 0 6px rgba(255,209,102,0.95), 0 0 2px rgba(255,255,255,0.9)',
            // CSS değişkenleri → keyframe içinde uçuş yönü (cqw)
            '--dx': `${y.dx}cqw`,
            '--dy': `${y.dy}cqw`,
            '--rot': `${y.donus}deg`,
            animation: `pariltiYildiz ${YILDIZ_SURE_MS}ms cubic-bezier(0.22,1,0.36,1) ${y.gecikme}ms both`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  )
}

export default Parilti
