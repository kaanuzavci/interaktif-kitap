import { useState } from 'react'
import { Howler } from 'howler'
import HomeScreen from './components/screens/HomeScreen.jsx'
import Book from './components/Book.jsx'

/**
 * App: Uygulamanın en üst bileşeni.
 *
 * Görevleri:
 *  1. EKRAN YÖNETİMİ: Hangi ekran görünüyor? "home" (giriş) / "book" (kitap)
 *  2. SES DURUMU: Açık/kapalı. İki ekran da aynı butonu paylaştığı için
 *     ses state'i burada tutuluyor (yoksa ekranlar arası tutarsız olurdu).
 *  3. Telefon dik tutulduğunda "cihazını çevir" uyarısı göstermek.
 *
 * React Router YOK; basit bir useState ile ekran geçişi yapıyoruz.
 */
function App() {
  // Hangi ekrandayız? "home" = giriş ekranı, "book" = kitap okuma
  const [screen, setScreen] = useState('home')

  // Hangi bölüm seçildi? (şimdilik sadece "sevgi" var; ileride bu
  // değere göre Book farklı bölüm yükleyebilir)
  const [aktifBolum, setAktifBolum] = useState(null)

  // Ses açık mı? Howler.mute() TÜM sesleri tek seferde susturur.
  const [soundOn, setSoundOn] = useState(true)

  // Ses butonuna basılınca: durumu tersine çevir ve Howler'a bildir
  const toggleSound = () => {
    setSoundOn((onceki) => {
      Howler.mute(onceki) // ses açıksa sustur, kapalıysa aç
      return !onceki
    })
  }

  // Giriş ekranında bir bölüm kartına tıklanınca: kitabı aç
  const bolumSec = (bolumId) => {
    setAktifBolum(bolumId)
    setScreen('book')
  }

  // Kitaptan ana menüye dönüş
  const anaMenuyeDon = () => setScreen('home')

  return (
    <div className="h-dvh w-dvw">
      {/* ----- DİKEY MOD UYARISI -----
          ".dikey-uyari" sınıfı index.css'te tanımlı:
          sadece telefon dik tutulunca görünür hale gelir. */}
      <div className="dikey-uyari fixed inset-0 z-50 flex-col items-center justify-center gap-6 bg-gece text-center">
        {/* Dönen telefon emojisi */}
        <div className="animate-sallan text-7xl">📱</div>
        <p className="px-8 font-baslik text-3xl font-bold text-krem">
          Cihazını yan çevir!
        </p>
        <p className="px-8 text-lg text-gokyuzu">
          Kitabımız yatay modda okunuyor 🌸
        </p>
      </div>

      {/* ----- AKTİF EKRAN -----
          screen state'ine göre giriş ekranı veya kitap gösterilir. */}
      {screen === 'home' ? (
        <HomeScreen
          onSelectBolum={bolumSec}
          soundOn={soundOn}
          onToggleSound={toggleSound}
        />
      ) : (
        <Book
          bolum={aktifBolum}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          onHome={anaMenuyeDon}
        />
      )}
    </div>
  )
}

export default App
