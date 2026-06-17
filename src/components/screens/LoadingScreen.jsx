import { useEffect, useState } from 'react'
import IsilYurume from '../characters/IsilYurume.jsx'
import arkaPlan from '../../assets/backgrounds/arka_plan.jpg'
import cimen from '../../assets/backgrounds/cimen.png'

/* ===============================================================
   YÜKLEME EKRANI

   Site ilk açıldığında ağır görseller (arka planlar, Işıl kareleri)
   tarayıcı önbelleğine alınırken klasik spinner yerine Işıl'ı
   YERİNDE yürürken gösteririz. Altında çocuk dostu bir ifade ve
   gerçek yüzdeyle dolan yuvarlak bir ilerleme çubuğu vardır.

   Akış:
   1. Kritik görselleri new Image() ile önyükle, yüklendikçe % artır.
   2. Hepsi bitince (ve en az MIN_SURE geçince) yumuşakça soluklaş.
   3. Soluklaşma bitince onReady() ile giriş ekranına devret.

   prefers-reduced-motion / "hareketleri azalt" açıksa: yürüyüş
   durur, Işıl ilk karede statik durur (App'ten gelen hareketAzalt).
=============================================================== */

// Sahnelere gömülü Işıl yürüme kareleri (IsilYurume da kullanıyor)
const kareModulleri = import.meta.glob(
  '../../assets/characters/isil-yurume/*.png',
  { eager: true, import: 'default' },
)

// Önyüklenecek kritik görsellerin url listesi:
// giriş ekranı saf CSS olduğu için ağır görsel yok; kritik olan ilk
// bölümün taban arka planı + ön çimen + Işıl'ın tüm kareleridir.
const KRITIK_GORSELLER = [arkaPlan, cimen, ...Object.values(kareModulleri)]

// Çok hızlı yüklemelerde ekran "çakıp" geçmesin diye minimum süre (ms)
const MIN_SURE = 1500
// Bir görsel takılırsa sonsuza kadar beklemeyelim (güvenlik, ms)
const MAX_SURE = 8000

function LoadingScreen({ onReady, hareketAzalt = false }) {
  // 0–100 arası gerçek yükleme yüzdesi
  const [yuzde, setYuzde] = useState(0)
  // Çıkış (soluklaşma) başladı mı?
  const [cikis, setCikis] = useState(false)

  // --- GERÇEK ÖNYÜKLEME + İLERLEME ---
  useEffect(() => {
    const baslangic = Date.now()
    let yuklenen = 0
    const toplam = KRITIK_GORSELLER.length || 1
    let bitti = false

    const birBitti = () => {
      yuklenen += 1
      setYuzde(Math.round((yuklenen / toplam) * 100))
      if (yuklenen >= toplam) tamamla()
    }

    // Hepsi yüklenince (veya güvenlik süresi dolunca): min süreyi bekle, sonra çık
    const tamamla = () => {
      if (bitti) return
      bitti = true
      const gecen = Date.now() - baslangic
      const kalan = Math.max(0, MIN_SURE - gecen)
      setTimeout(() => {
        setYuzde(100)
        setCikis(true) // soluklaşmayı başlat
      }, kalan)
    }

    // Görselleri yükle (cache'lenmişler anında onload tetikler)
    KRITIK_GORSELLER.forEach((url) => {
      const img = new Image()
      img.onload = birBitti
      img.onerror = birBitti // hata olsa da ilerlemeyi tıkamayalım
      img.src = url
    })

    // Güvenlik: bir şey takılırsa yine de devam et
    const guvenlik = setTimeout(tamamla, MAX_SURE)
    return () => clearTimeout(guvenlik)
  }, [])

  // --- SOLUKLAŞMA BİTİNCE DEVRET ---
  // cikis=true olunca CSS 500ms'de opacity'yi düşürür; sonra onReady.
  useEffect(() => {
    if (!cikis) return
    const t = setTimeout(() => onReady?.(), 520)
    return () => clearTimeout(t)
  }, [cikis, onReady])

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${cikis ? 'opacity-0' : 'opacity-100'
        }`}
    >
      {/* Pastel gökyüzü — giriş ekranıyla aynı atmosfer, sade */}
      <div className="absolute inset-0 bg-gradient-to-b from-gokyuzu via-[#eaf5ff] to-krem" />
      {/* Merkeze yumuşak ışık */}
      <div className="absolute left-1/2 top-1/2 h-[70%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl" />

      {/* İçerik */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        {/* Işıl yerinde yürür (hareket azaltılmışsa ilk karede durur) */}
        <div className="flex items-end justify-center" style={{ height: 'clamp(120px, 26vh, 280px)' }}>
          <IsilYurume isPlaying={!hareketAzalt} width="clamp(110px, 22vh, 240px)" />
        </div>

        {/* Çocuk dostu ifade */}
        <p className="font-baslik text-2xl font-extrabold text-gece drop-shadow-[1px_2px_0_rgba(255,255,255,0.8)] md:text-3xl">
          Işıl hazırlanıyor… 🌸
        </p>

        {/* Yuvarlak, dolan ilerleme çubuğu (gerçek yüzdeye bağlı) */}
        <div
          className="h-4 w-64 overflow-hidden rounded-full border-2 border-white/80 bg-white/50 shadow-inner md:w-80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={yuzde}
          aria-label="Yükleniyor"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-gunes via-seker to-seker transition-[width] duration-300 ease-out"
            style={{ width: `${yuzde}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
