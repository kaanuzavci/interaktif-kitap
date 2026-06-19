import { useContext, useEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from './tiklamaKayit.js'
import { opakMerkez, opakKutu, noktaDolu } from './alfaHarita.js'
import DokunIpucu from './DokunIpucu.jsx'
import Parilti, { PARILTI_SURE_MS } from './Parilti.jsx'

/* ===============================================================
   TIKLANIR GÖRSEL — açılışta görünmeyen, DOKUNUNCA beliren statik
   görsel (ör. 2. sahnedeki masadaki kalemler).

   DAVRANIŞ (TiklamaliSprite ile aynı his, ama animasyon YOK):
   - Açılışta görünmez; yerinde "dokun" halkası nabız atar.
   - İlk dokunuşta görsel yumuşakça belirir ve kalır (halka kaybolur) —
     ve tam o noktada bir yıldız parıltısı (Parilti) patlar (tek seferlik).

   Sprite'tan FARKI: tam-kare 16:9 değil; sayfada left/top/width ile
   konumlanan tek bir küçük <img>'dir (masaya oturan kalemler gibi).

   TIKLAMA: TiklamaliSprite ile aynı kayıt defterine (TiklamaKayit)
   yazılır; BookReader yüzeye gelen pointerdown'ı alfa-testiyle dener.
   Böylece görsel görünmezken bile, tam silüetine dokunulduğunda belirir
   ve sayfa-çevirme sürükleme bölgesiyle çakışmaz (kalemler sol kenara
   yakın olduğundan bu önemli).

   Props: src, left, top, width (sahne %'si), canli, zIndex
          baslangicGorunur — yalnızca geliştirici önizlemesi için (örn. ?kek):
            true ise açılışta zaten görünür başlar (dokun beklemeden).
          kutuTiklama — true ise alfa-hassas yerine "kutu" tıklama: görselin
            opak SINIR KUTUSUNA (silüeti çevreleyen dikdörtgen) dokunmak
            yeter. Görünen pikseller arasında boşluk olan öğelerde (ör.
            sayfa3 kek rafı: iki raf arası boşluk) "boşluğa/işarete tıklayınca
            algılanmıyor" sorununu çözer. İpucu halkası da bu kutunun
            merkezinde durur, böylece "işaretin olduğu yere dokununca gelir".
=============================================================== */
function TiklanirGorsel({ src, left = '0%', top = '0%', width = '20%', canli = true, zIndex = 10, baslangicGorunur = false, kutuTiklama = false }) {
  const sarmaRef = useRef(null) // konumlanan dış sarmalayıcı (sahne ölçüsü için)
  const imgRef = useRef(null)
  const canliRef = useRef(canli)
  canliRef.current = canli

  const [gorunur, setGorunur] = useState(baslangicGorunur) // dokunuldu mu? (belirdi mi?)
  const [parilti, setParilti] = useState(false) // ilk dokunuş yıldız patlaması
  const [merkez, setMerkez] = useState(null) // {cx,cy} opak merkez (0..1)

  // Kutu tıklama için opak sınır kutusu (0..1) — en güncelini ref'te tut.
  const kutuRef = useRef(null)

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('gorsel'))

  // Yüklendiğinde opak merkez + sınır kutusunu hesapla (yüklü gelmişse hemen)
  const merkeziHesapla = () => {
    const m = opakMerkez(imgRef.current)
    if (m) setMerkez(m)
    kutuRef.current = opakKutu(imgRef.current)
  }
  useEffect(() => {
    const im = imgRef.current
    if (im && im.complete && im.naturalWidth) merkeziHesapla()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // İlk dokunuşta belir + parılda; sonrakiler yok sayılır
  const oynat = () => {
    if (!canliRef.current) return
    if (!gorunur) {
      setParilti(true)
      setTimeout(() => setParilti(false), PARILTI_SURE_MS)
    }
    setGorunur(true)
  }

  // "Kutu" isabet testi: ekran noktası, görselin kapladığı kutuya göre opak
  // sınır kutusu (kutuRef) içine düşüyorsa (küçük pay ile) true.
  const kutuIsabet = (cx, cy) => {
    const el = imgRef.current
    const kutu = kutuRef.current
    if (!el || !kutu) return false
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return false
    const fx = (cx - r.left) / r.width
    const fy = (cy - r.top) / r.height
    const pay = 0.02 // küçük dokunma payı
    return (
      fx >= kutu.minx - pay && fx <= kutu.maxx + pay &&
      fy >= kutu.miny - pay && fy <= kutu.maxy + pay
    )
  }

  // Kayıt defteri stale closure yakalamasın diye en güncel fn'leri ref'te tut
  const fnRef = useRef({})
  fnRef.current.hitTest = (cx, cy) =>
    kutuTiklama ? kutuIsabet(cx, cy) : noktaDolu(imgRef.current, imgRef.current, cx, cy)
  fnRef.current.oynat = oynat

  useEffect(() => {
    if (!kayit) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex,
      hitTest: (x, y) => fnRef.current.hitTest(x, y),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, zIndex])

  return (
    <div ref={sarmaRef} className="pointer-events-none absolute" style={{ left, top, width, zIndex }}>
      <img
        ref={imgRef}
        src={src}
        alt=""
        draggable={false}
        onLoad={merkeziHesapla}
        className="block w-full select-none"
        style={{ opacity: gorunur ? 1 : 0, transition: 'opacity 360ms ease' }}
      />

      {/* DOKUN İPUCU — belirene kadar görselin opak merkezinde nabız atar.
          Konum görsel kutusunun %'sidir (wrapper = img kutusu). */}
      {canli && !gorunur && merkez && (
        <DokunIpucu style={{ left: `${merkez.cx * 100}%`, top: `${merkez.cy * 100}%`, zIndex: zIndex + 3 }} />
      )}

      {/* İLK DOKUNUŞ PARILTISI — görsel belirirken aynı noktada yıldızlar saçılır */}
      {canli && parilti && merkez && (
        <Parilti style={{ left: `${merkez.cx * 100}%`, top: `${merkez.cy * 100}%`, zIndex: zIndex + 4 }} />
      )}
    </div>
  )
}

export default TiklanirGorsel
