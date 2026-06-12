import { useState } from 'react'
import { Howler } from 'howler'
import Page1 from './pages/Page1.jsx'
import Page2 from './pages/Page2.jsx'
import NavArrow from './ui/NavArrow.jsx'
import SoundToggle from './ui/SoundToggle.jsx'

/**
 * SAYFA LİSTESİ
 * Kitaba yeni sayfa eklemek çok kolay:
 *  1. components/pages/ içine Page3.jsx oluştur
 *  2. Yukarıda import et
 *  3. Bu diziye ekle -> oklar ve geçişler otomatik çalışır
 * (Page2 şimdilik geçiş sistemini test etmek için duran bir taslak.)
 */
const pages = [Page1, Page2]

// Fade süresi (ms). index.css'teki --fade-sure ile aynı tutulmalı.
const FADE_SURESI = 400

/**
 * Book: Kitabın "beyni". Şunları yönetir:
 *  - currentPage : şu an hangi sayfadayız (0'dan başlar)
 *  - Sayfa geçişlerindeki fade (kararıp açılma) efekti
 *  - Ses açık/kapalı durumu
 *  - Sabit UI katmanı: ileri/geri okları ve ses butonu
 *    (Bunlar her sayfada ortak olduğu için tek tek sayfalara değil,
 *     buraya konuldu. Böylece her yeni sayfada tekrar yazmak gerekmez.)
 */
function Book() {
  // Şu an gösterilen sayfanın indeksi (0 = ilk sayfa)
  const [currentPage, setCurrentPage] = useState(0)

  // Fade efekti için: false olunca sayfa görünmez olur (opacity 0)
  const [isVisible, setIsVisible] = useState(true)

  // Ses açık mı? Howler.mute() TÜM sesleri tek seferde susturur.
  const [soundOn, setSoundOn] = useState(true)

  /**
   * Sayfa değiştirme - fade efektinin çalışma mantığı:
   *  1. isVisible = false  -> CSS transition ile sayfa yavaşça kaybolur
   *  2. FADE_SURESI kadar bekle (kaybolma tamamlansın)
   *  3. Sayfayı değiştir ve isVisible = true -> yeni sayfa yavaşça belirir
   */
  const goToPage = (pageIndex) => {
    // Geçersiz sayfa numaralarını engelle (kitabın dışına çıkma!)
    if (pageIndex < 0 || pageIndex >= pages.length) return

    setIsVisible(false) // 1. adım: kaybol

    setTimeout(() => {
      setCurrentPage(pageIndex) // 2. adım: sayfayı değiştir
      setIsVisible(true)        // 3. adım: belir
    }, FADE_SURESI)
  }

  // Okların kullandığı kısayol fonksiyonlar
  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  // Ses butonuna basılınca: durumu tersine çevir ve Howler'a bildir
  const toggleSound = () => {
    setSoundOn((onceki) => {
      Howler.mute(onceki) // ses açıksa sustur, kapalıysa aç
      return !onceki
    })
  }

  // Gösterilecek sayfa component'ini diziden seç
  const CurrentPageComponent = pages[currentPage]

  return (
    /* DIŞ KAPSAYICI: ekranın tamamı. Sahne taşan kısmı gizlenir. */
    <div className="relative h-full w-full overflow-hidden bg-gece">
      {/* ----- SAHNE (16:9, "kapla" modu) -----
          Arka plan görsellerimiz 16:9 oranında çizildi. Sahne sabit
          16:9 kalıyor ki içindeki TÜM yüzde koordinatlar (Işıl'ın
          rotası vb.) her ekranda resimle birebir hizalansın.
          max(): sahne, ekranı TAMAMEN kaplayan en küçük 16:9
          dikdörtgen olur. Ekran tam 16:9 değilse kenarlardan birazı
          taşar ve kırpılır - ama boş şerit hiç kalmaz. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'max(100vw, calc(100vh * 16 / 9))',
          height: 'max(100vh, calc(100vw * 9 / 16))',
        }}
      >
        {/* ----- AKTİF SAYFA (fade efektli katman) -----
            opacity, isVisible state'ine göre değişir;
            transition-opacity sayesinde geçiş yumuşak olur. */}
        <div
          className={`h-full w-full transition-opacity duration-[var(--fade-sure)] ease-in-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <CurrentPageComponent />
        </div>
      </div>

      {/* ----- SABİT UI KATMANI (her sayfada aynı) -----
          Sahnenin DIŞINDA duruyorlar: sahne kenarlardan kırpılsa
          bile butonlar her zaman ekranın içinde kalır. */}

      {/* Ses aç/kapat - sol üst köşe */}
      <SoundToggle soundOn={soundOn} onToggle={toggleSound} />

      {/* Geri oku - sol kenar (ilk sayfadaysak gizlenir) */}
      <NavArrow
        direction="prev"
        onClick={prevPage}
        hidden={currentPage === 0}
      />

      {/* İleri oku - sağ kenar (son sayfadaysak gizlenir) */}
      <NavArrow
        direction="next"
        onClick={nextPage}
        hidden={currentPage === pages.length - 1}
      />
    </div>
  )
}

export default Book
