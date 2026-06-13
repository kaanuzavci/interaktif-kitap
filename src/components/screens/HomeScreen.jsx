import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Toggle from '../ui/Toggle.jsx'
import IconButton from '../ui/IconButton.jsx'

/* ---------------------------------------------------------------
   BÖLÜM LİSTESİ

   Her bölüm bir obje. Yeni bölüm eklemek için bu diziye satır eklemen
   yeterli - kartlar otomatik oluşur.
   - id      : benzersiz kimlik (App'e hangi bölümün açılacağını bildirir)
   - ad      : kart başlığı
   - ikon    : temsili emoji
   - teaser  : kartın altındaki kısa tanıtım
   - renk    : kart üst şeridi/aksan rengi (index.css @theme renkleri)
   - durum   : "aktif" -> tıklanabilir / "yakinda" -> kilitli, soluk
---------------------------------------------------------------- */
const BOLUMLER = [
  { id: 'sevgi',     ad: 'Sevgi',     ikon: '💝', teaser: 'Işıl ve Canım',      renk: 'seker',  durum: 'aktif' },
  { id: 'durustluk', ad: 'Dürüstlük', ikon: '🌟', teaser: 'Doğruyu söylemek',   renk: 'gunes',  durum: 'yakinda' },
  { id: 'paylasmak', ad: 'Paylaşmak', ikon: '🤝', teaser: 'Birlikte daha güzel', renk: 'cimen',  durum: 'yakinda' },
  { id: 'saygi',     ad: 'Saygı',     ikon: '🌸', teaser: 'Herkese nazik ol',    renk: 'gokyuzu', durum: 'yakinda' },
]

/* Renk id'sini Tailwind arka plan sınıfına çeviren küçük yardımcı.
   (Tailwind, string birleştirmeyle üretilen sınıfları derlemede
   göremediği için sınıfları açıkça yazıyoruz.) */
const RENK_BG = {
  seker: 'bg-seker',
  gunes: 'bg-gunes',
  cimen: 'bg-cimen',
  gokyuzu: 'bg-gokyuzu',
}

/* ---------------------------------------------------------------
   YASAL METİNLER (placeholder)
   Canlı yayında gerçek metinlerle değiştirilecek. Footer'daki
   linkler bu içerikleri modal içinde açar.
---------------------------------------------------------------- */
const YASAL_METINLER = {
  gizlilik: {
    baslik: 'Gizlilik Politikası',
    ikon: '🔒',
    metin:
      'Çocuklarımızın güvenliği önceliğimizdir. Uygulama, kişisel veri toplamaz; ' +
      'ilerleme bilgileri yalnızca cihazda saklanır. (Bu bir taslak metindir, ' +
      'yayın öncesi hukuki metinle güncellenecektir.)',
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
      '(Örnek adres - yayın öncesi güncellenecek.)',
  },
}

/**
 * HomeScreen: Giriş ekranı / ana menü.
 *
 * Bölümler:
 *  1. Çok katmanlı CSS arka plan (gökyüzü, güneş+ışınlar, bulutlar,
 *     tepeler, çiçekler, kelebekler) - masalsı diorama hissi
 *  2. Animasyonlu logo/başlık
 *  3. Bölüm seçim kartları (açılışta sırayla "pop" eder)
 *  4. Ayarlar penceresi (dişli buton -> modal)
 *  5. Footer: telif / yasal linkler / sürüm
 *
 * Props:
 *  - onSelectBolum : bölüm kartına tıklanınca id ile çağrılır
 *  - soundOn       : ses açık mı? (App'ten)
 *  - onToggleSound : ses aç/kapat (App'ten)
 */
function HomeScreen({ onSelectBolum, soundOn, onToggleSound }) {
  // Ayarlar penceresi açık mı?
  const [ayarlarAcik, setAyarlarAcik] = useState(false)

  // Yasal metin penceresi: null veya "gizlilik"/"kullanim"/"iletisim"
  const [yasalAcik, setYasalAcik] = useState(null)

  // Ayar durumları (ses App'ten; bunlar yerel)
  const [muzik, setMuzik] = useState(true)       // arka plan müziği (ileride)
  const [hareketAzalt, setHareketAzalt] = useState(false) // animasyonları durdur

  return (
    // hareketAzalt açıksa ".hareketsiz" sınıfı tüm animasyonları durdurur
    <div className={`relative h-full w-full overflow-hidden ${hareketAzalt ? 'hareketsiz' : ''}`}>

      {/* ============================================================
          ARKA PLAN KATMANLARI (tamamen CSS, z-0)
      ============================================================ */}

      {/* Degrade gökyüzü */}
      <div className="absolute inset-0 bg-gradient-to-b from-gokyuzu via-[#e8f4ff] to-krem" />

      {/* Merkeze yumuşak ışık - kartların arkasını öne çıkarır */}
      <div className="absolute left-1/2 top-1/2 h-[80%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl" />

      {/* Güneş + dönen ışınlar (sağ üst) */}
      <div className="absolute -right-12 -top-12 h-64 w-64 md:h-80 md:w-80">
        <div
          className="animate-isin absolute inset-0 rounded-full opacity-25"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, rgba(255,209,102,0.6) 0deg 7deg, transparent 7deg 20deg)',
          }}
        />
        <div className="absolute inset-10 rounded-full bg-gunes/40 blur-2xl" />
        <div className="absolute inset-16 rounded-full bg-gunes shadow-[0_0_50px_rgba(255,209,102,0.7)]" />
      </div>

      {/* Süzülen bulutlar (farklı derinlik = farklı boyut/opaklık/hız) */}
      <div className="animate-yuzen absolute left-[8%] top-[12%] h-9 w-32 rounded-full bg-white/85 md:h-12 md:w-44" />
      <div
        className="animate-yuzen absolute left-[60%] top-[8%] h-7 w-24 rounded-full bg-white/70 md:h-10 md:w-36"
        style={{ animationDelay: '2s', animationDuration: '8s' }}
      />
      <div
        className="animate-yuzen absolute left-[35%] top-[18%] h-6 w-20 rounded-full bg-white/55 md:h-8 md:w-28"
        style={{ animationDelay: '3.5s', animationDuration: '7s' }}
      />

      {/* Uzaktaki ağaç siluetleri (basit yuvarlak taç + gövde) */}
      <div className="absolute bottom-[14%] left-[4%] flex flex-col items-center opacity-90">
        <div className="h-20 w-20 rounded-full bg-cimen brightness-90 md:h-28 md:w-28" />
        <div className="-mt-2 h-10 w-4 rounded-b-lg bg-[#9c6b4a] md:h-14 md:w-5" />
      </div>
      <div className="absolute bottom-[15%] right-[5%] flex flex-col items-center opacity-90">
        <div className="h-16 w-16 rounded-full bg-cimen brightness-95 md:h-24 md:w-24" />
        <div className="-mt-2 h-9 w-3.5 rounded-b-lg bg-[#9c6b4a] md:h-12 md:w-5" />
      </div>

      {/* Katmanlı tepeler */}
      <div className="absolute -bottom-[28%] -left-[12%] h-[42%] w-[80%] rounded-[50%] bg-cimen/80 brightness-105" />
      <div className="absolute -bottom-[30%] -right-[14%] h-[44%] w-[82%] rounded-[50%] bg-cimen brightness-95" />
      {/* En öndeki çimen şeridi */}
      <div className="absolute bottom-0 left-0 h-[12%] w-full bg-gradient-to-t from-cimen to-cimen/70" />

      {/* Çiçek ve canlılar - alt şeride serpiştirilmiş (emoji, hafif animasyonlu) */}
      <div className="animate-sallan absolute bottom-[1%] left-[6%] text-3xl md:text-4xl">🌷</div>
      <div className="animate-sallan absolute bottom-[2%] left-[18%] text-2xl md:text-3xl" style={{ animationDelay: '0.7s' }}>🌼</div>
      <div className="animate-sallan absolute bottom-[1%] left-[78%] text-3xl md:text-4xl" style={{ animationDelay: '1.1s' }}>🌷</div>
      <div className="animate-sallan absolute bottom-[2%] left-[90%] text-2xl md:text-3xl" style={{ animationDelay: '0.4s' }}>🌼</div>
      <div className="animate-sallan absolute bottom-[1%] left-[45%] text-2xl md:text-3xl" style={{ animationDelay: '1.4s' }}>🍄</div>

      {/* Kelebekler (süzülme + kanat çırpma birlikte) */}
      <div className="animate-yuzen absolute left-[22%] top-[40%]" style={{ animationDuration: '9s' }}>
        <span className="animate-kanat block text-2xl md:text-3xl">🦋</span>
      </div>
      <div className="animate-yuzen absolute right-[24%] top-[34%]" style={{ animationDuration: '7s', animationDelay: '1s' }}>
        <span className="animate-kanat block text-xl md:text-2xl" style={{ animationDelay: '0.5s' }}>🐝</span>
      </div>

      {/* Uçuşan kalpler + parıltılar */}
      <div className="animate-kalp absolute left-[14%] top-[52%] text-2xl md:text-3xl">💗</div>
      <div className="animate-parilti absolute right-[16%] top-[48%] text-xl md:text-2xl">✨</div>
      <div className="animate-parilti absolute left-[48%] top-[26%] text-lg md:text-xl" style={{ animationDelay: '1s' }}>✨</div>

      {/* ============================================================
          İÇERİK (z-10)
      ============================================================ */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-between px-4 py-4 md:px-8 md:py-6">

        {/* ----- BAŞLIK / LOGO ----- */}
        <header className="animate-belir-yukari flex flex-col items-center pt-2 md:pt-3">
          <div className="relative flex items-center gap-3 rounded-full border-4 border-white bg-krem/90 px-7 py-2 shadow-[0_8px_0_rgba(90,74,120,0.18)] backdrop-blur-sm md:px-10 md:py-3">
            {/* Sol parıltı */}
            <span className="animate-parilti absolute -left-3 -top-3 text-2xl md:text-3xl">✨</span>

            <h1 className="font-baslik text-3xl font-extrabold tracking-tight text-gece md:text-5xl">
              Işıl ile Değerler
            </h1>
            {/* Atan kalp */}
            <span className="animate-kalp text-3xl md:text-5xl">💖</span>

            {/* Sağ parıltı */}
            <span className="animate-parilti absolute -bottom-3 -right-2 text-xl md:text-2xl" style={{ animationDelay: '0.8s' }}>✨</span>
          </div>

          {/* Alt başlık şeridi */}
          <p className="mt-3 rounded-full bg-seker/90 px-5 py-1 font-baslik text-sm font-bold text-white shadow-md md:text-lg">
            Bir bölüm seç ve maceraya başla! 🌈
          </p>
        </header>

        {/* ----- BÖLÜM KARTLARI ----- */}
        <main className="grid w-full max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {BOLUMLER.map((bolum, i) => {
            const aktif = bolum.durum === 'aktif'
            const renkBg = RENK_BG[bolum.renk]

            return (
              <button
                key={bolum.id}
                onClick={() => aktif && onSelectBolum(bolum.id)}
                disabled={!aktif}
                // animate-pop + artan gecikme: kartlar sırayla belirir
                className={`
                  animate-pop group relative flex flex-col items-center rounded-[1.75rem]
                  border-4 border-white bg-white/85 px-3 pb-4 pt-8 backdrop-blur-sm
                  shadow-[0_8px_0_rgba(90,74,120,0.15)]
                  transition-all duration-200
                  ${
                    aktif
                      ? 'cursor-pointer hover:-translate-y-1 hover:scale-105 active:scale-95'
                      : 'cursor-not-allowed'
                  }
                `}
                style={{ animationDelay: `${0.15 + i * 0.12}s` }}
              >
                {/* Üst renk şeridi */}
                <span className={`absolute left-0 right-0 top-0 h-3 rounded-t-[1.4rem] ${renkBg}`} />

                {/* İkon rozeti - kartın üst kenarına binmiş daire */}
                <span
                  className={`absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-2xl shadow-md md:h-16 md:w-16 md:text-3xl ${renkBg}`}
                >
                  {bolum.ikon}
                </span>

                {/* Sıra numarası rozeti (sol üst) */}
                <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gece/80 font-baslik text-xs font-bold text-white">
                  {i + 1}
                </span>

                {/* Başlık */}
                <span className="mt-2 font-baslik text-lg font-extrabold text-gece md:text-2xl">
                  {bolum.ad}
                </span>

                {/* Teaser */}
                <span className="mt-0.5 text-center font-metin text-xs font-semibold text-gece/60 md:text-sm">
                  {bolum.teaser}
                </span>

                {/* Aksiyon alanı: aktifse "Başla" pili, değilse "Yakında" */}
                {aktif ? (
                  <span className="animate-ziplama mt-3 rounded-full bg-seker px-4 py-1 font-baslik text-sm font-bold text-white shadow-md md:text-base">
                    Başla ▶
                  </span>
                ) : (
                  <span className="mt-3 rounded-full bg-gece/15 px-3 py-1 font-baslik text-xs font-bold text-gece/60 md:text-sm">
                    🔒 Yakında
                  </span>
                )}

                {/* Kilitli kartlarda hafif buzlu örtü (soluk görünüm) */}
                {!aktif && (
                  <span className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-white/40" />
                )}
              </button>
            )
          })}
        </main>

        {/* ----- FOOTER (telif + yasal linkler + sürüm) ----- */}
        <footer className="animate-belir-yukari flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full bg-gece/85 px-5 py-2 text-center font-metin text-xs text-white shadow-lg backdrop-blur-sm md:text-sm" style={{ animationDelay: '0.5s' }}>
          <span>© 2026 Işıl ile Değerler · Tüm hakları saklıdır</span>
          <span className="hidden md:inline opacity-40">|</span>
          <span className="flex gap-3">
            <button onClick={() => setYasalAcik('gizlilik')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">Gizlilik</button>
            <button onClick={() => setYasalAcik('kullanim')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">Kullanım</button>
            <button onClick={() => setYasalAcik('iletisim')} className="underline-offset-2 transition-colors hover:text-gunes hover:underline">İletişim</button>
          </span>
          <span className="hidden md:inline opacity-40">|</span>
          <span className="opacity-60">v0.1</span>
        </footer>
      </div>

      {/* ----- AYARLAR BUTONU (sağ üst köşe) ----- */}
      <IconButton
        onClick={() => setAyarlarAcik(true)}
        label="Ayarlar"
        renk="bg-gece"
        className="right-3 top-3 md:right-5 md:top-5"
      >
        ⚙️
      </IconButton>

      {/* ============================================================
          AYARLAR PENCERESİ
      ============================================================ */}
      <Modal acik={ayarlarAcik} baslik="Ayarlar" ikon="⚙️" onClose={() => setAyarlarAcik(false)}>
        <div className="flex flex-col gap-3">
          <Toggle
            acik={soundOn}
            onToggle={onToggleSound}
            ikon="🔊"
            etiket="Ses efektleri"
          />
          <Toggle
            acik={muzik}
            onToggle={() => setMuzik((o) => !o)}
            ikon="🎵"
            etiket="Arka plan müziği"
          />
          <Toggle
            acik={hareketAzalt}
            onToggle={() => setHareketAzalt((o) => !o)}
            ikon="🐢"
            etiket="Hareketleri azalt"
          />
          <p className="mt-1 px-1 text-center text-xs text-gece/50">
            Ayarlar bu cihazda geçerlidir.
          </p>
        </div>
      </Modal>

      {/* ============================================================
          YASAL METİN PENCERESİ (tek modal, içeriği seçime göre değişir)
      ============================================================ */}
      <Modal
        acik={yasalAcik !== null}
        baslik={yasalAcik ? YASAL_METINLER[yasalAcik].baslik : ''}
        ikon={yasalAcik ? YASAL_METINLER[yasalAcik].ikon : ''}
        onClose={() => setYasalAcik(null)}
      >
        <p className="leading-relaxed">
          {yasalAcik && YASAL_METINLER[yasalAcik].metin}
        </p>
      </Modal>
    </div>
  )
}

export default HomeScreen
