import Lottie from 'lottie-react'
import kaydirmaHam from '../../assets/animations/sayfa_kaydirma_animasyon/sayfa_kaydirma.json'

// ESM / CommonJS compatibility wrapper for Vite
const LottieComponent = Lottie && (Lottie.default || Lottie)

// Kaynak Lottie'nin İKİ kusuru kopya üstünde düzeltilir (dosya değişmez):
//
// 1) "Vector 536": elin YARI-SAYDAM (%20 opaklık) gölge/hayalet kopyası.
//    Dolu bir görselin üstüne binince altı saydam elin içinden göründüğü
//    için el "arkada/gömülü" gibi dururdu → opaklığı 0'a çekilir.
//
// 2) BOZUK MATTE: el aslında PNG'dir ("Rectangle 9941" görüntü katmanı) ve
//    üzerinde alpha matte ("Rectangle 9941 (Mask)") vardır. Ancak süpürme
//    sırasında el ile maske TERS yönlere gider (el x:400→508→310, maske
//    x:400→292→490) → el, maskenin dışında kalan yerlerinden KIRPILIR ve
//    "arkaplana geçmiş" gibi görünür. Maske t0'da elin sınırlarıyla birebir
//    örtüştüğünden hiçbir görsel katkısı yok: matte katmanı (td=1) atılır,
//    görüntü katmanının tt referansı silinir → el hiçbir karede kırpılmaz.
const kaydirmaAnimasyonu = {
  ...kaydirmaHam,
  layers: (kaydirmaHam.layers || [])
    .filter((l) => l.td !== 1)
    .map((l) => {
      if (l.nm === 'Vector 536') return { ...l, ks: { ...l.ks, o: { a: 0, k: 0 } } }
      if (l.tt != null) {
        const { tt, ...kalan } = l
        return kalan
      }
      return l
    }),
}

/* ===============================================================
   SAYFA KAYDIRMA İPUCU — sayfanın nasıl çevrileceğini (sağ kısmı tutup
   sola sürükleyerek) gösteren Lottie animasyonu.

   Kaynak animasyon (800×600) bir elin SAĞDAN SOLA kaydırdığını gösterir —
   yani "sağ sayfayı tut, sola çevir" (ileri) hareketi. Sürekli döngüde
   oynar; pointer-events yok (altındaki gerçek sürükleme bölgesini engellemez).

   KONUM/BOYUT: varsayılan yerleşim spread ortasına oturur; çağıran `style`
   ile (left/top/width) istediği yere taşıyabilir (örn. sayfa0 sağ sayfası).
=============================================================== */
function SayfaKaydirmaIpucu({ style }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        width: '68%',
        aspectRatio: '4 / 3',
        left: '50%',
        top: '60%',
        transform: 'translate(-50%, -50%)',
        filter: 'drop-shadow(0 0.4vmin 0.6vmin rgba(50,30,15,0.3))',
        ...style,
      }}
    >
      <LottieComponent
        animationData={kaydirmaAnimasyonu}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

export default SayfaKaydirmaIpucu
