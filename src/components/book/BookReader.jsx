import { useEffect, useRef, useState } from 'react'
import { kitapBul } from '../../data/kitaplar.js'
import Sahne from './Sahne.jsx'
import { TiklamaKayitContext } from './tiklamaKayit.js'
import useSayfaSesi from '../../hooks/useSayfaSesi.js'
import SoundToggle from '../ui/SoundToggle.jsx'
import HomeButton from '../ui/HomeButton.jsx'

/* ===============================================================
   KİTAP OKUYUCU (BookReader) — projenin kalbi

   Ekranda GERÇEK bir açık kitap: ortada iki sayfa yan yana, ortada
   cilt (spine) çizgisi, sayfalar sürükleyerek çevriliyor.

   Her "sahne" tam 16:9 bir illüstrasyondur ve açık kitabın İKİ
   sayfasına birden yayılır (sol yarı = sol sayfa, sağ yarı = sağ
   sayfa). Sayfa çevrilince bir sonraki/önceki sahneye geçilir.

   MİMARİ (etkileşim + gerçekçilik dengesi):
   - BOŞ ZAMAN (idle): sahne TEK canlı yüzey olarak çizilir
     (Işıl yürür, Canım'a dokunulur). Cilt/kavis hissi ÜSTE bindirilen
     gölge katmanlarıyla verilir — arka plan görseli hiç deforme edilmez.
   - ÇEVİRME anında: sahne, kliplenmiş iki yarı + 3D dönen bir yaprak
     (iki yüzü ayrı sahnelerden) olarak çizilir. Dönüş bitince yeniden
     idle moda geçilir; içerik birebir aynı olduğu için sıçrama olmaz.

   GÖRSELİ BÖLME (kusursuz hizalama):
   Her yarı, %50 genişlikte ve overflow-hidden bir penceredir. İçinde
   sahne %200 genişlikte (tam spread) çizilir; sol yarıda left:0, sağ
   yarıda left:-100% ile kaydırılır. İki yarı AYNI görseli aynı ölçekte
   referans aldığı için cilt çizgisinde piksel kayması olmaz.
=============================================================== */

const CEVIRME_SURE = 480 // sayfa dönüş animasyon süresi (ms)
const ESIK = 90 // bu açıdan (derece) sonra bırakılırsa çevirme tamamlanır

function BookReader({ kitapId, soundOn, onToggleSound, onHome, hareketAzalt = false }) {
  const kitap = kitapBul(kitapId)
  const sahneler = kitap?.sahneler || []

  // Aktif sahne ve sayfa çevirme durumu
  const [sahneIndex, setSahneIndex] = useState(0)
  // flip: { yon:'ileri'|'geri', aci:0..180, suruyor, gecisli } | null
  const [flip, setFlip] = useState(null)

  const spreadRef = useRef(null) // 16:9 alanı ölçmek için
  const dragRef = useRef(null) // aktif sürükleme bilgisi
  const calSayfaSesi = useSayfaSesi()

  // --- TIKLANABİLİR SPRITE KAYIT DEFTERİ ---
  // Sahnedeki TiklamaliSprite'lar kendilerini buraya yazar; kitap yüzeyine
  // gelen pointerdown'ı (capture) burada üstten alta alfa-testiyle deneriz.
  const kayitRef = useRef(new Map())
  const kayitApi = useRef({
    ekle: (id, api) => kayitRef.current.set(id, api),
    cikar: (id) => kayitRef.current.delete(id),
  }).current

  // Sprite'a isabet varsa onu oynat + olayı durdur (sürükleme başlamasın).
  // İsabet yoksa olay normal akar (sayfa çevrilir / çiçeğe dokunulur).
  const yuzeyPointerDown = (e) => {
    if (flip) return
    const adaylar = [...kayitRef.current.values()].filter((a) => a.canli())
    adaylar.sort((a, b) => b.zIndex - a.zIndex) // üstteki önce
    for (const a of adaylar) {
      if (a.hitTest(e.clientX, e.clientY)) {
        a.oynat()
        e.stopPropagation()
        return
      }
    }
  }

  const sonSahne = sahneler.length - 1
  const ileriVar = sahneIndex < sonSahne
  const geriVar = sahneIndex > 0

  // --- ÇEVİRMEYİ TAMAMLA (sahneyi değiştir) ---
  const tamamla = (yon) => {
    setSahneIndex((i) => (yon === 'ileri' ? i + 1 : i - 1))
    setFlip(null)
  }

  // --- PROGRAMATİK ÇEVİRME (klavye / dokunma / reduced-motion) ---
  const cevir = (yon) => {
    if (flip) return
    if (yon === 'ileri' && !ileriVar) return
    if (yon === 'geri' && !geriVar) return

    calSayfaSesi() // ses global ayara bağlı (Howler.mute kapalıysa çalmaz)

    // Hareket azaltılmışsa: 3D dönüş yok, anında sahne değişir
    // (.hareketsiz tüm geçişleri kapattığı için fade görünmezdi).
    if (hareketAzalt) {
      setSahneIndex((i) => (yon === 'ileri' ? i + 1 : i - 1))
      return
    }

    // Normal: yaprağı 0 → 180 dereceye yumuşakça çevir
    setFlip({ yon, aci: 0, suruyor: false, gecisli: true })
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setFlip((f) => (f ? { ...f, aci: 180 } : f))),
    )
    setTimeout(() => tamamla(yon), CEVIRME_SURE + 20)
  }

  // --- SÜRÜKLEME (mouse + dokunmatik, Pointer Events) ---
  const surukleBasla = (e, yon) => {
    if (flip) return
    if (yon === 'ileri' && !ileriVar) return
    if (yon === 'geri' && !geriVar) return

    // Hareket azaltılmışsa sürükleme yerine tek dokunuşla geç
    if (hareketAzalt) {
      cevir(yon)
      return
    }

    const yari = spreadRef.current ? spreadRef.current.clientWidth / 2 : 300
    dragRef.current = { yon, startX: e.clientX, yari, aci: 0, hareket: false }
    setFlip({ yon, aci: 0, suruyor: true, gecisli: false })
    window.addEventListener('pointermove', surukleHareket)
    window.addEventListener('pointerup', surukleBirak)
    e.preventDefault()
  }

  const surukleHareket = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    // ileri: sola sürükle (dx<0) açıyı artırır; geri: sağa sürükle (dx>0)
    const ilerleme = d.yon === 'ileri' ? -dx / d.yari : dx / d.yari
    const aci = Math.max(0, Math.min(180, ilerleme * 180))
    d.aci = aci
    if (Math.abs(dx) > 6) d.hareket = true
    setFlip((f) => (f ? { ...f, aci, suruyor: true } : f))
  }

  const surukleBirak = () => {
    window.removeEventListener('pointermove', surukleHareket)
    window.removeEventListener('pointerup', surukleBirak)
    const d = dragRef.current
    dragRef.current = null
    if (!d) return

    // Neredeyse hiç sürüklenmediyse = tek dokunuş: sayfa çevirme YOK, iptal et
    if (!d.hareket) {
      setFlip(null)
      return
    }

    // Yeterince çevrildiyse tamamla; değilse geri yerine otur
    const tamamlanir = d.aci >= ESIK
    if (tamamlanir) calSayfaSesi()
    setFlip({ yon: d.yon, aci: tamamlanir ? 180 : 0, suruyor: false, gecisli: true })
    if (tamamlanir) {
      setTimeout(() => tamamla(d.yon), CEVIRME_SURE + 20)
    } else {
      setTimeout(() => setFlip(null), CEVIRME_SURE)
    }
  }

  // --- KLAVYE ERİŞİLEBİLİRLİĞİ (ok tuşları) ---
  // En güncel cevir'i ref ile tutuyoruz ki listener'ı bir kez kuralım.
  const cevirRef = useRef(cevir)
  cevirRef.current = cevir
  useEffect(() => {
    const tus = (e) => {
      if (e.key === 'ArrowRight') cevirRef.current('ileri')
      else if (e.key === 'ArrowLeft') cevirRef.current('geri')
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  }, [])

  // Sürükleme listener'ları kalmasın diye temizlik (güvenlik)
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', surukleHareket)
      window.removeEventListener('pointerup', surukleBirak)
    }
  }, [])

  if (!kitap) return null

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ===== ORTAM / MASA (sıcak okuma köşesi — girişle uyumlu) ===== */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f3ddc4] via-[#ecd2bd] to-[#d9b89a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(255,240,210,0.6),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(70,45,25,0.30))]" />

      {/* ===== KİTABIN ORTALANDIĞI ALAN ===== */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        {/* KAPAK (ciltli kenar) — SADE, düz, yuvarlak köşeli kahverengi
            çerçeve. Yanlarda sayfa yığını / üstte kubbe YOK; yalnızca 16:9
            sahneyi çevreleyen ahşap çerçeve. */}
        <div
          className="relative"
          style={{
            width: 'min(94vw, calc(90dvh * 16 / 9))',
            padding: 'clamp(8px, 1.5vmin, 16px)',
            borderRadius: 'clamp(14px, 2.4vmin, 28px)',
            background: 'linear-gradient(135deg, #8b5e3c 0%, #7a4a2c 30%, #5e3720 70%, #4a2a18 100%)',
            boxShadow:
              '0 26px 50px rgba(50,28,12,0.55), ' +
              '0 4px 12px rgba(0,0,0,0.3), ' +
              'inset 0 2px 2px rgba(255,255,255,0.16), ' +
              'inset 0 -1px 0 rgba(0,0,0,0.2)',
          }}
        >
          {/* SAYFA ALANI — tam 16:9 (koordinat hizası bozulmaz)
              onPointerDownCapture: sprite alfa-testi sürüklemeden ÖNCE çalışır */}
          <div
            ref={spreadRef}
            onPointerDownCapture={yuzeyPointerDown}
            className="relative overflow-hidden bg-krem"
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              perspective: '2200px',
              borderRadius: 'clamp(8px, 1.6vmin, 16px)',
            }}
          >
            <TiklamaKayitContext.Provider value={kayitApi}>
              {/* ---------- İÇERİK: idle (canlı) VEYA çevirme (statik+yaprak) ---------- */}
              {!flip ? (
                // BOŞ ZAMAN: tek canlı sahne yüzeyi (etkileşimler aktif).
                // key={sahneIndex}: sahne her değiştiğinde (özellikle hareket
                // azalt modunda, çevirme animasyonu atlanınca) sahne SIFIRDAN
                // kurulur → tıklanınca beliren öğeler (kalemler/çiçek) ve
                // animasyonlar her sayfaya gelişte yeniden gizli/başlangıçta olur.
                <div key={sahneIndex} className="absolute inset-0">
                  <Sahne sahne={sahneler[sahneIndex]} canli />
                </div>
              ) : (
                <CevirmeKatmani
                  sahneler={sahneler}
                  sahneIndex={sahneIndex}
                  flip={flip}
                />
              )}

              {/* ---------- CİLT + KAVİS GÖLGELERİ (non-destructive) ---------- */}
              <KavisGolge />

              {/* ---------- SÜRÜKLEME BÖLGELERİ (köşeler/kenarlar) ---------- */}
              {!flip && (
                <>
                  {/* İleri: sağ kenar + sağ alt köşe ipucu */}
                  {ileriVar && (
                    <div
                      onPointerDown={(e) => surukleBasla(e, 'ileri')}
                      className="absolute bottom-0 right-0 top-0 z-20 w-[16%] cursor-grab touch-none active:cursor-grabbing"
                      role="button"
                      aria-label="Sonraki sayfa (sürükle)"
                    >
                      {/* Sağ alt köşede kıvrılan sayfa ipucu */}
                      <div
                        className="animate-sallan absolute bottom-0 right-0 h-12 w-12 md:h-16 md:w-16"
                        style={{
                          background:
                            'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.85) 50%, #f0e2c8 78%, #d9c39c 100%)',
                          borderTopLeftRadius: '80%',
                          boxShadow: '-3px -3px 8px rgba(0,0,0,0.18)',
                        }}
                      />
                    </div>
                  )}
                  {/* Geri: sol kenar */}
                  {geriVar && (
                    <div
                      onPointerDown={(e) => surukleBasla(e, 'geri')}
                      className="absolute bottom-0 left-0 top-0 z-20 w-[16%] cursor-grab touch-none active:cursor-grabbing"
                      role="button"
                      aria-label="Önceki sayfa (sürükle)"
                    />
                  )}
                </>
              )}
            </TiklamaKayitContext.Provider>
          </div>
        </div>
      </div>

      {/* ===== SABİT ÜST UI ===== */}
      <SoundToggle soundOn={soundOn} onToggle={onToggleSound} />
      <HomeButton onClick={onHome} />

      {/* ===== SAYFA GÖSTERGESİ (sade, köşede) ===== */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-gece/55 px-3 py-0.5 font-baslik text-xs font-bold text-white shadow md:text-sm">
        {sahneIndex + 1} / {sahneler.length}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------
   YARI — sahnenin kliplenmiş sol/sağ yarısı

   %50 genişlikte pencere; içinde sahne %200 (tam spread) çizilir ve
   doğru yarıyı göstermek için kaydırılır. Donuk (canli=false) çizilir.
---------------------------------------------------------------- */
function Yari({ sahne, yari }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute top-0 h-full"
        style={{ width: '200%', left: yari === 'sol' ? '0%' : '-100%' }}
      >
        <Sahne sahne={sahne} canli={false} />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------
   ÇEVİRME KATMANI — statik iki yarı + 3D dönen yaprak

   İleri (i → i+1):
     sol sabit  = sahne[i].sol      (yaprağın arkası kapatır)
     sağ sabit  = sahne[i+1].sağ    (yaprak kalkınca görünür)
     yaprak     : sağ yarıda, sol kenardan döner (rotateY: 0 → -180)
                  ön yüz = sahne[i].sağ, arka yüz = sahne[i+1].sol
   Geri (i → i-1): aynı mantığın aynası (yaprak solda, sağ kenardan döner)
---------------------------------------------------------------- */
function CevirmeKatmani({ sahneler, sahneIndex, flip }) {
  const { yon, aci, suruyor, gecisli } = flip
  const ileri = yon === 'ileri'
  const hedef = ileri ? sahneIndex + 1 : sahneIndex - 1

  // Statik yarılar
  const solSabit = ileri ? sahneler[sahneIndex] : sahneler[hedef]
  const sagSabit = ileri ? sahneler[hedef] : sahneler[sahneIndex]

  // Yaprağın iki yüzü
  const onYari = ileri ? 'sag' : 'sol'
  const onSahne = sahneler[sahneIndex]
  const arkaYari = ileri ? 'sol' : 'sag'
  const arkaSahne = sahneler[hedef]

  // Yaprak dönüşü: ileri negatif, geri pozitif
  const aciDeg = ileri ? -aci : aci

  // Kalkma gölgesi yoğunluğu (90 derecede en güçlü)
  const golgeOpak = Math.sin((aci * Math.PI) / 180) * 0.35

  const yaprakGecis = gecisli && !suruyor ? `transform ${CEVIRME_SURE}ms cubic-bezier(0.4,0,0.2,1)` : 'none'

  return (
    <div className="absolute inset-0" style={{ perspective: '2200px' }}>
      {/* Sol sabit sayfa */}
      <div className="absolute bottom-0 left-0 top-0 w-1/2 overflow-hidden" style={{ isolation: 'isolate' }}>
        <Yari sahne={solSabit} yari="sol" />
      </div>
      {/* Sağ sabit sayfa */}
      <div className="absolute bottom-0 right-0 top-0 w-1/2 overflow-hidden" style={{ isolation: 'isolate' }}>
        <Yari sahne={sagSabit} yari="sag" />
        {/* İleri çevirirken: yaprağın altındaki sayfaya düşen gölge */}
        {ileri && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
            style={{ background: `linear-gradient(to right, rgba(0,0,0,${golgeOpak}), transparent)` }}
          />
        )}
      </div>
      {/* Geri çevirirken: sol sabit sayfaya düşen gölge */}
      {!ileri && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 overflow-hidden"
        >
          <div
            className="absolute inset-y-0 right-0 w-1/3"
            style={{ background: `linear-gradient(to left, rgba(0,0,0,${golgeOpak}), transparent)` }}
          />
        </div>
      )}

      {/* DÖNEN YAPRAK */}
      <div
        className="absolute bottom-0 top-0 w-1/2"
        style={{
          [ileri ? 'right' : 'left']: 0,
          transformOrigin: ileri ? 'left center' : 'right center',
          transform: `rotateY(${aciDeg}deg)`,
          transformStyle: 'preserve-3d',
          transition: yaprakGecis,
          zIndex: 30,
        }}
      >
        {/* ÖN YÜZ */}
        <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
          <Yari sahne={onSahne} yari={onYari} />
          {/* kalkarken kararma */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `rgba(0,0,0,${golgeOpak})` }}
          />
        </div>
        {/* ARKA YÜZ (180° ön-döndürülmüş ki okunaklı/aynasız olsun) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Yari sahne={arkaSahne} yari={arkaYari} />
          {/* Arka yüz 90°→180° arası görünür: kenardayken koyu, düz
              inince (180°) aydınlık → golgeOpak (90°'de tepe, 180°'de 0) */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `rgba(0,0,0,${golgeOpak})` }}
          />
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------
   KAVİS GÖLGESİ — cilt çizgisi + sayfa kıvrımı illüzyonu

   Arka plan görselini BÜKMEDEN, sadece ışık-gölge bindirerek kitap
   hissi verir (plan 4.2: non-destructive). pointer-events yok.
---------------------------------------------------------------- */
function KavisGolge() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Sayfa kıvrımı: çok hafif — renkleri soldurmamalı */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.06) 0%, transparent 6%, transparent 94%, rgba(0,0,0,0.06) 100%), ' +
            'linear-gradient(to right, transparent 45%, rgba(0,0,0,0.08) 49.5%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.08) 50.5%, transparent 55%)',
        }}
      />
      {/* Cilt (spine) orta çizgisi + ince ışık */}
      <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-black/15" />
      <div className="absolute inset-y-0 left-1/2 w-[6px] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {/* Dış köşe vinyeti — çok hafif, renkleri bozmaz */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_75%,rgba(0,0,0,0.06))]" />
    </div>
  )
}

export default BookReader
