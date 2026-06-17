import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useHareketAzalt } from '../../hooks/useHareketAzalt.js'

/* ===============================================================
   KARE ANİMASYON — genel amaçlı sprite (kare dizisi) oynatıcı

   Projedeki kanıtlanmış oynatma mantığını (TiklamaliSprite /
   IsilYurume) TEK bir yeniden kullanılabilir bileşende toplar:

   - rAF + GERÇEK SÜRE (delta): hangi karede olunacağı geçen gerçek
     süreden hesaplanır (setInterval drift'i yok; sekme arka plana
     geçse bile zamanla senkron kalır).
   - new Image() ile ÖN YÜKLEME + YÜKLEME-KAPISI: tüm kareler bir kez
     yüklenip çözülür; animasyon ANCAK hepsi hazır olunca başlar. Böylece
     tek <img>'in src'si değişirken hiç "boş kare" görünmez (ilk boyamada
     bile doğru kare vardır).
   - TEK <img> + IMPERATİF src değişimi: aynı anda yalnızca BİR kare
     bellekte/boyalıdır (yüzlerce MB çözülmüş bitmap yığını olmaz).

   ZAMAN ÇİZELGESİ (kareSureleri):
   - `kareSureleri` verilirse her kare KENDİ süresinde durur. 2 pozluk
     bir göz kırpma için ideal: [2600, 220] → uzun açık, kısa kapalı.
   - Verilmezse tüm kareler `frameSuresiMs` (veya 1000/fps) kadar durur.

   KİPLER: loop (sonsuz), yoyo (ileri-geri; n>2 için anlamlı), loop=false
   (bir kez oyna, son karede dur). Erişilebilirlik: "hareketleri azalt"
   açıkken animasyon durur, `durukKare`de sabit kalır.
=============================================================== */
const KareAnimasyon = forwardRef(function KareAnimasyon(
  {
    frames,
    fps = 12,
    frameSuresiMs, // verilirse fps'i ezer (tüm kareler eşit süre)
    kareSureleri, // verilirse her kare için ayrı süre (ms) — uzunluk=frames.length
    loop = true,
    yoyo = false,
    oynat = true,
    durukKare = 0,
    width = '100%',
    className = '',
    style = {},
    alt = '',
  },
  ref,
) {
  const imgRef = useRef(null)
  const onYukluRef = useRef([]) // new Image() nesneleri (preload + decode)
  const aktifRef = useRef(durukKare) // o an gösterilen kare (gereksiz src yazımını önler)
  const hazirRef = useRef(false) // tüm kareler yüklendi mi?

  // İLK src JSX'te verilir (ilk boyamada asla boş kare olmaz). Değer sabit
  // kabul edildiğinden React onu mount'tan sonra bir daha YAZMAZ → rAF'ın
  // imperatif src değişimleriyle çakışmaz (yeniden render'da kare sıçramaz).
  const [ilkSrc] = useState(() => frames[durukKare] ?? frames[0])

  const oynatRef = useRef(oynat)
  oynatRef.current = oynat
  const azalt = useHareketAzalt()
  const azaltRef = useRef(azalt)
  azaltRef.current = azalt

  // Oynatma sırası (yoyo'da ileri+geri) ve kümülatif zaman çizelgesi
  const cizelge = useMemo(() => {
    const n = frames.length
    if (n === 0) return { seg: [], total: 0 }
    const tek = frameSuresiMs ?? 1000 / fps
    const sure = (i) => (kareSureleri && kareSureleri[i] != null ? kareSureleri[i] : tek)
    let sira = Array.from({ length: n }, (_, i) => i)
    if (yoyo && n > 2) sira = sira.concat(Array.from({ length: n - 2 }, (_, k) => n - 2 - k))
    const seg = []
    let t = 0
    for (const f of sira) {
      t += sure(f)
      seg.push({ frame: f, until: t })
    }
    return { seg, total: t }
  }, [frames, fps, frameSuresiMs, kareSureleri, yoyo])

  // Belirli kareyi göster — yalnızca değiştiyse src yaz (decode'lu olduğu
  // için bu anında compositor'da görünür).
  const kareGoster = (i) => {
    const n = frames.length
    if (!n || !imgRef.current) return
    const yeni = ((i % n) + n) % n
    if (yeni === aktifRef.current) return
    aktifRef.current = yeni
    imgRef.current.src = frames[yeni]
  }

  useImperativeHandle(ref, () => ({
    kareGoster,
    basaSar: () => kareGoster(durukKare),
  }))

  // --- ÖN YÜKLEME + YÜKLEME KAPISI ---
  useEffect(() => {
    hazirRef.current = false
    let yuklenen = 0
    const bitti = () => {
      yuklenen += 1
      if (yuklenen >= frames.length) hazirRef.current = true
    }
    onYukluRef.current = frames.map((url) => {
      const im = new Image()
      im.decoding = 'async'
      im.onload = bitti
      im.onerror = bitti // hatalı kare animasyonu kilitlemesin
      im.src = url
      return im
    })
    return () => {
      onYukluRef.current.forEach((im) => {
        im.onload = im.onerror = null
      })
    }
  }, [frames])

  // --- TEK rAF DÖNGÜSÜ (delta + zaman çizelgesi) ---
  useEffect(() => {
    const n = frames.length
    if (n === 0) return

    kareGoster(durukKare) // ilk görünür kare (yüklenince boyanır)

    const { seg, total } = cizelge
    let rafId = 0
    let baslangic

    const tik = (now) => {
      rafId = requestAnimationFrame(tik)

      // Hazır değil / durmuş / hareket-azalt / tek kare: duruk karede bekle
      if (!hazirRef.current || !oynatRef.current || azaltRef.current || total === 0 || n === 1) {
        baslangic = undefined
        kareGoster(durukKare)
        return
      }

      if (baslangic === undefined) baslangic = now
      const gecen = now - baslangic
      const t = loop ? gecen % total : Math.min(gecen, total - 0.001)

      let f = seg[seg.length - 1].frame
      for (let k = 0; k < seg.length; k++) {
        if (t < seg[k].until) {
          f = seg[k].frame
          break
        }
      }
      kareGoster(f)
    }
    rafId = requestAnimationFrame(tik)

    // Sekmeye dönünce zamanı sıfırla (arka planda uzun kaldıysa sıçramasın)
    const gorunur = () => {
      if (document.visibilityState === 'visible') baslangic = undefined
    }
    document.addEventListener('visibilitychange', gorunur)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('visibilitychange', gorunur)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, loop, durukKare, cizelge])

  if (frames.length === 0) return null

  return (
    // src İLK kare ile verilir (boş kare olmaz); sonraki kareleri rAF
    // imperatif olarak yazar (decode'lu kareler, React'i tetiklemeden).
    <img
      ref={imgRef}
      src={ilkSrc}
      alt={alt}
      draggable={false}
      decoding="async"
      className={`pointer-events-none select-none ${className}`}
      style={{ display: 'block', width, ...style }}
    />
  )
})

export default KareAnimasyon
