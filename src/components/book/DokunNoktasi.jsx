import { useContext, useEffect, useRef, useState } from 'react'
import { TiklamaKayitContext } from './tiklamaKayit.js'
import DokunIpucu from './DokunIpucu.jsx'
import Parilti, { PARILTI_SURE_MS } from './Parilti.jsx'

/* ===============================================================
   DOKUN NOKTASI — görseli olmayan, yalnızca BİR ETKİ tetikleyen
   tıklama noktası (ör. sayfa3'te keke dokununca koku/duman çıkar).

   TiklanirGorsel/TiklamaliSprite bir görsel BELİRTİR/oynatır; bu ise
   arka plana gömülü (kendi görseli olmayan) bir öğeye dokunma alanıdır:
   - Verilen (x,y) noktasında "dokun" halkası nabız atar.
   - O nokta etrafında YARIÇAP kadar (sahne genişliğinin %'si) bir daireye
     dokunmak yeter (affedici; tam piksele denk getirmek gerekmez).
   - İlk dokunuşta onTetik() çağrılır, halka kaybolur ve aynı noktada bir
     yıldız parıltısı (Parilti) patlar (tek seferlik).

   Kayıt defterine (TiklamaKayit) yazılır; BookReader yüzeydeki pointerdown'ı
   buraya yönlendirir (sayfa-çevirme sürüklemesiyle çakışmaz).

   Props: x, y (sahne %'si), yaricap (sahne genişliği %'si), canli, zIndex, onTetik
=============================================================== */
function DokunNoktasi({ x = '50%', y = '50%', yaricap = 8, canli = true, zIndex = 10, onTetik }) {
  const noktaRef = useRef(null) // (x,y) konumunda sıfır-boyut işaretçi (sahne ölçüsü)
  const canliRef = useRef(canli)
  canliRef.current = canli

  const [tetiklendi, setTetiklendi] = useState(false)
  const [parilti, setParilti] = useState(false)

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('nokta'))

  const oynat = () => {
    if (!canliRef.current || tetiklendi) return
    setTetiklendi(true)
    setParilti(true)
    setTimeout(() => setParilti(false), PARILTI_SURE_MS)
    onTetik?.()
  }

  // Yarıçap isabeti: tıklama, (x,y) noktasından yaricap% (sahne genişliği)
  // kadar uzaklıktaki daire içindeyse true.
  const hitTest = (cx, cy) => {
    const el = noktaRef.current
    const sahne = el?.parentElement
    if (!el || !sahne) return false
    const p = el.getBoundingClientRect() // sıfır boyut → sol/üst = nokta
    const s = sahne.getBoundingClientRect()
    if (s.width === 0) return false
    const r = (yaricap / 100) * s.width
    const dx = cx - p.left
    const dy = cy - p.top
    return dx * dx + dy * dy <= r * r
  }

  const fnRef = useRef({})
  fnRef.current.hitTest = hitTest
  fnRef.current.oynat = oynat

  useEffect(() => {
    if (!kayit) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex,
      hitTest: (a, b) => fnRef.current.hitTest(a, b),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, zIndex])

  return (
    <div
      ref={noktaRef}
      className="pointer-events-none absolute"
      style={{ left: x, top: y, width: 0, height: 0, zIndex }}
    >
      {/* DOKUN İPUCU — tetiklenene kadar nokta üstünde nabız atar */}
      {canli && !tetiklendi && <DokunIpucu style={{ left: 0, top: 0, zIndex: zIndex + 3 }} />}

      {/* İLK DOKUNUŞ PARILTISI — aynı noktada yıldızlar saçılır (tek seferlik) */}
      {canli && parilti && <Parilti style={{ left: 0, top: 0, zIndex: zIndex + 4 }} />}
    </div>
  )
}

export default DokunNoktasi
