import Book from './components/Book.jsx'

/**
 * App: Uygulamanın en üst bileşeni.
 *
 * Görevleri:
 *  1. Kitabı (Book) tam ekran bir kapsayıcı içinde göstermek
 *  2. Telefon dik tutulduğunda "cihazını çevir" uyarısı göstermek
 *
 * İleride buraya eklenebilecekler:
 *  - Firebase ile giriş ekranı (bkz. src/services/firebase.js)
 *  - Bölüm seçme menüsü (Sevgi, Paylaşmak, Dürüstlük...)
 */
function App() {
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

      {/* ----- KİTAP ----- */}
      <Book />
    </div>
  )
}

export default App
