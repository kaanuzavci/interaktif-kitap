import { useState } from 'react'
import Lottie from 'lottie-react'
import isaretAnimasyonu from '../../assets/animations/isaret_animasyon/isaret_etme.json'

// ESM / CommonJS compatibility wrapper for Vite
const LottieComponent = Lottie && (Lottie.default || Lottie)

/* ===============================================================
   ÖĞRETİCİ KATMANI — kitaba her girişte sayfa0'da zorunlu gösterilen,
   sol üstteki 3 düğmeyi (durdur/ses/tekrar) sırayla tanıtan katman.

   AKIŞ: mount olunca 1. düğmeyi işaret eder + açıklamasını gösterir.
   Ekranın HERHANGİ bir yerine dokununca (sağ üstteki ✕ hariç) sıradaki
   düğmeye geçer; 3. düğmenin ardından bir dokunuş daha gelince
   onBitti() çağrılır (BookReader bu katmanı gizler, sayfa0'ın kendi
   koreografisi — animasyon1... — o an başlar; bkz. ogreticiContext.js).

   Tüm ekranı kaplayan görünmez bir "yakalama" katmanı, ALTINDAKİ gerçek
   düğmelere (ve sayfa çevirmeye) tıklanmasını engeller — o an gerçek
   Durdur/Ses/Tekrar'a basmak yerine öğreticiyi ilerletir. ✕ (ana menü)
   İSTİSNADIR: kendi kopyası daha YÜKSEK z-index'te ayrıca çizilir.

   Düğme konumları BookReader'daki gerçek düğmelerin (DuraklatButonu,
   SoundToggle, TekrarButonu, HomeButton) CSS'iyle BİREBİR aynı formülleri
   kullanır (bkz. o dosyalardaki style) → işaret/hâle tam üstlerine oturur.
=============================================================== */

const SOL = 'max(0.75rem, env(safe-area-inset-left, 0px))'
const UST = 'max(0.75rem, env(safe-area-inset-top, 0px))'
const SAG = 'max(0.75rem, env(safe-area-inset-right, 0px))'
const YARI_BUTON = '1.9rem' // düğme yarıçapı (3.5-4rem boyutun ~yarısı, ortalama)

// Üç hedefin MERKEZ noktası (düğmelerin left/top köşesi + yarıçap).
const HEDEFLER = [
  {
    ad: 'durdur',
    merkez: { left: `calc(${SOL} + ${YARI_BUTON})`, top: `calc(${UST} + ${YARI_BUTON})` },
    aciklama: 'Buraya dokunarak kitabı istediğin an durdurup devam ettirebilirsin.',
  },
  {
    ad: 'ses',
    merkez: { left: `calc(${SOL} + ${YARI_BUTON})`, top: `calc(${UST} + 4.5rem + ${YARI_BUTON})` },
    aciklama: 'Kitabın seslendirmesini buradan açıp kapatabilirsin.',
  },
  {
    ad: 'tekrar',
    merkez: { left: `calc(${SOL} + ${YARI_BUTON})`, top: `calc(${UST} + 9rem + ${YARI_BUTON})` },
    aciklama: 'Sayfanın anlatımını baştan dinlemek istersen buraya dokun.',
  },
]

function OgreticiKatmani({ onBitti, onKapat }) {
  const [adim, setAdim] = useState(0)

  const ileri = () => {
    setAdim((a) => {
      const sonraki = a + 1
      if (sonraki >= HEDEFLER.length) {
        onBitti?.()
        return a
      }
      return sonraki
    })
  }

  const hedef = HEDEFLER[adim]

  return (
    <div className="absolute inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Düğmeler tanıtımı">
      {/* ===== YAKALAMA KATMANI — her yere dokunuş sıradaki düğmeye geçer ===== */}
      <button
        type="button"
        onClick={ileri}
        aria-label="Devam etmek için dokun"
        className="absolute inset-0 h-full w-full cursor-pointer outline-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(40,30,60,0.28), rgba(30,22,45,0.5))' }}
      />

      {/* ===== HÂLE — hedef düğmenin üstünde nabız atan halka ===== */}
      <div
        className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 md:h-[4.5rem] md:w-[4.5rem]"
        style={{ left: hedef.merkez.left, top: hedef.merkez.top }}
      >
        <span className="animate-dokun-ping absolute inset-0 rounded-full border-[3px] border-white" />
        <span
          className="animate-dokun-ping absolute inset-0 rounded-full border-[3px] border-gunes"
          style={{ animationDelay: '0.75s' }}
        />
      </div>

      {/* ===== İŞARET EDEN EL (Lottie) — hedefin hemen sağında, parmak ucu
          düğmeye bakar. Kompakt tutulur ve açıklama balonu bunun SAĞINDA net
          bir boşlukla başlar (aşağıya bkz.) → el ile yazı iç içe girmez. ===== */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: hedef.merkez.left,
          top: hedef.merkez.top,
          width: 'clamp(4rem, 9vmin, 5.5rem)',
          aspectRatio: '1 / 1',
          transform: 'translate(42%, -40%)',
        }}
      >
        <div style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}>
          <LottieComponent animationData={isaretAnimasyonu} loop autoplay style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* ===== AÇIKLAMA BALONU — işaret eden elin SAĞINDA, net boşlukla; adım
          noktaları balonun İÇİNDE (alt satır) → ayrı konum hesabı gerekmez,
          bir sonraki düğmeyle çakışmaz.

          MOBİL BOYAMA TUZAĞI: balonda backdrop-filter KULLANILMAZ ve düğüm
          her adımda key ile yeniden kurulur. WebKit/mobil Chromium,
          backdrop-filter'lı katmanın yalnızca içeriği değişince (metin/nokta)
          yeniden boyamayabiliyor; top değişimi de salt kompozisyon olduğundan
          telefonda balon taşınıyor ama İÇİNDE HEP 1. ADIMIN METNİ kalıyordu
          (masaüstünde görünmeyen hata). Zemin zaten %90 opak → blur görsel
          olarak fark yaratmıyordu. ===== */}
      <div
        key={hedef.ad}
        className="pointer-events-none absolute -translate-y-1/2 rounded-2xl bg-gece/90 px-4 py-3 shadow-xl"
        style={{
          left: `calc(${SOL} + 8.75rem)`,
          top: hedef.merkez.top,
          width: 'min(60vw, 21rem)',
        }}
      >
        <p className="font-baslik text-sm font-bold leading-snug text-white md:text-base">{hedef.aciklama}</p>
        <div className="mt-2 flex gap-1.5">
          {HEDEFLER.map((h, i) => (
            <span
              key={h.ad}
              className={`h-2 w-2 rounded-full transition-colors ${i === adim ? 'bg-gunes' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* ===== "Devam etmek için dokun" mikro-ipucu (alt orta) ===== */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <span className="animate-sallan inline-flex items-center gap-2 rounded-full bg-gece/70 px-4 py-1.5 font-baslik text-sm font-bold text-white shadow-lg backdrop-blur-sm md:text-base">
          👆 Devam etmek için ekrana dokun
        </span>
      </div>

      {/* ===== ✕ (ana menü) — yakalama katmanının İSTİSNASI, gerçek HomeButton'ın
          birebir kopyası, üstte ve tıklanabilir kalır ===== */}
      <button
        type="button"
        onClick={onKapat}
        aria-label="Kitabı kapat, ana menüye dön"
        style={{ right: SAG, top: UST }}
        className="absolute z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-seker text-white shadow-[0_5px_0_rgba(90,74,120,0.25)] transition-all duration-200 hover:scale-110 active:scale-90 active:shadow-none md:h-16 md:w-16"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-7 w-7 md:h-8 md:w-8">
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}

export default OgreticiKatmani
