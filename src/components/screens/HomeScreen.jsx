import SoundToggle from '../ui/SoundToggle.jsx'

/* ---------------------------------------------------------------
   BÖLÜM LİSTESİ

   Her bölüm bir obje. Yeni bölüm eklemek için bu diziye yeni bir
   satır eklemen yeterli - kartlar otomatik oluşur.
   - id     : bölümün benzersiz kimliği (ileride hangi bölüm
              açılacağını App'e bildirmek için)
   - ad     : kart üzerinde görünen isim
   - ikon   : temsili emoji
   - renk   : kartın arka plan rengi (index.css @theme renkleri)
   - durum  : "aktif" -> tıklanabilir / "yakinda" -> kilitli, soluk
---------------------------------------------------------------- */
const BOLUMLER = [
  { id: 'sevgi',     ad: 'Sevgi',      ikon: '💝', renk: 'bg-seker',  durum: 'aktif' },
  { id: 'durustluk', ad: 'Dürüstlük',  ikon: '🌟', renk: 'bg-gunes',  durum: 'yakinda' },
  { id: 'paylasmak', ad: 'Paylaşmak',  ikon: '🤝', renk: 'bg-cimen',  durum: 'yakinda' },
  { id: 'saygi',     ad: 'Saygı',      ikon: '🙏', renk: 'bg-gokyuzu', durum: 'yakinda' },
]

/**
 * HomeScreen: Giriş ekranı / ana menü.
 *
 * Props:
 *  - onSelectBolum : bir bölüm kartına tıklanınca çağrılır,
 *                    bölümün id'sini gönderir (App bunu yakalar)
 *  - soundOn       : ses açık mı? (App'ten gelir)
 *  - onToggleSound : ses butonu için (App'ten gelir)
 *
 * Tasarım: Sevgi bölümüyle aynı ruhta ama arka planı tamamen CSS
 * (degrade gökyüzü + süzülen bulutlar + çimen silüeti). Hazır resim
 * kullanılmadı; ekran kendine özgü ama tutarlı.
 */
function HomeScreen({ onSelectBolum, soundOn, onToggleSound }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ================= ARKA PLAN (tamamen CSS) ================= */}

      {/* Degrade gökyüzü: üstte mavi, aşağıya doğru kreme dönüyor */}
      <div className="absolute inset-0 bg-gradient-to-b from-gokyuzu via-krem to-[#ffe9f0]" />

      {/* Güneş - sağ üstte yumuşak parlama (iki iç içe daire) */}
      <div className="absolute right-[8%] top-[10%] h-28 w-28 rounded-full bg-gunes/40 blur-2xl md:h-44 md:w-44" />
      <div className="absolute right-[10%] top-[12%] h-16 w-16 rounded-full bg-gunes shadow-lg md:h-24 md:w-24" />

      {/* Süzülen bulutlar (animate-yuzen index.css'te tanımlı) */}
      <div className="animate-yuzen absolute left-[10%] top-[14%] h-8 w-28 rounded-full bg-white/80 md:h-12 md:w-40" />
      <div
        className="animate-yuzen absolute left-[55%] top-[8%] h-6 w-24 rounded-full bg-white/60 md:h-10 md:w-36"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="animate-yuzen absolute left-[30%] top-[20%] h-5 w-20 rounded-full bg-white/50 md:h-8 md:w-28"
        style={{ animationDelay: '3.5s' }}
      />

      {/* Çimen silüeti - ekranın altında iki yeşil yarım daire */}
      <div className="absolute -bottom-[20%] -left-[8%] h-[38%] w-[70%] rounded-[50%] bg-cimen/90" />
      <div className="absolute -bottom-[24%] -right-[10%] h-[40%] w-[72%] rounded-[50%] bg-cimen brightness-95" />

      {/* ================= İÇERİK ================= */}
      {/* z-10: arka plan dekorlarının önünde. Dikey ortalı kolon. */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-8 md:gap-10">

        {/* ----- BAŞLIK ----- */}
        <div className="flex items-center gap-3 md:gap-4">
          <h1 className="font-baslik text-4xl font-extrabold text-gece drop-shadow-[2px_3px_0_rgba(255,255,255,0.9)] md:text-6xl">
            Işıl ile Değerler
          </h1>
          {/* Animasyonlu kalp - hafifçe atıyor (animate-kalp) */}
          <span className="animate-kalp text-4xl md:text-6xl">💖</span>
        </div>

        {/* ----- ALT BAŞLIK ----- */}
        <p className="-mt-2 font-metin text-base font-semibold text-gece/70 md:text-xl">
          Bir bölüm seç ve maceraya başla!
        </p>

        {/* ----- BÖLÜM KARTLARI -----
            Responsive grid: dar ekranda 2 sütun, geniş ekranda 4 sütun.
            BOLUMLER dizisini map ile karta çeviriyoruz. */}
        <div className="grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {BOLUMLER.map((bolum) => {
            const aktif = bolum.durum === 'aktif'

            return (
              <button
                key={bolum.id}
                // Sadece aktif bölüm tıklanabilir
                onClick={() => aktif && onSelectBolum(bolum.id)}
                disabled={!aktif}
                className={`
                  group relative flex flex-col items-center justify-center gap-2
                  rounded-3xl border-4 border-white p-5 md:p-6
                  shadow-[0_6px_0_rgba(90,74,120,0.25)]
                  transition-all duration-200
                  ${bolum.renk}
                  ${
                    aktif
                      ? 'cursor-pointer hover:scale-105 active:scale-95 active:shadow-none'
                      : 'cursor-not-allowed opacity-50 grayscale'
                  }
                `}
              >
                {/* İkon */}
                <span className="text-4xl md:text-5xl">{bolum.ikon}</span>

                {/* Bölüm adı */}
                <span className="font-baslik text-lg font-bold text-white drop-shadow-sm md:text-2xl">
                  {bolum.ad}
                </span>

                {/* "Yakında" rozeti - sadece kilitli bölümlerde */}
                {!aktif && (
                  <span className="absolute -top-3 rounded-full bg-gece px-3 py-0.5 font-metin text-xs font-bold text-white shadow-md">
                    🔒 Yakında
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ----- SES AÇ/KAPAT (sol üst köşe) ----- */}
      <SoundToggle soundOn={soundOn} onToggle={onToggleSound} />
    </div>
  )
}

export default HomeScreen
