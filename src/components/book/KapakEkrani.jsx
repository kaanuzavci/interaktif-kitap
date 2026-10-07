import { useEffect, useRef, useState } from 'react'
import ortamArkaPlan from '../../assets/backgrounds/genel_arkaplan.jpg'
import { useHareketAzalt } from '../../hooks/useHareketAzalt.js'
import useSayfaSesi from '../../hooks/useSayfaSesi.js'
import { SAYFA_YUK, SAYFA_GEN } from './kapakOlcu.js'
import KapakGovdesi from './KapakGovdesi.jsx'
import SayfaKaydirmaIpucu from './SayfaKaydirmaIpucu.jsx'

/* ===============================================================
   KAPAK EKRANI — kitabın açılış kapağı (KAPALI kitap)

   Kullanıcı kitaplıktan bir kitap seçince (HomeScreen'de kitap ortaya gelip
   BİZİM kapağımıza dönüşür), okuyucu başlamadan ÖNCE ekranın ORTASINDA gerçek
   bir KAPALI kitap durur. Boyutu açık kitaptaki TEK sayfayla birebir (8:9).
   Görsel gövde paylaşımlı [KapakGovdesi] bileşenindedir.

   AÇILMA: TIKLAMA YOK — kapağı SÜRÜKLEYEREK açılır (gerçek bir kitabı açar
   gibi). Kapak sol menteşeli; sağdan sola sürükleyince (BookReader'daki
   "ileri" sayfa çevirmeyle aynı yön) kapak parmakla BİREBİR döner. Sürükleme
   sahne genişliğinin yarısını geçince (ESIK_FRAC) bırakınca tam açılır;
   geçmezse yumuşakça geri kapanır. İpucu iki parça: altta kısa bir metin
   ("Açmak için kapağı sürükle") + kapağın üzerinde sayfa0'daki sayfa çevirme
   ipucuyla AYNI parmakla kaydırma gösterimi (SayfaKaydirmaIpucu Lottie).
   İkisi de sürükleme başlayınca kaybolur, bırakılıp geri kapanınca döner.

   ARKA PLAN: HomeScreen geçişinden devam etsin diye ortam arka plan YAVAŞÇA
   belirir (fade-in) — "bir anda" yüklenmez, rahatsız etmez.
=============================================================== */

const ACILMA_MS = 820 // tam açılış animasyonu bitince onAc() çağrılır (ms)
const FULL_ACI = 145 // kapağın "tam açık" sayılan dönüş açısı (derece)
const ESIK_FRAC = 0.5 // sürüklemenin tamamlanması için gereken oran (kapak genişliğinin %'si)

function KapakEkrani({ onAc }) {
  const azalt = useHareketAzalt()
  // Kapağı açmak da bir "sayfa çevirme" — dokununca aynı ses çalar.
  const calSayfaSesi = useSayfaSesi()

  // 'giris' → mount fade/otur; 'bekle' → sürükleme bekleniyor.
  const [evre, setEvre] = useState('giris')
  // Sürükleme durumu: null (kapalı, dinlenmede) | { aci, suruyor, gecisli }
  const [surukle, setSurukle] = useState(null)
  // Tam açılış tamamlandı mı? (onAc() çağrılana kadar tekrar tetiklenmesin)
  const [tamamlandi, setTamamlandi] = useState(false)

  const kapakRef = useRef(null)
  const dragRef = useRef(null) // aktif sürükleme bilgisi (stale closure'sız okuma için)

  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setEvre('bekle')))
    return () => cancelAnimationFrame(r)
  }, [])

  // Anında (animasyonsuz) açılış — yalnızca hareket azalt modunda.
  const acAninda = () => {
    if (tamamlandi) return
    calSayfaSesi()
    setTamamlandi(true)
    onAc?.()
  }

  // --- SÜRÜKLEME (mouse + dokunmatik, Pointer Events) ---
  const surukleBasla = (e) => {
    if (tamamlandi) return
    if (azalt) { acAninda(); return }
    const birim = kapakRef.current ? kapakRef.current.clientWidth : 300
    dragRef.current = { startX: e.clientX, birim, aci: 0, hareket: false }
    window.addEventListener('pointermove', surukleHareket)
    window.addEventListener('pointerup', surukleBirak)
    e.preventDefault()
  }

  const surukleHareket = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    // Sol menteşeli kapak: SAĞDAN SOLA sürükleyince (dx<0) açılır.
    const ilerleme = Math.max(0, Math.min(1, -dx / d.birim))
    const aci = ilerleme * FULL_ACI
    d.aci = aci
    // İlk anlamlı harekette sürüklemeyi BAŞLAT (öncesinde salt dokunuş hiçbir şeyi tetiklemez)
    if (!d.hareket && Math.abs(dx) > 6) {
      d.hareket = true
      setSurukle({ aci, suruyor: true, gecisli: false })
    } else if (d.hareket) {
      setSurukle((s) => (s ? { ...s, aci, suruyor: true } : s))
    }
  }

  const surukleBirak = () => {
    window.removeEventListener('pointermove', surukleHareket)
    window.removeEventListener('pointerup', surukleBirak)
    const d = dragRef.current
    dragRef.current = null
    if (!d || !d.hareket) return // yalnızca dokunuldu, hiç sürüklenmedi → hiçbir şey değişmedi

    const tamamlanir = d.aci / FULL_ACI >= ESIK_FRAC
    if (tamamlanir) {
      calSayfaSesi()
      setTamamlandi(true)
      setSurukle({ aci: FULL_ACI, suruyor: false, gecisli: true })
      setTimeout(() => onAc?.(), ACILMA_MS)
    } else {
      setSurukle({ aci: 0, suruyor: false, gecisli: true })
      setTimeout(() => setSurukle(null), 420)
    }
  }

  // Sürükleme listener'ları kalmasın diye temizlik (güvenlik)
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', surukleHareket)
      window.removeEventListener('pointerup', surukleBirak)
    }
  }, [])

  const aci = surukle?.aci ?? 0
  const gecisli = surukle ? surukle.gecisli : true
  const girdi = evre !== 'giris'
  // İpucu (Lottie + "dokun" balonu): kapanık dinlenmede sürekli döner; parmak
  // aktif sürüklerken veya açılış tamamlanınca kaybolur.
  const ipucuGoster = !tamamlandi && !surukle?.suruyor

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Ortam arka plan — anında görünür: HomeScreen morph'unda AYNI arka plan
          zaten yavaşça belirmişti; burada 0'dan fade etmek handoff'ta karartma
          sıçraması yapardı. Doğrudan gösteririz → kusursuz devam. */}
      {/* Vinyet/gölge genel_arkaplan görselinin içinde → ekstra karartma yok. */}
      <img
        src={ortamArkaPlan}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Kapak — ekran ortasında, tek sayfa boyutunda kapalı kitap */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={kapakRef}
          role="button"
          tabIndex={0}
          onPointerDown={surukleBasla}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); acAninda() }
          }}
          aria-label="Kitabı açmak için kapağı sürükle"
          className="relative touch-none outline-none"
          style={{
            height: SAYFA_YUK,
            width: SAYFA_GEN,
            perspective: '2200px',
            cursor: tamamlandi ? 'default' : 'grab',
            // Ölçek sabit (1), sadece kısa fade → HomeScreen'deki morph'ta kapak
            // zaten tam boyutta belirmişti; burada sıçramadan devam eder.
            opacity: girdi ? 1 : 0,
            transition: 'opacity 280ms ease',
          }}
        >
          <KapakGovdesi aci={aci} gecisli={gecisli} />

          {/* SÜRÜKLE GÖSTERİMİ — sayfa0'daki sayfa çevirme ipucuyla AYNI
              Lottie (SayfaKaydirmaIpucu): el, kapağı sağdan sola süpürür.
              Kapağın SAĞ kenarına oturur (kavranıp çekilecek yer; Işıl'ın
              yüzünü/kalbi kapatmaz). Sürükleme başlayınca metin ipucuyla
              birlikte söner, bırakılıp geri kapanınca döner. pointer-events
              yok → kapağın sürükleme yüzeyini engellemez. (Hareket azalt
              modunda açılış tek dokunuş olduğundan gösterilmez —
              sayfa0'daki davranışla aynı.) */}
          {!azalt && !tamamlandi && (
            <SayfaKaydirmaIpucu
              style={{
                left: '76%',
                top: '44%',
                width: '58%',
                zIndex: 30,
                opacity: ipucuGoster ? 1 : 0,
                transition: 'opacity 300ms ease',
              }}
            />
          )}
        </div>
      </div>

      {/* "Dokun" ipucu — ekranın altına sabit; sürüklerken/açılınca kaybolur */}
      <div
        className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 transition-opacity duration-300"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))', opacity: ipucuGoster ? 1 : 0 }}
      >
        <span className="animate-sallan inline-flex items-center gap-2 rounded-full bg-gece/70 px-4 py-1.5 font-baslik text-sm font-bold text-white shadow-lg backdrop-blur-sm md:text-base">
          👆 Açmak için kapağı sürükle
        </span>
      </div>
    </div>
  )
}

export default KapakEkrani
