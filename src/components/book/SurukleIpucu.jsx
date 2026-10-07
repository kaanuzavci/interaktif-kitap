import { useEffect, useRef } from 'react'
import Lottie from 'lottie-react'
import tutAnimasyon from '../../assets/animations/dokunma_animasyon/tut.json'
import { useKitapDuraklat } from '../../hooks/kitapDuraklat.js'

// ESM / CommonJS compatibility wrapper for Vite
const LottieComponent = Lottie && (Lottie.default || Lottie);

/* ===============================================================
   DOKUN/SÜRÜKLE İPUCU — Lottie tabanlı dokunma ve sürükleme animasyonu

   Sürüklenebilir/etkileşimli bir öğenin (sayfa3 Işıl, sayfa4 uçurtma)
   ÜZERİNDE durur. Lottie animasyonunda dokunma halkaları, oklar ve
   sürükleme hareketi mevcuttur.

   ANKRAJ: verilen (left/top) koordinatının animasyondaki parmak ucuna /
   dokunma dairesi merkezine (≈ %55 yatay, %60 dikey) denk gelmesi için
   translate(-55%, -60%) kullanılır.

   YAŞAM DÖNGÜSÜ: İlk tutuşa kadar görünür; nesne bir kez tutulunca sahne bu
   ipucunu kaldırır. pointer-events-none ile altındaki nesnenin tutulmasını engellemez.
=============================================================== */
function SurukleIpucu({ style }) {
  // Kitap duraklatılınca Lottie de durur (CSS değil, JS animasyonu olduğu
  // için .kitap-duraklat sınıfı onu yakalayamaz; ref ile durduruyoruz).
  const lottieRef = useRef(null)
  const duraklatildi = useKitapDuraklat()
  useEffect(() => {
    const l = lottieRef.current
    if (!l) return
    if (duraklatildi) l.pause()
    else l.play()
  }, [duraklatildi])

  return (
    <div
      className="pointer-events-none absolute surukle-ipucu-container"
      style={{
        width: '13.5cqw',
        height: '13.5cqw',
        transform: 'translate(-55%, -60%)',
        willChange: 'transform',
        filter: 'drop-shadow(0 0.4cqw 0.5cqw rgba(50,30,15,0.25))',
        ...style,
      }}
    >
      <style>{`
        .surukle-ipucu-container,
        .surukle-ipucu-container * {
          overflow: visible !important;
          clip-path: none !important;
        }
      `}</style>
      <LottieComponent
        lottieRef={lottieRef}
        animationData={tutAnimasyon}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

export default SurukleIpucu


