import { useContext, useEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from './tiklamaKayit.js'
import { opakMerkez, noktaDolu } from './alfaHarita.js'
import DokunIpucu from './DokunIpucu.jsx'

/* ===============================================================
   TIKLANIR GÖRSEL — açılışta görünmeyen, DOKUNUNCA beliren statik
   görsel (ör. 2. sahnedeki masadaki kalemler).

   DAVRANIŞ (TiklamaliSprite ile aynı his, ama animasyon YOK):
   - Açılışta görünmez; yerinde "dokun" halkası nabız atar.
   - İlk dokunuşta görsel yumuşakça belirir ve kalır (halka kaybolur).

   Sprite'tan FARKI: tam-kare 16:9 değil; sayfada left/top/width ile
   konumlanan tek bir küçük <img>'dir (masaya oturan kalemler gibi).

   TIKLAMA: TiklamaliSprite ile aynı kayıt defterine (TiklamaKayit)
   yazılır; BookReader yüzeye gelen pointerdown'ı alfa-testiyle dener.
   Böylece görsel görünmezken bile, tam silüetine dokunulduğunda belirir
   ve sayfa-çevirme sürükleme bölgesiyle çakışmaz (kalemler sol kenara
   yakın olduğundan bu önemli).

   Props: src, left, top, width (sahne %'si), canli, zIndex
=============================================================== */
function TiklanirGorsel({ src, left = '0%', top = '0%', width = '20%', canli = true, zIndex = 10 }) {
  const imgRef = useRef(null)
  const canliRef = useRef(canli)
  canliRef.current = canli

  const [gorunur, setGorunur] = useState(false) // dokunuldu mu? (belirdi mi?)
  const [merkez, setMerkez] = useState(null) // {cx,cy} opak merkez (0..1)

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('gorsel'))

  // Yüklendiğinde opak merkezi hesapla (yüklü gelmişse hemen)
  const merkeziHesapla = () => {
    const m = opakMerkez(imgRef.current)
    if (m) setMerkez(m)
  }
  useEffect(() => {
    const im = imgRef.current
    if (im && im.complete && im.naturalWidth) merkeziHesapla()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // İlk dokunuşta belir; sonrakiler yok sayılır
  const oynat = () => {
    if (!canliRef.current) return
    setGorunur(true)
  }

  // Kayıt defteri stale closure yakalamasın diye en güncel fn'leri ref'te tut
  const fnRef = useRef({})
  fnRef.current.hitTest = (cx, cy) => noktaDolu(imgRef.current, imgRef.current, cx, cy)
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
    <div className="pointer-events-none absolute" style={{ left, top, width, zIndex }}>
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
    </div>
  )
}

export default TiklanirGorsel
