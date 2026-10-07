import kapakGorsel from '../../assets/backgrounds/kapak/kapak.jpg'

/* ===============================================================
   KAPAK GÖVDESİ — kapalı kitabın 3B görseli (animasyonsuz iskelet)

   Gerçek bir KAPALI kitap: sol kenarı yuvarlak CİLT (spine), sağ/alt kenarında
   SAYFA YIĞINI kenarları, ön yüzü kapak.jpg'in dolu SAĞ yarısıdır.

   Ebadını EBEVEYN verir (h-full w-full doldurur) → KapakEkrani (açılış) ve
   HomeScreen (kitap seçilince gelen morph) aynı görseli paylaşır.

   - aci     : ön kapağın sol menteşeden açılma açısı (0=kapalı, 145=tam
     açık). KapakEkrani sürükleme sırasında bunu 1:1 parmakla sürer;
     backface gizli olduğundan 90°'yi geçince kapak kaybolur ve altındaki
     sıcak "ilk sayfa" görünür. HomeScreen'de daima 0 (kapalı durur).
   - gecisli : true iken açı değişimi CSS transition ile yumuşar (bırakınca
     tamamlama/geri-yerine-oturma); sürükleme sırasında false → parmakla
     birebir, sıçramasız takip.
=============================================================== */
function KapakGovdesi({ aci = 0, gecisli = true }) {
  return (
    <div className="relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
      {/* Rafa/masaya düşen yumuşak gölge */}
      <div
        className="absolute -bottom-4 left-1/2 h-5 w-[86%] -translate-x-1/2 rounded-[50%] blur-lg"
        style={{ background: 'rgba(50,30,18,0.35)' }}
      />

      {/* SAYFA YIĞINI — sağ ve altta hafif taşan krem sayfa kenarı
          (gerçek kitap hissi: kapak, sayfaların biraz önünde durur).
          DÜZ krem: çizgili doku kaldırıldı — kapak açılınca sağda boydan
          boya çizgili şerit görünüyordu. */}
      <div
        className="absolute inset-0 translate-x-[0.9%] translate-y-[0.7%] rounded-l-md rounded-r-lg"
        style={{
          background: '#f3e7cf',
          boxShadow: '0 12px 24px rgba(60,40,20,0.28)',
        }}
      />

      {/* İÇERİ (açılınca görünen sıcak "ilk sayfa") */}
      <div className="absolute inset-0 overflow-hidden rounded-l-2xl rounded-r-md bg-krem">
        {/* sıcak ışık havuzu — açı arttıkça belirir (ilk ~70°'de tam görünür) */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: Math.max(0, Math.min(1, aci / 70)),
            background:
              'radial-gradient(circle at 35% 50%, rgba(255,221,150,0.95), rgba(255,246,233,0.6) 60%, rgba(255,246,233,0) 100%)',
          }}
        />
        {/* (İnce sayfa çizgileri kaldırıldı — açılan kapağın altındaki ilk
            sayfa düz, sıcak krem kalır; sağdaki çizgili görünüm istenmedi.) */}
      </div>

      {/* ÖN KAPAK — kapak.jpg (sağ yarı); sol menteşeden açılır.
          backface gizli: 90°'yi geçince görünmez olur → içeri belirir. */}
      <div
        className="absolute inset-0 origin-left overflow-hidden rounded-l-2xl rounded-r-md"
        style={{
          transform: `rotateY(-${aci}deg)`,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          transition: gecisli ? 'transform 780ms cubic-bezier(0.55,0,0.35,1)' : 'none',
          boxShadow:
            '0 18px 34px rgba(50,30,18,0.4), inset 0 2px 3px rgba(255,255,255,0.25)',
        }}
      >
        {/* Kapak görseli (dolu SAĞ yarı: object-position right + cover) */}
        <img
          src={kapakGorsel}
          alt="Işıl'ın Değerli Dünyası — Sevgi"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none"
          style={{ objectFit: 'cover', objectPosition: 'right center' }}
        />

        {/* CİLT (spine) — sol kenarda koyu, hafif yuvarlak şerit */}
        <div
          className="absolute inset-y-0 left-0 w-[9%] rounded-l-2xl"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.34), rgba(0,0,0,0.12) 55%, rgba(255,255,255,0.14))',
          }}
        />
        {/* Diyagonal ışık parlaması (sheen) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-l-2xl rounded-r-md"
          style={{
            background:
              'linear-gradient(125deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 44%)',
          }}
        />
      </div>
    </div>
  )
}

export default KapakGovdesi
