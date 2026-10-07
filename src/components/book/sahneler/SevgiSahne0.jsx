import { useContext, useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { TiklamaKayitContext } from '../tiklamaKayit.js'
import DokunIpucu from '../DokunIpucu.jsx'
import SayfaKaydirmaIpucu from '../SayfaKaydirmaIpucu.jsx'
import { kitapSaati, useKitapDuraklat } from '../../../hooks/kitapDuraklat.js'
import { useHareketAzalt } from '../../../hooks/useHareketAzalt.js'
import { sayfa0TekrarKaydet } from '../../../hooks/useSahneSesi.js'
import { OgreticiContext } from '../ogreticiContext.js'

/* ===============================================================
   SEVGİ — 0. SAHNE (AÇILIŞ / sayfa0)

   Kitap kapağından sonra gelen giriş sayfası. Kitap açık gibi İKİ
   yarıya bölünür ama SOL yarı boştur (yalnızca arka_plan0 kremi);
   TÜM içerik SAĞ sayfada (16:9'un sağ yarısı) oynar.

   KOREOGRAFİ (dokunuşlarla ilerler):
     1. 'dokun' : animasyon1.webm BİR KEZ (4.9sn) — el gelir, yazıya
        dokunur, "Sevgi" yamulur. Yamulma sesi videonun YAMULMA ANINDA
        çalınır (sprite; dosyanın başındaki efekt sayfa açılır açılmaz
        duyuluyordu — istenmedi). Video bitince son karede durur ve
        yazının üstünde DOKUN İPUCU belirir (tüm sahne tıklanabilir).
     2. 'dus'   : dokununca animasyon2.webm BİR KEZ — 5 harf sırayla
        (i→g→v→e→S) düşer; HER harfin düşüşü başlarken "harf düşme
        sesi" yeniden çalar (HARF_ZAMANLARI, video saatinden izlenir).
     3. 'peek'  : sırayla sol1(22)→sag2(24)→sol3(22)→sag4(24) — Işıl sağ
        sayfanın kenarlarından sırayla başını uzatıp çeker (peek-a-boo).
        Her kare-karo TAM sağ sayfayı doldurur (2044x2302 ≈ 8:9).
     4. 'bekle' : ekran BOŞ kalır (yalnız krem fon); sağ sayfanın ortasında
        DOKUN İPUCU nabız atar. Dokunuş beklenir.
     5. 'isil'  : dokununca Işıl büstü (isil, 6 kare, şeffaf) sağ sayfaya
        gelir; ağız döngüsü + tanıtma sesi (sounds/sayfa0/1.mp3) AYNI ANDA
        başlar. Ses bitince döngü durur, Işıl İLK karede (frame_01) bekler.
        TEKRAR düğmesi ses + ağız animasyonunu birlikte baştan oynatır
        (useSahneSesi.sayfa0TekrarKaydet üzerinden).

   YAZI AŞAMALARI VİDEO (webm/VP9, 1920x1080): eski yazi_dokun/yazi_dus
   PNG kare dizilerinin yerini aldı — 268 büyük kare yerine iki ~250KB
   video; tarayıcı decode'u kendi yapar (mobil bellek dostu). Videolar
   SESSİZDİR (muted, gömük ses izi kullanılmaz); efekt sesleri karma
   klasöründen Howler ile çalınır → global ses düğmesine uyar.

   BELLEK (peek/isil): kareler rAF ile SIRALI src yazımıyla oynatılır →
   tarayıcı yalnızca o anki kareyi decode eder; encoded PNG'ler HTTP
   cache'ten gelir.

   DURAKLAT: kare zamanlaması kitapSaati() üzerinden; videolar ve döngülü
   yamulma sesi ayrıca useKitapDuraklat ile pause/resume edilir → DURDUR
   düğmesi her aşamayı dondurur (diğer sahnelerle aynı his).
=============================================================== */

/* Kareleri NUMARIK sırayla topla — dosya adları tutarlı sıfır-dolgulu
   DEĞİL (yazi1_frame_9, _10, _100...), bu yüzden leksikografik sort yanlış
   olur; kare numarasına göre sayısal sıralarız. */
function kareler(moduller) {
  return Object.entries(moduller)
    .map(([yol, url]) => [Number((yol.match(/_(\d+)\.\w+$/) || [])[1] || 0), url])
    .sort((a, b) => a[0] - b[0])
    .map(([, url]) => url)
}

const SOL1 = kareler(
  import.meta.glob('../../../assets/backgrounds/sayfa0/sol1/*.webp', { eager: true, import: 'default' }),
)
const SAG2 = kareler(
  import.meta.glob('../../../assets/backgrounds/sayfa0/sag2/*.webp', { eager: true, import: 'default' }),
)
const SOL3 = kareler(
  import.meta.glob('../../../assets/backgrounds/sayfa0/sol3/*.webp', { eager: true, import: 'default' }),
)
const SAG4 = kareler(
  import.meta.glob('../../../assets/backgrounds/sayfa0/sag4/*.webp', { eager: true, import: 'default' }),
)
const ISIL = kareler(
  import.meta.glob('../../../assets/backgrounds/sayfa0/isil/*.webp', { eager: true, import: 'default' }),
)
import isilSesi from '../../../assets/sounds/sayfa0/1.mp3'
import { GULME_SESI, YAZI_YAMULMA_SESI, HARF_DUSME_SESI } from '../../../audio/karmaSesleri.js'

// Yazı aşamalarının videoları + statik poster (ilk kare; donuk önizleme ve
// video decode olana dek görünen kare — sayfa çevirme katmanı video açmaz).
import animasyon1 from '../../../assets/backgrounds/sayfa0/animasyon1.webm'
import animasyon2 from '../../../assets/backgrounds/sayfa0/animasyon2.webm'
import animasyonPoster from '../../../assets/backgrounds/sayfa0/animasyon_poster.jpg'

// PEEK alt-segmentleri: Işıl kenardan sırayla başını uzatır. İLK (sol1) ve
// SON (sag4) çıkışta GÜLME sesi çalar; bu ikisi gülme süresine (~2.5sn) yakın
// olsun diye DAHA YAVAŞ (fps düşük), ortadakiler (sag2/sol3) bir tık hızlı.
// Böylece ses tam sol1 ve sag4'e oturur, aralarda gülme sızmaz.
const PEEK_SUBLER = [
  { kareler: SOL1, fps: 12, gulme: true },
  { kareler: SAG2, fps: 16, gulme: false },
  { kareler: SOL3, fps: 16, gulme: false },
  { kareler: SAG4, fps: 12, gulme: true },
]

// Tempo (kare/sn)
const ISIL_KARE_MS = 170 // konuşma ağız döngüsü

// animasyon2'de harflerin DÜŞMEYE BAŞLADIĞI anlar (sn, video saati) —
// kare şeridinden ölçüldü: harfler sondan başa (i→g→v→e→S) sırayla düşer.
// Her eşik geçildiğinde harf düşme sesi bir kez çalar (5 harf = 5 ses).
// Son harf (S) kulakla bir tık geç kalıyordu → 3.05'ten 2.85'e çekildi.
const HARF_ZAMANLARI = [0.15, 0.75, 1.45, 2.1, 2.85]

// Video bitince beliren dokun ipucunun yeri ("Sevgi" yazısının merkezi,
// tam tuvalin yüzdesi olarak; el son karede çekilmiş durumda).
const IPUCU_KONUM = { x: 75, y: 29 }

// 'bekle' aşamasındaki ipucu: SAĞ SAYFANIN ortası (tam tuval yüzdesi).
const BEKLE_IPUCU = { x: 75, y: 50 }

// YAZI YAMULMA SESİ: dosyada 3 ayrı efekt parçası var (0.25 / 3.09 / 6.77 sn,
// araları sessiz — ffmpeg silencedetect). Görsel yamulmaya (video t≈2.0–3.6,
// kare şeridinden) denk gelen 3.09'daki parça, video saati YAMULMA_ANI'na
// gelince sprite ile çalınır. Dosyayı baştan çalmak ilk parçayı sayfa açılır
// açılmaz duyuruyordu (istenmedi).
const YAMULMA_SES_DILIMI = { yamul: [2950, 700] }
const YAMULMA_ANI = 1.95 // video saati (sn) — istek üzerine 1 sn erkene alındı

// Geliştirici kısayolu: ?p0faz=dus|peek|bekle|isil ile bir aşamadan başla
// (görsel doğrulama). Böyle bir faz verilmişse öğretici de atlanır (BookReader
// da bu durumda öğreticiyi kapatır). Aksi halde normal 'dokun' akışı.
const P0FAZ =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('p0faz')
    : null
const BASLANGIC_FAZ =
  P0FAZ === 'dus' || P0FAZ === 'peek' || P0FAZ === 'bekle' || P0FAZ === 'isil' ? P0FAZ : 'dokun'

function SevgiSahne0({ canli = true }) {
  const azalt = useHareketAzalt()
  const azaltRef = useRef(azalt)
  azaltRef.current = azalt

  // Öğretici (durdur/ses/tekrar tanıtımı) aktifse koreografi BAŞLAMAZ; sayfa
  // boş kalır. Değer BookReader'dan OgreticiContext ile render-senkron gelir.
  const ogreticiAktif = useContext(OgreticiContext)

  const [durum, setDurum] = useState('dokun') // dokun|dus|peek|bekle|isil
  const durumRef = useRef('dokun')
  // animasyon1 bitince "buraya dokun" ipucu göster (dokunuş bekleniyor)
  const [ipucu, setIpucu] = useState(false)
  // Işıl'ın konuşması bitince sağ sayfada "sayfayı çevir" (sağı tutup sola
  // sürükle) ipucu belirir → çocuğa sonraki sayfaya nasıl geçileceğini gösterir.
  // Sürekli döngüde oynar (SayfaKaydirmaIpucu Lottie); kullanıcı çevirene dek.
  const [sayfaCevirIpucu, setSayfaCevirIpucu] = useState(false)

  const video1Ref = useRef(null) // tam-tuval <video> (animasyon1: yazı yamulma, döngü)
  const video2Ref = useRef(null) // tam-tuval <video> (animasyon2: harfler düşer, bir kez)
  const karoRef = useRef(null) // sağ sayfa <img> (peek karoları)
  const isilRef = useRef(null) // sağ sayfa Işıl büstü <img>
  const rafRef = useRef(0)
  const sesRef = useRef(null)
  const gulmeRef = useRef(null) // Işıl'ın çıkışındaki gülme sesi
  const yamulmaRef = useRef(null) // yamulma sesi (videonun yamulma anında sprite)
  const harfRef = useRef(null) // 'dus'ta her harf düşerken çalan ses
  // AKTİF segmentin Image nesnelerini CANLI TUTAR → tarayıcı decode'u
  // GC'lemez, kareler yeniden decode edilmez → oynatım pürüzsüz (peek/isil'in
  // takılmasının/hızlanmasının asıl sebebi buydu; TiklamaliSprite de böyle yapar).
  const heldRef = useRef([])

  const kayit = useContext(TiklamaKayitContext)
  const idRef = useRef(Symbol('sayfa0-dokun'))
  const apiRef = useRef(null)

  // --- KOREOGRAFİ MOTORU (yalnızca canli) ---
  useEffect(() => {
    if (!canli) return
    let iptal = false

    const durdur = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    const yaz = (ref, url) => { if (ref.current && url && ref.current.src !== url) ref.current.src = url }

    // Bir kare dizisini fps hızında oynat. loop=false → bitince onDone.
    const oynat = (urls, ref, fps, { loop = false, onDone } = {}) => {
      durdur()
      if (!urls.length) { onDone?.(); return }
      const ms = 1000 / fps
      // Hareket azalt: animasyon yok → son kareye atla
      if (azaltRef.current && !loop) { yaz(ref, urls[urls.length - 1]); onDone?.(); return }
      const t0 = kitapSaati(performance.now())
      yaz(ref, urls[0])
      const tik = (now) => {
        if (iptal) { rafRef.current = 0; return }
        let idx = Math.floor((kitapSaati(now) - t0) / ms)
        if (!loop && idx >= urls.length) { yaz(ref, urls[urls.length - 1]); rafRef.current = 0; onDone?.(); return }
        if (loop) idx %= urls.length
        yaz(ref, urls[idx])
        rafRef.current = requestAnimationFrame(tik)
      }
      rafRef.current = requestAnimationFrame(tik)
    }

    // Kareleri CANLI TUT (decode korunur → pürüzsüz). Yeni segmente geçince
    // öncekiler bırakılır (bellek: aynı anda tek segment tutulur).
    const tut = (urls) => {
      const imgs = urls.map((u) => { const im = new Image(); im.src = u; return im })
      heldRef.current = imgs
      return imgs
    }

    // Işıl kenardan çıkarken GÜLME sesi (global mute'a saygılı). Görsel HAZIR
    // olunca (segment ilk karesi decode edilince) çalınır → ses tam çıkışa oturur.
    // GECİKME DÜZELTMESİ: dosyanın başında ~1.15 sn neredeyse-sessiz bölüm var
    // (ffmpeg silencedetect: kahkaha 1.19 sn'de başlıyor) → sprite ile atlanır,
    // ses Işıl'ın çıkışına TAM oturur. Seviye istek üzerine kısıldı (0.85→0.5).
    const gulmeCal = () => {
      if (!GULME_SESI) return
      try {
        if (gulmeRef.current) { gulmeRef.current.stop(); gulmeRef.current.unload() }
        gulmeRef.current = new Howl({
          src: [GULME_SESI],
          format: ['mpeg'],
          volume: 0.5,
          sprite: { gul: [1150, 1440] },
        })
        gulmeRef.current.play('gul')
      } catch { /* ses yoksa sessiz geç */ }
    }

    // Gülmeyi yumuşakça sustur (sol1 bitince → sag2/sol3'e sızmasın).
    const gulmeSustur = () => {
      const h = gulmeRef.current
      if (!h) return
      try {
        h.fade(h.volume(), 0, 260)
        setTimeout(() => { try { h.stop(); h.unload() } catch { /* yok */ } if (gulmeRef.current === h) gulmeRef.current = null }, 300)
      } catch { /* yok */ }
    }

    // Peek alt-segmentlerini sırayla oynat. Her segment kendi karelerini canlı
    // tutar; ilk kare decode edilince (görsel hazır) gülme + animasyon BİRLİKTE
    // başlar → ses görselle senkron.
    const peekSubOynat = async (i, done) => {
      if (iptal) return
      if (i >= PEEK_SUBLER.length) { done?.(); return }
      const sub = PEEK_SUBLER[i]
      const imgs = tut(sub.kareler)
      try { await imgs[0].decode() } catch { /* decode yoksa yine de oyna */ }
      if (iptal || durumRef.current !== 'peek') return
      if (sub.gulme) gulmeCal()
      oynat(sub.kareler, karoRef, sub.fps, {
        onDone: () => {
          // Gülme yalnızca sol1/sag4 SÜRESİNCE kalsın: segment bitince yumuşakça
          // sustur → sag2/sol3'e VE sag4 sonrası isil'e taşmaz.
          if (sub.gulme) gulmeSustur()
          peekSubOynat(i + 1, done)
        },
      })
    }

    // Işıl'ın KONUŞMASI: ağız döngüsü + tanıtma sesi AYNI ANDA başlar;
    // ses bitince döngü durur ve Işıl İLK karede (isil_son frame_01) bekler.
    // TEKRAR düğmesi de bunu çağırır (ses + animasyon birlikte baştan).
    const isilKonusmaBaslat = () => {
      if (iptal) return
      setSayfaCevirIpucu(false) // konuşma yeniden başlarsa (TEKRAR) çevir ipucunu gizle
      oynat(ISIL, isilRef, 1000 / ISIL_KARE_MS, { loop: true })
      if (sesRef.current) { try { sesRef.current.stop(); sesRef.current.unload() } catch { /* yok */ } sesRef.current = null }
      // Seslendirme (global mute'a saygılı — Howler.mute kapatır)
      try {
        sesRef.current = new Howl({
          src: [isilSesi],
          volume: 0.9,
          onend: () => {
            if (iptal || durumRef.current !== 'isil') return
            durdur() // ağız döngüsünü durdur
            yaz(isilRef, ISIL[0]) // isil_son frame_01'de sabit kal
            setSayfaCevirIpucu(true) // konuşma bitti → "sayfayı çevir" ipucu belirir
          },
          // Ses yüklenemezse konuşma hiç bitmez → yine de çevir ipucunu göster
          onloaderror: () => {
            if (!iptal && durumRef.current === 'isil') setSayfaCevirIpucu(true)
          },
        })
        sesRef.current.play()
      } catch { /* ses yoksa sessiz geç */ setSayfaCevirIpucu(true) }
    }

    // Işıl büstüne geç: büst karesi (8.7MP) DECODE EDİLDİKTEN sonra durumu
    // değiştir → boş sayfadan Işıl'a geçiş anında olur (yarım kare çakmaz).
    const isilBaslat = async () => {
      const imgs = tut(ISIL) // büst karelerini canlı tut → konuşma döngüsü pürüzsüz
      try { await imgs[0].decode() } catch { /* yine de göster */ }
      if (iptal) return
      durumRef.current = 'isil'
      setDurum('isil')
      isilKonusmaBaslat()
    }

    // Videoyu baştan oynat. play() reddedilirse (otomatik oynatma engeli vb.)
    // koreografi TIKANMASIN diye onFail çağrılır (döngü videoda posterde kalınır).
    const videoOynat = (ref, onFail) => {
      const v = ref.current
      if (!v) { onFail?.(); return }
      try { v.currentTime = 0 } catch { /* metadata gelmemiş olabilir */ }
      const soz = v.play()
      if (soz?.catch) soz.catch(() => onFail?.())
    }

    // Yamulma sesi Howl'u ÖN YÜKLENİR (çalmaz) → yamulma anında gecikmez.
    if (YAZI_YAMULMA_SESI && !yamulmaRef.current) {
      try {
        yamulmaRef.current = new Howl({
          src: [YAZI_YAMULMA_SESI],
          format: ['mpeg'],
          volume: 0.8,
          sprite: YAMULMA_SES_DILIMI,
          preload: true,
        })
      } catch { /* yok */ }
    }

    // animasyon1 oynarken video SAATİNİ izle; yazı yamulma ANINA gelince
    // (YAMULMA_ANI) sesin yalnızca o dilimini çal → sayfa açılışında ses yok,
    // ses görsel yamulmayla birlikte gelir. (DURDUR videoyu dondurur → bekler.)
    const yamulmaWatcherBaslat = () => {
      const tik = () => {
        if (iptal || durumRef.current !== 'dokun') return
        const t = video1Ref.current?.currentTime ?? 0
        if (t >= YAMULMA_ANI) {
          try { yamulmaRef.current?.play('yamul') } catch { /* yok */ }
          return
        }
        requestAnimationFrame(tik)
      }
      requestAnimationFrame(tik)
    }

    // Yamulma sesini yumuşakça sustur (video sonu / dokunuş).
    const yamulmaSustur = () => {
      const h = yamulmaRef.current
      if (!h) return
      yamulmaRef.current = null
      try {
        h.fade(h.volume(), 0, 220)
        setTimeout(() => { try { h.stop(); h.unload() } catch { /* yok */ } }, 260)
      } catch { /* yok */ }
    }

    // animasyon1 bitti (son karede durdu): ses söner, dokun ipucu belirir.
    const video1Bitti = () => {
      if (iptal || durumRef.current !== 'dokun') return
      yamulmaSustur()
      setIpucu(true)
    }

    // Harf düşme sesi — her çağrıda bir kez daha çalar (aynı Howl, üst üste
    // binebilir; ses ~0.2sn, harf aralıkları ~0.7sn → sorun olmaz).
    // Howl sahne kurulurken ÖN YÜKLENİR (aşağıda) → ilk düşüş sesi gecikmez.
    const harfDusCal = () => {
      if (!harfRef.current) return
      try { harfRef.current.play() } catch { /* ses yoksa sessiz geç */ }
    }
    if (HARF_DUSME_SESI && !harfRef.current) {
      try { harfRef.current = new Howl({ src: [HARF_DUSME_SESI], format: ['mpeg'], volume: 0.9, preload: true }) } catch { /* yok */ }
    }

    // animasyon2 oynarken video SAATİNİ izle; her HARF_ZAMANLARI eşiği
    // geçildiğinde harf sesini çal (5 harf = 5 ses). Video saatinden
    // okunduğu için DURDUR ile video donunca sesler de bekler.
    const harfWatcherBaslat = () => {
      let i = 0
      const tik = () => {
        if (iptal || durumRef.current !== 'dus' || i >= HARF_ZAMANLARI.length) return
        const t = video2Ref.current?.currentTime ?? 0
        if (t >= HARF_ZAMANLARI[i]) { harfDusCal(); i += 1 }
        requestAnimationFrame(tik)
      }
      requestAnimationFrame(tik)
    }

    const git = (yeni) => {
      if (yeni === 'isil') {
        // Çifte dokunuş koruması: decode sürerken ikinci tıklama yeni
        // konuşma/ses başlatmasın.
        if (durumRef.current === 'isil' || durumRef.current === 'isil-hazirlik') return
        durumRef.current = 'isil-hazirlik'
        isilBaslat()
        return
      }
      durumRef.current = yeni
      setDurum(yeni)
      if (yeni === 'dokun') {
        // Hareket azalt: video oynatılmaz (ilk kare durur), ipucu hemen gelir
        if (azaltRef.current) { setIpucu(true); return }
        setIpucu(false)
        yamulmaWatcherBaslat()
        videoOynat(video1Ref, video1Bitti)
      } else if (yeni === 'dus') {
        setIpucu(false)
        yamulmaSustur()
        // Hareket azalt: düşüş videosu oynatılmaz, tek ses + doğrudan peek
        if (azaltRef.current) { harfDusCal(); git('peek'); return }
        harfWatcherBaslat()
        // Video bitince peek'e geçiş render'daki onEnded ile yapılır;
        // oynatma hiç başlayamazsa yine de takılmadan devam et.
        videoOynat(video2Ref, () => { if (durumRef.current === 'dus') git('peek') })
      } else if (yeni === 'peek') {
        peekSubOynat(0, () => git('bekle'))
      }
      // 'bekle': boş sağ sayfa + ortada dokun ipucu (render); dokunuş beklenir.
    }
    apiRef.current = { git, video1Bitti }

    // TEKRAR düğmesi (BookReader soldaki): Işıl konuşmaya geçtiyse sesi ve
    // ağız animasyonunu BİRLİKTE baştan oynat (henüz o aşamada değilse no-op).
    const tekrarCoz = sayfa0TekrarKaydet(() => {
      if (!iptal && durumRef.current === 'isil') isilKonusmaBaslat()
    })

    // NOT: Koreografiyi BURADA başlatmıyoruz. Başlatma, öğretici bitince
    // (veya hiç yoksa) aşağıdaki ayrı effect'te apiRef.git(BASLANGIC_FAZ) ile
    // yapılır → öğretici sürerken animasyon1 hiç oynamaz (sayfa boş kalır).

    return () => {
      iptal = true
      durdur()
      tekrarCoz() // TEKRAR kaydını bırak
      apiRef.current = null
      // StrictMode çift-mount'ta (dev) yeni mount'un koreografiyi baştan
      // kurabilmesi için durum makinesini sıfırla (git guard'ları tıkanmasın).
      durumRef.current = 'dokun'
      if (sesRef.current) { try { sesRef.current.stop(); sesRef.current.unload() } catch { /* yok */ } sesRef.current = null }
      if (gulmeRef.current) { try { gulmeRef.current.stop(); gulmeRef.current.unload() } catch { /* yok */ } gulmeRef.current = null }
      if (yamulmaRef.current) { try { yamulmaRef.current.stop(); yamulmaRef.current.unload() } catch { /* yok */ } yamulmaRef.current = null }
      if (harfRef.current) { try { harfRef.current.stop(); harfRef.current.unload() } catch { /* yok */ } harfRef.current = null }
      heldRef.current = [] // tutulan kareleri bırak (bellek)
    }
  }, [canli])

  // --- KOREOGRAFİYİ BAŞLAT — öğretici kapalıyken (bitince veya hiç yoksa) ---
  // Bir kez çalışır: apiRef (yukarıdaki effect'te kurulur, effect'ler commit'ten
  // sonra child→parent sırayla koştuğundan hazırdır) üzerinden git(BASLANGIC_FAZ).
  // ogreticiAktif true→false olunca render'da video mount edilir, effect commit
  // sonrası koştuğu için video1Ref bağlanmış olur → animasyon gecikmesiz başlar.
  const basladiRef = useRef(false)
  useEffect(() => {
    if (!canli || ogreticiAktif || basladiRef.current) return
    basladiRef.current = true
    apiRef.current?.git(BASLANGIC_FAZ)
    // StrictMode çift-mount'ta (dev) bu cleanup guard'ı sıfırlar → remount
    // koreografiyi (yeni apiRef ile) yeniden başlatabilir. Prod'da tek çalışır.
    return () => { basladiRef.current = false }
  }, [canli, ogreticiAktif])

  // --- DURDUR düğmesi → videolar + döngülü yamulma sesi pause/resume ---
  // (rAF kareleri kitapSaati ile zaten donuyor; <video> ve Howl döngüsünün
  // ayrıca durdurulması gerekir.)
  const duraklatildi = useKitapDuraklat()
  const duraklatOnceki = useRef(false)
  useEffect(() => {
    if (!canli || duraklatildi === duraklatOnceki.current) return
    duraklatOnceki.current = duraklatildi
    if (duraklatildi) {
      video1Ref.current?.pause()
      video2Ref.current?.pause()
      try { yamulmaRef.current?.pause() } catch { /* yok */ }
    } else {
      const d = durumRef.current
      if (d === 'dokun') {
        // Bitmiş videoyu play() BAŞA SARAR — yalnızca yarıda kaldıysa sürdür.
        const v1 = video1Ref.current
        if (v1 && !v1.ended) v1.play()?.catch(() => { })
        try { yamulmaRef.current?.play() } catch { /* yok */ }
      } else if (d === 'dus') {
        video2Ref.current?.play()?.catch(() => { })
      }
    }
  }, [duraklatildi, canli])

  // --- TIKLAMA KAYDI: 'dokun' ve 'bekle' aşamalarında SAHNENİN HER YERİ
  // tıklanabilir; dokununca sıradaki aşama başlar. Diğer aşamalarda isabet
  // yok → sayfa çevirme serbest kalır. ---
  const fnRef = useRef({})
  fnRef.current.hitTest = () => durumRef.current === 'dokun' || durumRef.current === 'bekle'
  fnRef.current.oynat = () => {
    const d = durumRef.current
    if (d === 'dokun') apiRef.current?.git('dus')
    else if (d === 'bekle') apiRef.current?.git('isil')
  }
  useEffect(() => {
    if (!kayit || !canli) return
    const id = idRef.current
    kayit.ekle(id, {
      canli: () => true,
      zIndex: 40,
      hitTest: (x, y) => fnRef.current.hitTest(x, y),
      oynat: () => fnRef.current.oynat(),
    })
    return () => kayit.cikar(id)
  }, [kayit, canli])

  // ---- DONUK (canli=false): sayfa-çevirme önizlemesi için statik poster ----
  // Açılış karesi (animasyon1 ilk karesi, jpg): video decode etmeden gösterilir.
  if (!canli) {
    return (
      <div className="absolute inset-0">
        <img
          src={animasyonPoster}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          style={{ objectFit: 'fill' }}
        />
      </div>
    )
  }

  // Öğretici sürerken hiçbir sayfa0 içeriği gösterilmez (sayfa boş kalır);
  // durum zaten 'dokun'da bekler (koreografi başlamadı) → yaziGorunur'u
  // kapatmak videoyu da mount etmez.
  const yaziGorunur = (durum === 'dokun' || durum === 'dus') && !ogreticiAktif

  return (
    <div className="absolute inset-0">
      {/* YAZI VİDEOLARI (tam-tuval, opak krem) — dokun/dus aşamaları.
          İkisi de mount'lu tutulur (animasyon2 önceden yüklensin → dokununca
          gecikmesiz başlar); aşama geçince İKİSİ DE sökülür (GPU belleği).
          Videolar SESSİZ; efekt sesleri Howler'dan (global ses düğmesine uyar). */}
      {yaziGorunur && (
        <>
          <video
            ref={video1Ref}
            src={animasyon1}
            poster={animasyonPoster}
            muted
            playsInline
            preload="auto"
            onEnded={() => apiRef.current?.video1Bitti?.()}
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
            // 'dus'ta da görünür kalır: animasyon2 ilk karesini çizene dek
            // altında son yamulma karesi durur → geçişte krem boşluk çakmaz
            // (animasyon2 opak olduğundan çizer çizmez üstünü örter).
            style={{ objectFit: 'fill', zIndex: 30 }}
          />
          <video
            ref={video2Ref}
            src={animasyon2}
            muted
            playsInline
            preload="auto"
            onEnded={() => { if (durumRef.current === 'dus') apiRef.current?.git('peek') }}
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
            style={{ objectFit: 'fill', zIndex: 31, opacity: durum === 'dus' ? 1 : 0 }}
          />
        </>
      )}

      {/* DOKUN İPUCU — animasyon1 bitince "Sevgi" yazısının üstünde belirir;
          dokununca (durum 'dus') kaybolur. Sahnenin her yeri tıklanabilir,
          halka yalnızca görsel yönlendirme. */}
      {durum === 'dokun' && ipucu && (
        <DokunIpucu style={{ left: `${IPUCU_KONUM.x}%`, top: `${IPUCU_KONUM.y}%`, zIndex: 35 }} />
      )}

      {/* BEKLE İPUCU — peek bitince boş sağ sayfanın ortasında; dokununca
          Işıl gelir ve konuşma başlar. */}
      {durum === 'bekle' && (
        <DokunIpucu style={{ left: `${BEKLE_IPUCU.x}%`, top: `${BEKLE_IPUCU.y}%`, zIndex: 35 }} />
      )}

      {/* PEEK KAROLARI — SAĞ SAYFA (16:9'un sağ yarısı). Karo 8:9 olduğundan
          fill ile tam oturur; krem dolgu sağ sayfayı kaplar, Işıl kenardan girer. */}
      {durum === 'peek' && (
        <img
          ref={karoRef}
          src={PEEK_SUBLER[0].kareler[0]}
          alt=""
          draggable={false}
          className="pointer-events-none absolute top-0 h-full select-none"
          style={{ left: '50%', width: '50%', objectFit: 'fill', zIndex: 30 }}
        />
      )}

      {/* IŞIL BÜSTÜ — sağ sayfada, şeffaf; konuşma döngüsü */}
      {durum === 'isil' && (
        <div className="pointer-events-none absolute top-0 h-full" style={{ left: '50%', width: '50%', zIndex: 30 }}>
          <img
            ref={isilRef}
            src={ISIL[0]}
            alt=""
            draggable={false}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 select-none"
            style={{ height: '94%' }}
          />
        </div>
      )}

      {/* SAYFA ÇEVİR İPUCU — Işıl konuşmasını bitirince SAĞ SAYFANIN sağ
          kısmında belirir: sağı tutup sola sürükleyerek sayfa çevirmeyi
          gösterir (BookReader'ın ileri sürükleme bölgesi burada). Sürekli
          döngüde; kullanıcı sayfayı çevirene dek. pointer-events yok →
          altındaki sürükleme bölgesini engellemez. (Hareket azalt modunda
          çevirme tek dokunuşla olduğundan bu Lottie ipucu gösterilmez.) */}
      {durum === 'isil' && sayfaCevirIpucu && !azalt && (
        // İpucu sağ sayfanın sağ kenarına (left %90 = ipucunun MERKEZİ) oturur —
        // BookReader'ın ileri sürükleme bölgesi burası. Işıl'ın üstüne binmesi
        // sorun değil: Lottie'nin hayalet el katmanı ve elin TERS yönde kayan
        // bozuk alpha matte'i (el süpürürken maske dışında kalan kısmı kırpılıp
        // "arkaplana gömülü" gösteriyordu) SayfaKaydirmaIpucu içinde ayıklanır.
        <SayfaKaydirmaIpucu style={{ left: '90%', top: '52%', width: '32%', zIndex: 45 }} />
      )}

      {/* CİLT (orta) ÇİZGİSİ — sahnenin tam-tuval katmanları (video/karo,
          z30+) BookReader'ın KavisGolge'sini (z10) örttüğünden iki-sayfa
          hissi kayboluyordu; orta çizgi burada içeriğin ÜSTÜNE yeniden
          çizilir (KavisGolge'nin merkez parçasının kopyası). */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 34 }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, transparent 45%, rgba(0,0,0,0.08) 49.5%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.08) 50.5%, transparent 55%)',
          }}
        />
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-black/15" />
        <div className="absolute inset-y-0 left-1/2 w-[6px] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  )
}

export default SevgiSahne0
