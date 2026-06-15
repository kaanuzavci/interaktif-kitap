import { useRef, useState } from 'react'
import { KITAPLAR } from '../../data/kitaplar.js'
import KitapKapak from '../ui/KitapKapak.jsx'
import Modal from '../ui/Modal.jsx'
import Toggle from '../ui/Toggle.jsx'
import IconButton from '../ui/IconButton.jsx'

/* ---------------------------------------------------------------
   YASAL METİNLER (placeholder) — yayın öncesi gerçekleriyle değişecek.
---------------------------------------------------------------- */
const YASAL_METINLER = {
  gizlilik: {
    baslik: 'Gizlilik Politikası',
    ikon: '🔒',
    metin:
      'Çocuklarımızın güvenliği önceliğimizdir. Uygulama kişisel veri toplamaz; ' +
      'ilerleme bilgileri yalnızca cihazda saklanır. (Taslak metin; yayın öncesi ' +
      'hukuki metinle güncellenecektir.)',
  },
  kullanim: {
    baslik: 'Kullanım Koşulları',
    ikon: '📜',
    metin:
      'Bu uygulama eğitim amaçlıdır ve 3-6 yaş çocuklar için tasarlanmıştır. ' +
      'İçeriklerin tüm hakları saklıdır; izinsiz çoğaltılamaz. (Taslak metin.)',
  },
  iletisim: {
    baslik: 'İletişim',
    ikon: '✉️',
    metin:
      'Görüş ve önerileriniz için bize ulaşın: iletisim@isililedegerler.com ' +
      '(Örnek adres — yayın öncesi güncellenecek.)',
  },
}

// Süzülen ışık zerrecikleri (rastgele konum/gecikme) — imza atmosferin parçası
const MOTELER = [
  { left: '12%', bottom: '22%', boyut: 8, gecikme: '0s' },
  { left: '28%', bottom: '30%', boyut: 5, gecikme: '1.5s' },
  { left: '46%', bottom: '18%', boyut: 7, gecikme: '3s' },
  { left: '63%', bottom: '34%', boyut: 5, gecikme: '0.8s' },
  { left: '78%', bottom: '24%', boyut: 9, gecikme: '2.2s' },
  { left: '88%', bottom: '30%', boyut: 6, gecikme: '4s' },
]

/**
 * HomeScreen: Giriş ekranı — "büyülü okuma köşesi" kitaplığı.
 *
 * Katmanlar:
 *  1. Sıcak (altın saat) atmosfer: degrade, ışık havuzu, zerrecikler
 *  2. İMZA ÖĞE: yukarıdan sarkan, nazikçe sallanan fener
 *  3. Ahşap raf üzerinde 4 kitap kapağı (1 aktif, 3 "yakında")
 *  4. Kitap seçim animasyonu: seçilen kitap rafta kalkıp ekran ortasına
 *     süzülür, büyür ve KAPAĞI AÇILIR; sonra okuyucuya geçilir
 *  5. Ayarlar (dişli → modal) + yasal footer
 *
 * Props (App'ten):
 *  - onSelectKitap : kitap açılma animasyonu bitince id ile çağrılır
 *  - soundOn / onToggleSound
 *  - muzik / onToggleMuzik
 *  - hareketAzalt / onToggleHareket  (uygulama içi anahtar)
 */
function HomeScreen({
  onSelectKitap,
  soundOn,
  onToggleSound,
  muzik,
  onToggleMuzik,
  hareketAzalt,
  onToggleHareket,
}) {
  const [ayarlarAcik, setAyarlarAcik] = useState(false)
  const [yasalAcik, setYasalAcik] = useState(null)

  // Seçim animasyonu durumu:
  // acilan = { id, transform } (merkeze süzülen kitap), evre = 'merkeze' | 'aciliyor'
  const [acilan, setAcilan] = useState(null)
  const [evre, setEvre] = useState(null)
  // Kilitli kitaba dokununca kısa sallanan kitabın id'si
  const [sallananId, setSallananId] = useState(null)

  // Her kitap kapağının dış sarmalayıcısına ref (merkeze taşımayı ölçmek için)
  const kapakRefleri = useRef({})

  // --- KİTAP SEÇİMİ ---
  const kitabaTiklandi = (kitap) => {
    if (acilan) return // zaten bir kitap açılıyor

    // Kilitli kitap: aç değil, kısa "çok yakında" geri bildirimi ver
    if (kitap.durum !== 'aktif') {
      setSallananId(kitap.id)
      setTimeout(() => setSallananId(null), 600)
      return
    }

    // Aktif kitap: rafta kalkıp ekran ortasına süzülecek.
    // Kapağın mevcut konumunu ölç → viewport merkezine taşıma vektörünü hesapla.
    const el = kapakRefleri.current[kitap.id]
    let transform = 'translate(0,0) scale(1.6)'
    if (el) {
      const r = el.getBoundingClientRect()
      const merkezX = window.innerWidth / 2
      const merkezY = window.innerHeight / 2
      const dx = merkezX - (r.left + r.width / 2)
      const dy = merkezY - (r.top + r.height / 2)
      // Hedef yükseklik ~ ekranın %64'ü → ölçek
      const olcek = Math.min(2.4, Math.max(1.3, (window.innerHeight * 0.64) / r.height))
      transform = `translate(${dx}px, ${dy}px) scale(${olcek})`
    }

    setAcilan({ id: kitap.id, transform })
    setEvre('merkeze')

    // 1) ~680ms: kitap ortaya geldi → kapağı aç
    setTimeout(() => setEvre('aciliyor'), 680)
    // 2) ~1430ms: kapak açıldı, ışık doldu → okuyucuya geç
    setTimeout(() => onSelectKitap?.(kitap.id), 1430)
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ============================================================
          ATMOSFER (z-0) — sıcak altın saat okuma köşesi
      ============================================================ */}
      {/* Degrade: üstte yumuşak gökyüzü, altta sıcak krem/şeftali */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fbe7c6] via-[#fde9d9] to-[#f7d9c4]" />
      {/* Geniş, yumuşak sıcak ışık havuzu (rafın arkası) */}
      <div className="absolute left-1/2 top-[58%] h-[80%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gunes/25 blur-3xl" />
      {/* Üst köşelerde hafif koyulaşma (vinyet → derinlik) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(90,74,120,0.18))]" />

      {/* Süzülen ışık zerrecikleri */}
      {MOTELER.map((m, i) => (
        <span
          key={i}
          className="animate-mote pointer-events-none absolute rounded-full bg-white/80 blur-[1px]"
          style={{
            left: m.left,
            bottom: m.bottom,
            width: m.boyut,
            height: m.boyut,
            animationDelay: m.gecikme,
            boxShadow: '0 0 8px rgba(255,221,150,0.9)',
          }}
        />
      ))}

      {/* ============================================================
          İMZA ÖĞE: yukarıdan sarkan, sallanan fener
      ============================================================ */}
      <div className="animate-fener-salla absolute left-1/2 top-0 z-10 origin-top -translate-x-1/2">
        {/* Askı ipi */}
        <div className="mx-auto w-px bg-gece/40" style={{ height: 'clamp(28px, 9vh, 80px)' }} />
        {/* Fener gövdesi */}
        <div className="relative -mt-px flex flex-col items-center">
          <div className="h-1.5 w-7 rounded-t bg-gece/70" />
          <div className="relative flex h-12 w-9 items-center justify-center rounded-xl border-2 border-gece/50 bg-gradient-to-b from-gunes to-[#f5b94a] shadow-[0_0_28px_rgba(255,209,102,0.85)] md:h-14 md:w-11">
            <span className="animate-parilti text-lg md:text-xl">🔆</span>
          </div>
          <div className="h-1.5 w-4 rounded-b bg-gece/70" />
        </div>
        {/* Fenerin döktüğü sıcak ışık havuzu */}
        <div className="absolute left-1/2 top-full -z-10 h-[55vh] w-[60vh] -translate-x-1/2 rounded-full bg-gunes/20 blur-3xl" />
      </div>

      {/* ============================================================
          İÇERİK (z-20)
      ============================================================ */}
      <div className="relative z-20 flex h-full w-full flex-col items-center justify-between px-4 py-3 md:px-8 md:py-5">
        {/* ----- BAŞLIK ----- */}
        <header className="animate-belir-yukari flex flex-col items-center pt-6 md:pt-8">
          <h1 className="font-baslik text-3xl font-extrabold tracking-tight text-gece drop-shadow-[2px_3px_0_rgba(255,255,255,0.7)] md:text-5xl">
            Işıl ile Değerler
          </h1>
          <p className="mt-2 rounded-full bg-seker/90 px-5 py-1 font-baslik text-sm font-bold text-white shadow-md md:text-base">
            Bir kitap seç, maceraya başla 🌈
          </p>
        </header>

        {/* ----- RAF + KİTAPLAR ----- */}
        <main className="flex w-full max-w-4xl flex-col items-center">
          {/* Kitap kapakları rafın üstünde dik durur */}
          <div className="flex w-full items-end justify-center gap-3 px-2 md:gap-6">
            {KITAPLAR.map((kitap, i) => {
              const aktif = kitap.durum === 'aktif'
              const aciliyor = acilan?.id === kitap.id
              return (
                <button
                  key={kitap.id}
                  ref={(el) => {
                    kapakRefleri.current[kitap.id] = el
                  }}
                  onClick={() => kitabaTiklandi(kitap)}
                  aria-label={aktif ? `${kitap.ad} kitabını aç` : `${kitap.ad} — yakında`}
                  // Fly transform burada (dış düğmede); giriş animasyonu İÇTE
                  // (yoksa pop-yukari animasyonunun transform'u fly'ı ezerdi).
                  className={`relative w-1/4 max-w-[170px] outline-none transition-transform focus-visible:scale-105 ${
                    aktif && !aciliyor ? 'cursor-pointer hover:-translate-y-2' : ''
                  } ${aktif ? '' : 'cursor-not-allowed'}`}
                  style={{
                    transform: aciliyor ? acilan.transform : undefined,
                    transitionDuration: aciliyor ? '650ms' : '200ms',
                    transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
                    zIndex: aciliyor ? 50 : undefined,
                  }}
                >
                  <div className="animate-pop-yukari" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
                    <KitapKapak
                      kitap={kitap}
                      aktif={aktif}
                      aciliyor={aciliyor && evre === 'aciliyor'}
                      sallaniyor={sallananId === kitap.id}
                    />
                  </div>
                  {/* Kilitli kitaba dokununca çıkan baloncuk */}
                  {sallananId === kitap.id && (
                    <span className="animate-pop absolute -top-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-gece px-3 py-1 font-baslik text-xs font-bold text-white shadow-lg">
                      Çok yakında! ✨
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* AHŞAP RAF — kitapların altında, hafif 3B kalınlık */}
          <div className="animate-pop-yukari mt-1 w-full max-w-4xl" style={{ animationDelay: '0.1s' }}>
            {/* Üst yüzey */}
            <div className="h-3 w-full rounded-t-sm bg-gradient-to-b from-[#c98a52] to-[#a96f3e] shadow-inner" />
            {/* Ön kenar (kalınlık) */}
            <div className="h-4 w-full rounded-b-md bg-gradient-to-b from-[#90582f] to-[#73441f] shadow-[0_10px_18px_rgba(70,40,15,0.35)]" />
            {/* İki küçük destek bağı */}
            <div className="mx-auto flex w-[88%] justify-between">
              <div className="h-6 w-3 rounded-b-md bg-[#73441f]" />
              <div className="h-6 w-3 rounded-b-md bg-[#73441f]" />
            </div>
          </div>
        </main>

        {/* ----- FOOTER ----- */}
        <footer
          className="animate-belir-yukari flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full bg-gece/80 px-5 py-1.5 text-center font-metin text-xs text-white shadow-lg backdrop-blur-sm md:text-sm"
          style={{ animationDelay: '0.5s' }}
        >
          <span>© 2026 Işıl ile Değerler · Tüm hakları saklıdır</span>
          <span className="hidden opacity-40 md:inline">|</span>
          <span className="flex gap-3">
            <button onClick={() => setYasalAcik('gizlilik')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">Gizlilik</button>
            <button onClick={() => setYasalAcik('kullanim')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">Kullanım</button>
            <button onClick={() => setYasalAcik('iletisim')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">İletişim</button>
          </span>
          <span className="hidden opacity-40 md:inline">|</span>
          <span className="opacity-60">v0.2</span>
        </footer>
      </div>

      {/* Seçim sırasında sahneyi karartıp kitabı öne çıkaran örtü */}
      {acilan && (
        <div
          className="pointer-events-none absolute inset-0 z-40 transition-colors duration-700"
          style={{
            background:
              evre === 'aciliyor'
                ? 'radial-gradient(circle at center, rgba(255,246,233,0.85), rgba(90,74,120,0.55))'
                : 'rgba(90,74,120,0.35)',
          }}
        />
      )}

      {/* ----- AYARLAR BUTONU (sağ üst) ----- */}
      <IconButton
        onClick={() => setAyarlarAcik(true)}
        label="Ayarlar"
        renk="bg-gece"
        className="right-3 top-3 md:right-5 md:top-5"
      >
        ⚙️
      </IconButton>

      {/* ----- AYARLAR PENCERESİ ----- */}
      <Modal acik={ayarlarAcik} baslik="Ayarlar" ikon="⚙️" onClose={() => setAyarlarAcik(false)}>
        <div className="flex flex-col gap-3">
          <Toggle acik={soundOn} onToggle={onToggleSound} ikon="🔊" etiket="Ses efektleri" />
          <Toggle acik={muzik} onToggle={onToggleMuzik} ikon="🎵" etiket="Arka plan müziği" />
          <Toggle acik={hareketAzalt} onToggle={onToggleHareket} ikon="🐢" etiket="Hareketleri azalt" />
          {/* (İleride) ebeveyn/profil alanı için yer */}
          <div className="mt-1 rounded-2xl border-2 border-dashed border-gece/20 px-4 py-3 text-center">
            <p className="font-baslik text-sm font-bold text-gece/50">👨‍👩‍👧 Ebeveyn alanı</p>
            <p className="text-xs text-gece/40">Profiller ve ilerleme — yakında</p>
          </div>
          <p className="mt-1 px-1 text-center text-xs text-gece/50">
            Ayarlar bu cihazda geçerlidir.
          </p>
        </div>
      </Modal>

      {/* ----- YASAL METİN PENCERESİ ----- */}
      <Modal
        acik={yasalAcik !== null}
        baslik={yasalAcik ? YASAL_METINLER[yasalAcik].baslik : ''}
        ikon={yasalAcik ? YASAL_METINLER[yasalAcik].ikon : ''}
        onClose={() => setYasalAcik(null)}
      >
        <p className="leading-relaxed">{yasalAcik && YASAL_METINLER[yasalAcik].metin}</p>
      </Modal>
    </div>
  )
}

export default HomeScreen
