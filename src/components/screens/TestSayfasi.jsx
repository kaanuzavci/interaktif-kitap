import Sahne from '../book/Sahne.jsx'
import { SEVGI_SAHNELERI } from '../../data/sevgiSahneleri.js'
import IsilCicek from '../characters/IsilCicek.jsx'
import CicekCanim from '../characters/CicekCanim.jsx'

/* ===============================================================
   TEST SAYFASI — yalnızca geliştirici doğrulaması için (?test)

   Amaç:
   1. 2. sahnenin tam kompozisyonunu (arka_plan2 + kalemler + Işıl +
      Canım) gerçek Sahne bileşeniyle önizlemek.
   2. Yeni animasyonların düzgün oynadığını görmek.
   3. KRİTİK: Işıl (isil2) karelerinin arka planının gerçekten ŞEFFAF
      olduğunu doğrulamak. Bunun için Işıl YÜKSEK KONTRASTLI bir zemine
      (macenta + dama tahtası) bindirilir; kareler siyah zeminli olsaydı
      burada apaçık bir siyah dikdörtgen görünürdü.

   Erişim: uygulamayı `?test` ile aç (ör. http://localhost:5173/?test)
=============================================================== */

// Dama tahtası deseni (şeffaflığı gözle test etmek için)
const dama = {
  backgroundImage:
    'linear-gradient(45deg, #bbb 25%, transparent 25%), linear-gradient(-45deg, #bbb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #bbb 75%), linear-gradient(-45deg, transparent 75%, #bbb 75%)',
  backgroundSize: '28px 28px',
  backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0px',
  backgroundColor: '#fff',
}

function Etiket({ children }) {
  return (
    <div className="absolute left-2 top-2 z-50 rounded-full bg-black/70 px-3 py-1 font-baslik text-xs font-bold text-white">
      {children}
    </div>
  )
}

function TestSayfasi() {
  const sahne2 = SEVGI_SAHNELERI[1]

  const testParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('test')
      : null

  // ?test=full / ?test=sahneN → ilgili sahne, tam ekran 16:9 (hedef görselle
  // birebir çerçeveleme; konum karşılaştırması için). full = 2. sahne (eski).
  const sahneEsleme = { full: 1, sahne1: 0, sahne2: 1, sahne3: 2 }
  if (testParam in sahneEsleme) {
    const sahne = SEVGI_SAHNELERI[sahneEsleme[testParam]]
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="relative overflow-hidden" style={{ width: '100vw', aspectRatio: '16 / 9' }}>
          <Sahne sahne={sahne} canli />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-[#2b2b3a] p-4 text-white">
      <h1 className="mb-3 font-baslik text-xl font-bold">🧪 2. Sayfa — Animasyon Testi</h1>

      {/* ===== 1) GERÇEK KOMPOZİSYON ÖNİZLEME (16:9) ===== */}
      <p className="mb-1 font-metin text-sm opacity-80">
        1) Tam kompozisyon (arka_plan2 + kalemler + Işıl + Canım):
      </p>
      <div
        className="relative mx-auto mb-6 overflow-hidden rounded-xl shadow-2xl"
        style={{ width: 'min(92vw, calc(70vh * 16 / 9))', aspectRatio: '16 / 9' }}
      >
        <Sahne sahne={sahne2} canli />
      </div>

      {/* ===== 2) ŞEFFAFLIK + ANİMASYON SWATCH'LARI ===== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Işıl — şeffaflık testi (macenta + dama) */}
        <div>
          <p className="mb-1 font-metin text-sm opacity-80">
            2) Işıl şeffaflık testi — zemin macenta + dama (siyah kutu görünMEmeli):
          </p>
          <div className="flex overflow-hidden rounded-xl" style={{ aspectRatio: '16 / 9' }}>
            {/* sol yarı: macenta */}
            <div className="relative h-full w-1/2" style={{ backgroundColor: '#ff00aa' }}>
              <Etiket>macenta</Etiket>
              <IsilCicek width="100%" className="h-full w-full" style={{ objectFit: 'contain' }} />
            </div>
            {/* sağ yarı: dama tahtası */}
            <div className="relative h-full w-1/2" style={dama}>
              <Etiket>dama</Etiket>
              <IsilCicek width="100%" className="h-full w-full" style={{ objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* Canım — döngü testi (dama zemin) */}
        <div>
          <p className="mb-1 font-metin text-sm opacity-80">
            3) Canım döngü testi — zemin dama (göz kırpma/şarkı döngüsü):
          </p>
          <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '16 / 9', ...dama }}>
            <Etiket>dama</Etiket>
            <div className="absolute left-1/2 top-1/2 h-[92%] -translate-x-1/2 -translate-y-1/2">
              <CicekCanim
                width="auto"
                className="h-full"
                style={{ height: '100%', width: 'auto' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestSayfasi
