import { useState } from 'react'

/* ===============================================================
   SAHNE — tek bir sahnenin görsel yüzeyi

   Açık kitabın İKİ sayfasına birden yayılan 16:9 sahneyi çizer:
   arka plan + katmanlar + (varsa) özel içerik bileşeni + anlatı metni.

   Bu bileşen iki yerde kullanılır:
   1. Boş zamanda (idle): BookReader tam genişlikte CANLI olarak çizer
      (etkileşimler aktif). Cilt/kavis gölgeleri üstüne ayrı bindirilir.
   2. Sayfa çevrilirken: kliplenmiş yarılar ve dönen yaprağın yüzleri
      olarak DONUK (canli=false) çizilir.

   Tüm katman konumları sahnenin yüzdesidir (x soldan, y alttan),
   böylece kitap iki yarıya bölündüğünde hizalama bozulmaz.

   PROPS:
   - sahne : sevgiSahneleri.js'teki sahne nesnesi
   - canli : etkileşimler aktif mi? (yarılar/yaprak için false)
=============================================================== */
function Sahne({ sahne, canli = true }) {
  const IcerikBileseni = sahne.icerikBileseni

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ===== ARKA PLAN =====
          Görsel net ve düz kalır; deforme edilmez. Görsel yoksa
          (basit/kapanış sahneleri) yumuşak bir degrade kullanılır. */}
      {sahne.arkaplan ? (
        <img
          src={sahne.arkaplan}
          alt=""
          className="absolute inset-0 h-full w-full"
          draggable={false}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              sahne.arkaplanDegrade ||
              'linear-gradient(to bottom, #bde3ff 0%, #eaf5ff 45%, #fff6e9 100%)',
          }}
        />
      )}

      {/* ===== DEKLARATİF KATMANLAR (basit sahneler) ===== */}
      {sahne.katmanlar?.map((katman, i) => (
        <Katman key={i} katman={katman} canli={canli} />
      ))}

      {/* ===== ÖZEL İÇERİK (karmaşık etkileşimli sahneler) ===== */}
      {IcerikBileseni && <IcerikBileseni canli={canli} />}

      {/* ===== ANLATI METNİ ===== */}
      {sahne.metin && (
        <SahneMetni baslik={sahne.baslik} metin={sahne.metin} konum={sahne.metinKonum} />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------
   KATMAN — deklaratif tek bir öğe (emoji / görsel / dokunmatik)
---------------------------------------------------------------- */
function Katman({ katman, canli }) {
  const { tip, x = '50%', y = '50%', boyut = '3rem', animasyon } = katman

  // Dokununca kısa bir tepki ("parla"/"zipla"/"sallan") oynatılır
  const [tepki, setTepki] = useState(false)

  // DIŞ sarmalayıcı yalnızca KONUMU verir (left/bottom + yatay ortalama).
  // Animasyon İÇ öğeye uygulanır; yoksa animasyonun transform'u
  // ortalama (-translate-x-1/2) transform'unu ezerdi (öğe yana kayardı).
  const konumStili = { left: x, bottom: y }
  const animSinifi = animasyon ? `animate-${animasyon}` : ''

  if (tip === 'gorsel') {
    return (
      <span className="pointer-events-none absolute z-10 -translate-x-1/2 select-none" style={konumStili}>
        <img src={katman.kaynak} alt="" draggable={false} className={animSinifi} style={{ width: boyut }} />
      </span>
    )
  }

  if (tip === 'dokunmatik') {
    // etki adını var olan animasyon sınıfına eşle (tek seferlik tepki)
    const ETKI_SINIF = {
      parla: 'animate-parla',     // dokununca büyüyüp parlar
      zipla: 'animate-ziplama',   // kısa zıplama
      sallan: 'animate-sallan',   // sallanma
    }
    const etkiSinifi = tepki ? ETKI_SINIF[katman.etki] || 'animate-ziplama' : ''
    return (
      <span className="absolute z-30 -translate-x-1/2" style={konumStili}>
        <button
          type="button"
          aria-label={katman.ad || 'Dokun'}
          disabled={!canli}
          onClick={() => {
            if (!canli) return
            setTepki(true)
            setTimeout(() => setTepki(false), 700)
          }}
          className={`${canli ? 'cursor-pointer' : 'cursor-default'} ${etkiSinifi}`}
          style={{ fontSize: boyut, lineHeight: 1 }}
        >
          {katman.icerik}
        </button>
      </span>
    )
  }

  // Varsayılan: emoji/sembol
  return (
    <span className="pointer-events-none absolute z-20 -translate-x-1/2 select-none" style={konumStili}>
      <span className={animSinifi} style={{ fontSize: boyut, display: 'inline-block', lineHeight: 1 }}>
        {katman.icerik}
      </span>
    </span>
  )
}

/* ---------------------------------------------------------------
   SAHNE METNİ — okunaklı, yuvarlak köşeli anlatı kutusu

   Kitabın illüstrasyonu tek parça olduğu için metin, sayfanın
   üstüne yumuşak bir kutuyla biner. Konum cilt çizgisinden uzak
   tutulur ki sayfa katlanması metni kesmesin.
---------------------------------------------------------------- */
function SahneMetni({ baslik, metin, konum = 'alt' }) {
  // Konum -> yerleşim sınıfları (cilt ortasını boş bırakacak şekilde)
  const yerlesim = {
    alt: 'bottom-[5%] left-1/2 -translate-x-1/2 w-[56%] text-center',
    'alt-sol': 'bottom-[5%] left-[4%] w-[40%] text-left',
    'alt-sag': 'bottom-[5%] right-[4%] w-[40%] text-right',
    ust: 'top-[5%] left-1/2 -translate-x-1/2 w-[56%] text-center',
  }[konum] || 'bottom-[5%] left-1/2 -translate-x-1/2 w-[56%] text-center'

  return (
    <div className={`absolute z-40 ${yerlesim}`}>
      {baslik && (
        <h2 className="mb-1 font-baslik text-xl font-extrabold text-gece drop-shadow-[1px_2px_0_rgba(255,255,255,0.9)] md:text-3xl">
          {baslik}
        </h2>
      )}
      <p className="inline-block rounded-3xl border-2 border-seker/40 bg-white/90 px-4 py-2 font-metin text-sm font-semibold leading-snug text-gece shadow-lg backdrop-blur-sm md:px-6 md:py-3 md:text-lg">
        {metin}
      </p>
    </div>
  )
}

export default Sahne
