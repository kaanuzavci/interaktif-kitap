import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import bitisGorseli from '../../assets/backgrounds/sayfa12/bitis.webp'

/* ===============================================================
   BİTİŞ EKRANI — kitabın SON sayfası kutlaması

   Son sayfadaki çiçeğe dokunulup animasyon başladıktan sonra (bkz.
   hooks/kitapBitis.js) BookReader bu katmanı gösterir: sayfanın
   üstüne doğru yükselen, kitabı tam kaplamayan bitis.png görseli
   (el sallayan karakter + "Kitaba Dön" konuşma balonu) + kenarlardan
   süzülen sabun köpükleri. Görselin İÇİNDEKİ "Kitaba Dön" yazılı
   bölüme dokununca (görünmez buton, KITABA_DON_ALANI ile hizalı)
   kitap KAPAĞINA dönülür (kapaktan tekrar açılınca baştan okunur).
=============================================================== */

// 🫧 SABUN KÖPÜĞÜ dolgusu — sol-üstte parlayan, saydam, mavimsi köpük.
const BALON_ARKA =
  'radial-gradient(circle at 30% 26%, rgba(255,255,255,0.95) 0%, ' +
  'rgba(255,255,255,0.5) 12%, rgba(255,255,255,0.12) 30%, ' +
  'rgba(200,225,255,0.10) 62%, rgba(255,255,255,0.05) 100%)'
const BALON_GOLGE =
  'inset 0 0 18px rgba(255,255,255,0.35), ' +
  'inset 6px 8px 16px rgba(255,255,255,0.25), ' +
  '0 0 14px rgba(175,205,255,0.30)'

// Baloncuk düzeni — SOL ve SAĞ kenar için ayrı diziler. Her biri:
//   yan     : kenardan uzaklık (%)          boyut : çap (vmin)
//   sure    : bir yükseliş turu (sn)        gecikme: başlama gecikmesi (sn)
//   drift   : tepede yatay kayış (px, +sağ) opak  : tepe opaklığı
const SOL_BALONLAR = [
  { yan: 3, boyut: 9, sure: 12, gecikme: 0, drift: 26, opak: 0.78 },
  { yan: 9, boyut: 6, sure: 10, gecikme: 1.6, drift: 40, opak: 0.62 },
  { yan: 1, boyut: 11, sure: 15, gecikme: 3.2, drift: 18, opak: 0.7 },
  { yan: 12, boyut: 5, sure: 9, gecikme: 4.6, drift: 34, opak: 0.55 },
  { yan: 5, boyut: 7, sure: 13, gecikme: 6, drift: 30, opak: 0.66 },
  { yan: 15, boyut: 4, sure: 8, gecikme: 2.4, drift: 22, opak: 0.5 },
]
const SAG_BALONLAR = [
  { yan: 3, boyut: 10, sure: 13, gecikme: 0.8, drift: -24, opak: 0.78 },
  { yan: 9, boyut: 6, sure: 10, gecikme: 2.2, drift: -38, opak: 0.62 },
  { yan: 1, boyut: 8, sure: 14, gecikme: 3.8, drift: -18, opak: 0.7 },
  { yan: 12, boyut: 5, sure: 9, gecikme: 5.2, drift: -32, opak: 0.55 },
  { yan: 6, boyut: 7, sure: 12, gecikme: 6.4, drift: -28, opak: 0.64 },
  { yan: 15, boyut: 4, sure: 8, gecikme: 1.2, drift: -20, opak: 0.5 },
]

function Balon({ kenar, b }) {
  return (
    <span
      className="pointer-events-none absolute rounded-full"
      style={{
        [kenar]: `${b.yan}%`,
        bottom: '-14%',
        width: `${b.boyut}vmin`,
        height: `${b.boyut}vmin`,
        background: BALON_ARKA,
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: BALON_GOLGE,
        // CSS değişkenleri balonYuksel keyframe'i tarafından okunur (index.css)
        '--b-drift': `${b.drift}px`,
        '--b-opak': b.opak,
        animation: `balonYuksel ${b.sure}s ease-in ${b.gecikme}s infinite`,
        willChange: 'transform, opacity',
      }}
    >
      {/* Parlama noktası (sabun köpüğü hissi) */}
      <span
        className="absolute rounded-full"
        style={{
          left: '22%',
          top: '16%',
          width: '28%',
          height: '22%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)',
        }}
      />
    </span>
  )
}

// Görsel içindeki "Kitaba Dön" konuşma-balonu düğmesinin, görselin
// kendi kutusuna göre oranı (piksel taramasıyla ölçüldü, dokunma payı
// eklendi). Görsel boyutu değişse de oran aynı kalır.
const KITABA_DON_ALANI = { left: '27%', top: '67%', width: '46%', height: '12%' }

function BitisEkrani({ onKitabaDon }) {
  // 🎉 KONFETİ — açılışta ekranın sağ/sol alt köşesinden iki patlama
  // (baloncuk temasıyla uyumlu, "kenarlardan gelme" hissi). Hareket
  // azalt modunda otomatik atlanır; unmount'ta kalıntı temizlenir.
  useEffect(() => {
    const ortak = {
      zIndex: 9999,
      disableForReducedMotion: true,
      colors: ['#ffd166', '#ff8fab', '#bde3ff', '#9bde7e', '#ffffff', '#37a6e4'],
    }
    confetti({ ...ortak, particleCount: 90, spread: 75, angle: 60, origin: { x: 0.02, y: 0.85 } })
    confetti({ ...ortak, particleCount: 90, spread: 75, angle: 120, origin: { x: 0.98, y: 0.85 } })
    const t = setTimeout(
      () =>
        confetti({
          ...ortak,
          particleCount: 60,
          spread: 120,
          startVelocity: 30,
          scalar: 0.9,
          shapes: ['star'],
          origin: { x: 0.5, y: 0.2 },
        }),
      300,
    )
    return () => {
      clearTimeout(t)
      confetti.reset()
    }
  }, [])

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Tebrikler, kitabı bitirdin"
      // Yumuşak koyu perde — arkadaki kitap hafifçe görünür kalır.
      style={{ background: 'radial-gradient(ellipse at center, rgba(40,30,60,0.35), rgba(30,22,45,0.6))' }}
    >
      {/* ===== BALONCUKLAR — ekranın sağ/sol kenarından yukarı süzülür ===== */}
      <div className="pointer-events-none absolute inset-0">
        {SOL_BALONLAR.map((b, i) => (
          <Balon key={`sol-${i}`} kenar="left" b={b} />
        ))}
        {SAG_BALONLAR.map((b, i) => (
          <Balon key={`sag-${i}`} kenar="right" b={b} />
        ))}
      </div>

      {/* ===== BİTİŞ GÖRSELİ — sayfanın üstüne doğru yükselir, kitabı
          tam kaplamaz. "Kitaba Dön" balonu üstünde görünmez dokunma
          alanı var. ===== */}
      <div
        className="animate-pop relative z-10 inline-block"
        style={{
          height: 'min(80vh, 40rem)',
          filter: 'drop-shadow(0 20px 32px rgba(30,20,15,0.45))',
        }}
      >
        <img
          src={bitisGorseli}
          alt="Tebrikler, yeni maceralarda görüşmek üzere"
          draggable={false}
          style={{ height: '100%', width: 'auto', display: 'block' }}
        />
        <button
          type="button"
          onClick={onKitabaDon}
          aria-label="Kitaba dön"
          className="absolute rounded-full outline-none"
          style={KITABA_DON_ALANI}
        />
      </div>
    </div>
  )
}

export default BitisEkrani
