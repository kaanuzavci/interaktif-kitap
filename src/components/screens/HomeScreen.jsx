import { useRef, useState } from 'react'
import { KITAPLAR } from '../../data/kitaplar.js'
import KitapKapak from '../ui/KitapKapak.jsx'
import KapakGovdesi from '../book/KapakGovdesi.jsx'
import { SAYFA_YUK, SAYFA_GEN } from '../book/kapakOlcu.js'
import Modal from '../ui/Modal.jsx'
import Toggle from '../ui/Toggle.jsx'
import IconButton from '../ui/IconButton.jsx'
import ortamArkaPlan from '../../assets/backgrounds/genel_arkaplan.jpg'

/* ---------------------------------------------------------------
   İLETİŞİM — hesap adları TEK YERDE. Değişirse yalnızca burayı güncelle;
   hem footer modali hem ileride eklenecek başka yerler buradan okur.
---------------------------------------------------------------- */
export const ILETISIM = {
  instagram: 'renklidusleratlasi',
  eposta: 'renklidusleratlasi@gmail.com',
}

/* Instagram marka işareti (inline SVG) — emojiden çok daha tanıdık ve her
   platformda aynı görünür (emoji çizimleri cihaza göre değişir). */
function InstagramIkon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* Zarf işareti (inline SVG) — Instagram işaretiyle aynı çizgi kalınlığında */
function EpostaIkon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
      <path d="M3.5 7 12 13 20.5 7" />
    </svg>
  )
}

const ILETISIM_BAGLANTILARI = [
  {
    ad: 'Instagram',
    etiket: `@${ILETISIM.instagram}`,
    href: `https://www.instagram.com/${ILETISIM.instagram}/`,
    Ikon: InstagramIkon,
    dis: true, // yeni sekmede açılır
  },
  {
    ad: 'E-posta',
    etiket: ILETISIM.eposta,
    href: `mailto:${ILETISIM.eposta}`,
    Ikon: EpostaIkon,
    dis: false, // mailto: posta uygulamasını açar, yeni sekme gerekmez
  },
]

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
    metin: 'Görüş ve önerileriniz için bize ulaşın — yazmanız bizi çok mutlu eder!',
    baglantilar: ILETISIM_BAGLANTILARI,
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
  // acilan = { id, transform } (merkeze süzülen kitap)
  // evre = 'merkeze' (rafta kalkıp ekran ortasına büyüyerek gelir)
  //      → 'morph'   (ortadaki kitap BİZİM kapağımıza dönüşür + arka plan belirir)
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

    // 1) ~720ms: kitap ortaya büyüyerek geldi → BİZİM kapağımıza dönüş (morph)
    //    başlar: ortadaki kart yumuşakça bizim kapağımıza çözülür + arka plan belirir.
    setTimeout(() => setEvre('morph'), 720)
    // 2) ~1450ms: morph tamamlandı → okuyucuya geç (KapakEkrani aynı kapağı
    //    tam boyutta gösterdiğinden geçiş sıçramasız devam eder).
    setTimeout(() => onSelectKitap?.(kitap.id), 1450)
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
        <div className="mx-auto w-px bg-gece/40" style={{ height: 'clamp(14px, 6vh, 80px)' }} />
        {/* Fener gövdesi */}
        <div className="relative -mt-px flex flex-col items-center">
          <div className="h-1 w-5 rounded-t bg-gece/70 md:h-1.5 md:w-7" />
          <div className="relative flex h-8 w-6 items-center justify-center rounded-xl border-2 border-gece/50 bg-gradient-to-b from-gunes to-[#f5b94a] shadow-[0_0_28px_rgba(255,209,102,0.85)] md:h-14 md:w-11">
            <span className="animate-parilti text-sm md:text-xl">🔆</span>
          </div>
          <div className="h-1 w-3 rounded-b bg-gece/70 md:h-1.5 md:w-4" />
        </div>
        {/* Fenerin döktüğü sıcak ışık havuzu */}
        <div className="absolute left-1/2 top-full -z-10 h-[55vh] w-[60vh] -translate-x-1/2 rounded-full bg-gunes/20 blur-3xl" />
      </div>

      {/* ============================================================
          İÇERİK (z-20)
      ============================================================ */}
      <div className="ana-icerik relative z-20 flex h-full w-full flex-col items-center overflow-y-auto px-4 pb-1 pt-2 md:px-8 md:py-5">
        {/* ----- FENER PAYI — başlık, fenerin HEMEN altından başlar ----- */}
        <div
          className="w-full shrink-0"
          style={{ height: 'calc(clamp(14px, 6vh, 80px) + clamp(2rem, 8vh, 4.5rem))' }}
          aria-hidden="true"
        />

        {/* ----- BAŞLIK — fenerin hemen altında ----- */}
        <header className="animate-belir-yukari flex shrink-0 flex-col items-center">
          <h1 className="font-baslik text-2xl font-extrabold tracking-tight text-gece drop-shadow-[2px_3px_0_rgba(255,255,255,0.7)] md:text-5xl">
            Işıl&apos;ın Değerli Dünyası
          </h1>
          <p className="mt-1 rounded-full bg-seker/90 px-4 py-0.5 font-baslik text-xs font-bold text-white shadow-md md:mt-2 md:px-5 md:py-1 md:text-base">
            Bir kitap seç, maceraya başla
          </p>
        </header>

        {/* ----- RAF + KİTAPLAR — başlığın hemen altında (yukarı alındı) ----- */}
        <main className="mt-2 flex w-full max-w-4xl shrink flex-col items-center md:mt-26">
          {/* Kitap kapakları rafın üstünde dik durur */}
          <div className="flex w-full items-end justify-center gap-2 px-2 md:gap-6">
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
                  className={`relative w-1/4 outline-none transition-transform focus-visible:scale-105 ${aktif && !aciliyor ? 'cursor-pointer hover:-translate-y-2' : ''
                    } ${aktif ? '' : 'cursor-not-allowed'}`}
                  style={{
                    // Kart genişliği yüksekliğe de bağlı (22vh): alçak ekranlarda
                    // (yatay telefon) raf + footer taşmadan tek ekrana sığar.
                    maxWidth: 'min(170px, 22vh)',
                    transform: aciliyor ? acilan.transform : undefined,
                    // morph'ta ortadaki kart yumuşakça solar (altındaki BİZİM
                    // kapağımız belirirken) → "kapağa dönüştü" hissi.
                    opacity: aciliyor && evre === 'morph' ? 0 : 1,
                    transitionProperty: 'transform, opacity',
                    transitionDuration: aciliyor ? '650ms' : '200ms',
                    transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
                    zIndex: aciliyor ? 50 : undefined,
                  }}
                >
                  {/* Pembe kartın KENDİ kapak-açılış animasyonu KALDIRILDI: kitap
                      açılışı zaten bizim kapağımıza dokununca oluyor (çift açılma
                      garip duruyordu). Kart yalnızca ortaya gelir, sonra morph'ta solar. */}
                  <div className="animate-pop-yukari" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
                    <KitapKapak
                      kitap={kitap}
                      aktif={aktif}
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
          <div className="animate-pop-yukari mt-0.5 w-full max-w-4xl md:mt-1" style={{ animationDelay: '0.1s' }}>
            {/* Üst yüzey */}
            <div className="h-2 w-full rounded-t-sm bg-gradient-to-b from-[#c98a52] to-[#a96f3e] shadow-inner md:h-3" />
            {/* Ön kenar (kalınlık) */}
            <div className="h-3 w-full rounded-b-md bg-gradient-to-b from-[#90582f] to-[#73441f] shadow-[0_10px_18px_rgba(70,40,15,0.35)] md:h-4" />
            {/* İki küçük destek bağı */}
            <div className="mx-auto flex w-[88%] justify-between">
              <div className="h-3 w-2 rounded-b-md bg-[#73441f] md:h-6 md:w-3" />
              <div className="h-3 w-2 rounded-b-md bg-[#73441f] md:h-6 md:w-3" />
            </div>
          </div>
        </main>

        {/* ----- FOOTER ----- */}
        <footer
          className="animate-belir-yukari mt-auto flex w-full max-w-4xl shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-0.5 rounded-full bg-gece/80 px-4 py-1 text-center font-metin text-[10px] text-white shadow-lg backdrop-blur-sm md:gap-x-4 md:gap-y-1 md:px-5 md:py-1.5 md:text-sm"
          style={{ animationDelay: '0.5s' }}
        >
          {/* Marka adı GÖRÜNÜR metinde de geçsin: arama motorları görünür
              içeriğe, gizli/erişilebilirlik metninden daha çok güvenir. */}
          <span>© 2026 Renkli Düşler Atlası</span>
          <span className="hidden opacity-40 md:inline">|</span>
          <span className="flex gap-2 md:gap-3">
            <button onClick={() => setYasalAcik('gizlilik')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">Gizlilik</button>
            <button onClick={() => setYasalAcik('kullanim')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">Kullanım</button>
            <button onClick={() => setYasalAcik('iletisim')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">İletişim</button>
          </span>
          <span className="hidden opacity-40 md:inline">|</span>
          <span className="hidden opacity-60 md:inline">v0.2</span>
        </footer>
      </div>

      {/* MORPH KATMANI — kitap seçilince: ortadaki kart BİZİM kapağımıza dönüşür
          ve arka plan (okuyucudaki ortam illüstrasyonu) YAVAŞÇA belirir. Kapak
          gövdesi (KapakGovdesi) ekranda tam boyutta oturur; KapakEkrani'ne geçince
          aynı kapak sürdüğünden görüntü sıçramaz. Kart bu katmanın ÜSTÜNDE (z-50)
          solduğundan çapraz geçiş (crossfade) oluşur. */}
      {acilan && (
        <div className="pointer-events-none absolute inset-0 z-40">
          {/* Ortam arka plan — yavaşça yüklenir gibi belirir */}
          {/* Vinyet/gölge genel_arkaplan görselinin içinde → ekstra karartma yok. */}
          <img
            src={ortamArkaPlan}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-out"
            style={{ opacity: evre === 'morph' ? 1 : 0 }}
          />
          {/* Bizim kapağımız — ortada, yavaşça belirir (kart buna dönüşür) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              style={{
                height: SAYFA_YUK,
                width: SAYFA_GEN,
                perspective: '2200px',
                opacity: evre === 'morph' ? 1 : 0,
                transform: evre === 'morph' ? 'scale(1)' : 'scale(0.92)',
                transition: 'opacity 720ms ease, transform 820ms cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <KapakGovdesi aci={0} />
            </div>
          </div>
        </div>
      )}

      {/* ----- AYARLAR BUTONU (sağ üst) — kitap seçilince (morph) gizlenir ----- */}
      {!acilan && (
        <IconButton
          onClick={() => setAyarlarAcik(true)}
          label="Ayarlar"
          renk="bg-gece"
          className="right-3 top-3 md:right-5 md:top-5"
        >
          ⚙️
        </IconButton>
      )}

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

        {/* İLETİŞİM BAĞLANTILARI — yalnızca "İletişim" sekmesinde. Dokunması
            kolay olsun diye tam genişlikte, iri, yuvarlak satırlar. */}
        {yasalAcik && YASAL_METINLER[yasalAcik].baglantilar && (
          <div className="mt-5 flex flex-col gap-3">
            {YASAL_METINLER[yasalAcik].baglantilar.map(({ ad, etiket, href, Ikon, dis }) => (
              <a
                key={href}
                href={href}
                {...(dis ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex items-center gap-3 rounded-2xl border-2 border-gece/10 bg-white px-4 py-3 shadow-sm transition-transform hover:scale-[1.02] hover:border-seker active:scale-[0.98]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-seker/15 text-seker">
                  <Ikon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-gece/50">{ad}</span>
                  <span className="block truncate font-semibold text-gece">{etiket}</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default HomeScreen
