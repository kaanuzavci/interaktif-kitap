import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TiklamaKayitContext } from './tiklamaKayit.js'
import { opakMerkez, noktaDolu } from './alfaHarita.js'
import { kitapSaati } from '../../hooks/kitapDuraklat.js'
import DokunIpucu from './DokunIpucu.jsx'
import Parilti, { PARILTI_SURE_MS } from './Parilti.jsx'

/* ===============================================================
   KONUMLU SPRITE — TiklamaliSprite gibi tıklayınca SÜREKLİ oynayan
   bir kare dizisi; FARKI: tam-16:9 tuvale gömülü değildir.

   TiklamaliSprite, tam-kare (16:9) bir tuvali sahneye STRETCH eder
   (h-full w-full) ve olcek/x/y ile kaydırır — kareler 16:9 olduğu için
   bozulma olmaz. Ama bu sahnedeki Işıl portresi DİKEY (2480x3508); onu
   16:9'a esnetmek yatay sıkıştırır. Bu bileşen bunun yerine TiklanirGorsel
   gibi sayfada left/top/width ile konumlanan, EN-BOY oranını KORUYAN tek
   bir <img>'dir (auto yükseklik) ve üstüne TiklamaliSprite'ın kanıtlanmış
   kare-döngü mantığını koyar.

   DAVRANIŞ (TiklamaliSprite ile birebir aynı his):
   - İlk dokunuşa kadar animasyon oynamaz (dinlenme karesinde durur) ve
     görselin opak merkezinde "dokun" ipucu (nabız atan daireler) durur.
   - Bir kez dokununca animasyon DÖNGÜYE girer; ipucu kaybolur, aynı
     noktada bir yıldız parıltısı patlar (tek seferlik).

   PİKSEL-HASSAS TIKLAMA: dikdörtgen hotspot yok; o an gösterilen karenin
   ALFA kanalına göre test edilir (alfaHarita.js + BookReader kaydı), tıpkı
   TiklamaliSprite/TiklanirGorsel gibi.

   Props: frames, left, top, width (sahne %'si), frameSuresiMs, bekleKare,
          beklemeSuresiMs, donguArasiMs, canli, zIndex, ilkDokunusKaresi,
          ipucuYuzde, onOynat, yumusakDur
=============================================================== */
function KonumluSprite({
  frames,
  left = '0%',
  top = '0%',
  width = '20%',
  frameSuresiMs = 120,
  bekleKare = null,
  beklemeSuresiMs = 0,
  donguArasiMs = 0,
  canli = true,
  zIndex = 10,
  ilkDokunusKaresi = 0, // ilk dokunuşta bu kareden başla; sonraki turlar normal
  ipucuYuzde = null, // {x,y} GÖRSEL KUTUSUNUN %'si — verilirse "dokun" ipucu
  // opak merkez yerine TAM bu noktada durur (ör. sayfa-8 çiçeğinde saplı/saksılı
  // silüetin kütle merkezi sapa düşer; ipucu elle yüzün üstüne sabitlenir)
  onOynat = null, // İLK dokunuşta (animasyon başlarken) bir kez çağrılır
  // true olunca döngü YARIDA KESİLMEZ: mevcut tur son karesine kadar oynar,
  // sonra kare 0'da (dinlenme) yumuşakça durur (ör. konuşma sesi bitince ağız
  // kapanır). false'a dönerse (konuşma yeniden başladı) döngü kaldığı gibi sürer.
  yumusakDur = false,
}) {
  const imgRef = useRef(null) // görünen (konumlanmış) <img> — isabet kutusu
  const imgObjRef = useRef([]) // alfa testi için Image nesneleri
  const aktifKareRef = useRef(0) // o an gösterilen kare indeksi
  const oynatRef = useRef(false) // döngü açık mı?
  const baslangicRef = useRef(0) // döngü başlangıç zamanı (ms)
  const rafRef = useRef(0)
  const canliRef = useRef(canli)
  canliRef.current = canli
  const durIstekRef = useRef(yumusakDur) // yumuşak durma isteği (prop aynası)
  durIstekRef.current = yumusakDur
  const durduRef = useRef(false) // tur tamamlanıp kare 0'da duruldu mu?
  const sonGecenRef = useRef(0) // tur sarımını (wrap) yakalamak için

  // İLK src JSX'te verilir (auto-yükseklik <img> boyutu hemen oturur, boş
  // kare/zıplama olmaz). Sabit kabul edildiğinden React mount sonrası bir
  // daha YAZMAZ → rAF'ın imperatif src değişimleriyle çakışmaz.
  const [ilkSrc] = useState(() => frames[0])

  const [oynadi, setOynadi] = useState(false) // ipucunu gizlemek için
  const [parilti, setParilti] = useState(false) // ilk dokunuş yıldız patlaması
  const [merkez, setMerkez] = useState(null) // {cx,cy} frame0 opak merkezi (0..1)

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('konumlu-sprite'))

  // Zaman çizelgesi: bir tur kareler + (varsa) döngü-arası dinlenme (frame 0).
  const dongu = useMemo(() => {
    if (!frames.length) return { seg: [], total: 0 }
    const seg = []
    let t = 0
    for (let f = 0; f < frames.length; f++) {
      let dur = frameSuresiMs
      if (bekleKare !== null && f === bekleKare && beklemeSuresiMs > 0) dur += beklemeSuresiMs
      t += dur
      seg.push({ frame: f, until: t })
    }
    if (donguArasiMs > 0) {
      t += donguArasiMs
      seg.push({ frame: 0, until: t }) // döngüler arası: dinlenme karesinde bekle
    }
    return { seg, total: t }
  }, [frames.length, frameSuresiMs, bekleKare, beklemeSuresiMs, donguArasiMs])

  // Kareleri önbelleğe al + alfa testi için Image nesneleri + ipucu merkezi.
  // YALNIZCA canli iken: canli=false kopyalar (sayfa-çevirme önizlemesi)
  // hiç animasyon oynatmaz ve hit-test edilmez → tüm kareleri decode etmek
  // saf israftır. Bu koruma, ağır sahnelerde (ör. syf9: 87 kare) çevirme
  // anında 3-5× tekrarlanan decode patlamasını (mobil çökme sebebi) önler.
  useEffect(() => {
    if (!canli) return
    imgObjRef.current = frames.map((url) => {
      const im = new Image()
      im.src = url
      return im
    })
    const im0 = imgObjRef.current[0]
    const merkeziHesapla = () => {
      const m = opakMerkez(im0)
      if (m) setMerkez(m)
    }
    if (im0 && im0.complete && im0.naturalWidth) merkeziHesapla()
    else if (im0) im0.onload = merkeziHesapla
  }, [frames, canli])

  // Başlangıçta dinlenme karesi + unmount temizliği
  useEffect(() => {
    aktifKareRef.current = 0
    if (imgRef.current && frames.length) imgRef.current.src = frames[0]
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [frames])

  const kareYaz = (f) => {
    aktifKareRef.current = f
    if (imgRef.current) imgRef.current.src = frames[f]
  }

  // rAF döngüsü — yalnızca oynarken; SONSUZ (modulo toplam süre)
  const tik = (zaman) => {
    if (!oynatRef.current || dongu.total === 0 || durduRef.current) {
      rafRef.current = 0
      return
    }
    // kitapSaati: durdur düğmesine basılınca zaman donar → kare donar
    const gecen = (kitapSaati(zaman) - baslangicRef.current) % dongu.total
    // YUMUŞAK DURDURMA: istek geldiyse turu YARIDA KESME — son kare de
    // gösterildikten sonra (dinlenme dilimine girişte ya da tur sarımında)
    // kare 0'da kal. Böylece ör. kare 5'teyken 6 ve dinlenme karesi (0)
    // oynanır, ani atlama olmaz.
    const turBitti =
      gecen < sonGecenRef.current ||
      (dongu.seg.length > frames.length && gecen >= dongu.seg[frames.length - 1].until)
    sonGecenRef.current = gecen
    if (durIstekRef.current && turBitti) {
      durduRef.current = true
      kareYaz(0)
      rafRef.current = 0
      return
    }
    let f = frames.length - 1
    for (let k = 0; k < dongu.seg.length; k++) {
      if (gecen < dongu.seg[k].until) {
        f = dongu.seg[k].frame
        break
      }
    }
    if (f !== aktifKareRef.current) kareYaz(f)
    rafRef.current = requestAnimationFrame(tik)
  }

  // Yumuşak durma İPTAL edilirse (ör. TEKRAR ile konuşma yeniden başladı)
  // ve döngü durmuşsa: dinlenme karesinden baştan sür.
  useEffect(() => {
    if (yumusakDur || !durduRef.current) return
    durduRef.current = false
    sonGecenRef.current = 0
    baslangicRef.current = kitapSaati(performance.now())
    if (oynatRef.current && !rafRef.current) rafRef.current = requestAnimationFrame(tik)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yumusakDur])

  // En güncel onOynat'ı ref'te tut (kayıt defteri stale closure yakalamasın)
  const onOynatRef = useRef(onOynat)
  onOynatRef.current = onOynat

  // İLK dokunuş döngüyü başlatır; sonrakiler yok sayılır
  const oynat = () => {
    if (!canliRef.current || frames.length === 0) return
    if (oynatRef.current) return
    oynatRef.current = true
    onOynatRef.current?.()
    setOynadi(true)
    setParilti(true)
    setTimeout(() => setParilti(false), PARILTI_SURE_MS)
    // İlk dokunuşta istenen kareden başla: zaman çizelgesini o karenin
    // başlangıç anına ofsetle (TiklamaliSprite ile aynı).
    sonGecenRef.current = 0
    const simdi = kitapSaati(performance.now())
    if (ilkDokunusKaresi > 0 && dongu.seg.length > ilkDokunusKaresi) {
      const ofset = dongu.seg[ilkDokunusKaresi - 1].until
      baslangicRef.current = simdi - ofset
    } else {
      baslangicRef.current = simdi
    }
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tik)
  }

  // En güncel fonksiyonları ref'te tut (kayıt defteri stale closure yakalamasın)
  const fnRef = useRef({})
  // SAYFA ÇEVİRME ÖNCELİĞİ: animasyon başladıktan sonra (oynat) öğe artık
  // dokunmayı yutmaz → isabet testi false döner, pointerdown sürükleme
  // bölgesine geçer ve SAYFA çevrilir. (Sürüklenebilir öğeler hariç.)
  fnRef.current.hitTest = (cx, cy) =>
    oynatRef.current
      ? false
      : noktaDolu(imgRef.current, imgObjRef.current[aktifKareRef.current] || imgObjRef.current[0], cx, cy)
  fnRef.current.oynat = oynat

  // Kayıt defterine yaz / sil
  useEffect(() => {
    if (!kayit) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => canliRef.current,
      zIndex,
      hitTest: (x2, y2) => fnRef.current.hitTest(x2, y2),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, zIndex])

  // Sekmeye dönülünce: oynuyor olması gerekirken döngü durmuşsa yeniden başlat
  // (yumuşakça durdurulmuşsa DURMUŞ kalır).
  useEffect(() => {
    const gorunur = () => {
      if (document.visibilityState === 'visible' && oynatRef.current && !durduRef.current && !rafRef.current) {
        rafRef.current = requestAnimationFrame(tik)
      }
    }
    document.addEventListener('visibilitychange', gorunur)
    return () => document.removeEventListener('visibilitychange', gorunur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (frames.length === 0) return null

  return (
    // Konumlanan sarmalayıcı (sahne %'si). İçinde EN-BOY oranını koruyan
    // tek <img> (w-full → auto yükseklik). DokunIpucu/Parilti sarmalayıcıya
    // (yani görsel kutusuna) göre konumlanır.
    <div className="pointer-events-none absolute" style={{ left, top, width, zIndex }}>
      {/* Kare görseli — ilk src JSX'te; sonraki kareleri rAF imperatif yazar. */}
      <img
        ref={imgRef}
        src={ilkSrc}
        alt=""
        draggable={false}
        className="block w-full select-none"
      />

      {/* DOKUN İPUCU — ilk dokunuşa kadar görselin opak merkezinde (veya
          ipucuYuzde verilmişse tam o noktada) nabız atar. */}
      {canli && !oynadi && (ipucuYuzde || merkez) && (
        <DokunIpucu
          style={{
            left: `${ipucuYuzde ? ipucuYuzde.x : merkez.cx * 100}%`,
            top: `${ipucuYuzde ? ipucuYuzde.y : merkez.cy * 100}%`,
            zIndex: zIndex + 3,
          }}
        />
      )}

      {/* İLK DOKUNUŞ PARILTISI — aynı noktada yıldızlar saçılır (tek seferlik) */}
      {canli && parilti && (ipucuYuzde || merkez) && (
        <Parilti
          style={{
            left: `${ipucuYuzde ? ipucuYuzde.x : merkez.cx * 100}%`,
            top: `${ipucuYuzde ? ipucuYuzde.y : merkez.cy * 100}%`,
            zIndex: zIndex + 4,
          }}
        />
      )}
    </div>
  )
}

export default KonumluSprite
