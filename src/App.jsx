import { useState } from 'react'
import { Howler } from 'howler'
import LoadingScreen from './components/screens/LoadingScreen.jsx'
import HomeScreen from './components/screens/HomeScreen.jsx'
import BookReader from './components/book/BookReader.jsx'
import useHareketAzalt from './hooks/useHareketAzalt.js'

/**
 * App: Uygulamanın en üst bileşeni.
 *
 * Görevleri:
 *  1. EKRAN YÖNETİMİ (uiDurumu): üç katman arasında geçiş
 *       'loading' -> 'home' -> 'book' -> 'home' ...
 *  2. PAYLAŞILAN AYARLAR: ses, müzik, "hareketleri azalt".
 *     Bu üç değer hem giriş ekranında hem kitapta geçerli olduğu için
 *     en üstte (burada) tutulur; yoksa ekranlar arası tutarsız olurdu.
 *  3. Telefon dik tutulduğunda "cihazını çevir" uyarısı (yatay zorunlu).
 *
 * React Router YOK; basit useState ile yönetiyoruz (plan gereği).
 */
function App() {
  // Hangi katmandayız? 'loading' = açılış, 'home' = kitaplık, 'book' = okuyucu
  const [uiDurumu, setUiDurumu] = useState('loading')

  // Açılan kitabın id'si ('sevgi' vb.) — 'book' durumunda kullanılır
  const [aktifKitapId, setAktifKitapId] = useState(null)

  // Ses açık mı? Howler.mute() TÜM sesleri tek seferde susturur.
  const [soundOn, setSoundOn] = useState(true)
  // Arka plan müziği (şimdilik placeholder; ileride çalınacak)
  const [muzik, setMuzik] = useState(true)
  // Uygulama içi "hareketleri azalt" anahtarı
  const [hareketAzaltAyar, setHareketAzaltAyar] = useState(false)

  // OS düzeyindeki "reduce motion" tercihi
  const osHareketAzalt = useHareketAzalt()
  // Etkin değer: kullanıcı anahtarı VEYA OS tercihi
  const hareketAzalt = hareketAzaltAyar || osHareketAzalt

  // Ses aç/kapat
  const toggleSound = () => {
    setSoundOn((onceki) => {
      Howler.mute(onceki) // açıksa sustur, kapalıysa aç
      return !onceki
    })
  }

  // --- KATMAN GEÇİŞLERİ ---
  const yuklemeBitti = () => setUiDurumu('home') // loading -> home
  const kitapSec = (kitapId) => {
    setAktifKitapId(kitapId)
    setUiDurumu('book') // home -> book
  }
  const kitapligaDon = () => setUiDurumu('home') // book -> home

  return (
    // hareketAzalt açıksa ".hareketsiz" tüm CSS animasyon/geçişlerini durdurur
    <div className={`h-dvh w-dvw ${hareketAzalt ? 'hareketsiz' : ''}`}>
      {/* ----- DİKEY MOD UYARISI -----
          Sadece telefon dik tutulunca görünür (.dikey-uyari, index.css). */}
      <div className="dikey-uyari fixed inset-0 z-[60] flex-col items-center justify-center gap-6 bg-gece text-center">
        <div className="animate-sallan text-7xl">📱</div>
        <p className="px-8 font-baslik text-3xl font-bold text-krem">
          Cihazını yan çevir!
        </p>
        <p className="px-8 text-lg text-gokyuzu">Kitabımız yatay modda okunuyor 🌸</p>
      </div>

      {/* ----- AKTİF KATMAN ----- */}
      {uiDurumu === 'loading' && <LoadingScreen onReady={yuklemeBitti} hareketAzalt={hareketAzalt} />}

      {uiDurumu === 'home' && (
        <HomeScreen
          onSelectKitap={kitapSec}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          muzik={muzik}
          onToggleMuzik={() => setMuzik((o) => !o)}
          hareketAzalt={hareketAzaltAyar}
          onToggleHareket={() => setHareketAzaltAyar((o) => !o)}
        />
      )}

      {uiDurumu === 'book' && (
        <BookReader
          kitapId={aktifKitapId}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          onHome={kitapligaDon}
          hareketAzalt={hareketAzalt}
        />
      )}
    </div>
  )
}

export default App
