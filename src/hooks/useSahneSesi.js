import { useEffect, useRef } from 'react'
import { Howl } from 'howler'

/* ===============================================================
   useSahneSesi — SAYFA ANLATIM SESİ (seslendirme)

   Her sahne açıldığında o sayfanın anlatımı otomatik çalar. Sesler
   src/assets/sounds/sayfaN/ klasörlerindedir (N = kitaptaki okunuş
   sırası). Dizinin başındaki AÇILIŞ sahnesi (sayfa0) sayesinde sahne
   index'i ses klasörüyle BİREBİR örtüşür: index i → sayfa(i) klasörü
   (index 0 = sayfa0 açılışı — o SevgiSahne0 tarafından çalınır, burada
   atlanır).

   NEDEN doğrudan (i+1) eşlemesi?
   Ses klasörleri, seslendirmeyi yapan kişinin GÖRDÜĞÜ okunuş sırasına
   göre numaralanmıştır (kitabı baştan okuyup her sayfayı numaralamış).
   Bu yüzden arka plan DOSYALARINDAKİ tarihsel "sayfa4/sayfa5" takası
   (bkz. sevgiSahneleri.js) sesleri ETKİLEMEZ — ses sayfa4 = kitabın 4.
   sayfası (gökyüzü), ses sayfa5 = 5. sayfa (uçurtma). Ayrıca 7. sayfa
   (gökyüzünün kopyası) kendi ayrı "sayfa7" kaydına sahiptir.

   İSİMLENDİRME: her sayfa klasörünün içinde sesler sıra numarasıyla
   adlandırılır → sayfaN/1.mp3 (ana anlatım), sayfaN/2.mp3 (varsa 2. ses).
   İKİ SESLİ SAYFALAR (sayfa3, sayfa9): 2.mp3, 1.mp3'ten SONRA ardışık
   çalar (kesintisiz tek anlatım gibi).

   Ses global ayara bağlıdır: SoundToggle Howler.mute() çağırdığından
   kapalıyken bu ses de duyulmaz. DURDUR düğmesi (duraklatildi) anlatımı
   duraklatır/devam ettirir.

   onBitti: sayfanın anlatımı GERÇEKTEN çalıp tamamlanınca çağrılır
   (yarıda kesilme/sayfa değişiminde ÇAĞRILMAZ; sessiz sayfalarda hiç
   çağrılmaz). BookReader son sayfada bununla kutlama ekranını tetikler.
   Global mute anlatımı durdurmaz (sessiz akar), bu yüzden sinyal ses
   kapalıyken de doğru zamanda gelir.

   ELLE BAŞLAYAN SAYFALAR (ELLE_BASLAYANLAR): bu indekslerde anlatım
   sayfa açılınca OTOMATİK BAŞLAMAZ; sahnedeki öğeye (Işıl/çiçek) ilk
   dokunuşta sahne bileşeni sahneAnlatiminiBaslat() çağırır, anlatım o an
   başlar. Sayfadan dokunmadan çıkılırsa hiç çalmaz. TEKRAR düğmesi bu
   sayfalarda da anlatımı hemen (dokunuş beklemeden) baştan çalar.
=============================================================== */

// Anlatımı sayfa açılışında değil, sahnedeki İLK DOKUNUŞTA başlayan sayfalar
// (sahne index'i = ses klasörü numarası): 10 → Işıl portresi (11. sayfa),
// 12 → konuşan çiçek (13. sayfa).
const ELLE_BASLAYANLAR = new Set([10, 12])

// Sahne bileşenlerinin çağırdığı global tetik (kitapDuraklat ile aynı desen:
// sahne, BookReader'daki hook'u tanımaz — modül üzerinden haberleşir).
let elleBaslatFn = null
export function sahneAnlatiminiBaslat() {
  elleBaslatFn?.()
}

// ANLATIM DURUM YAYINI: sahneler, kendi sayfalarının anlatımının başladığını/
// bittiğini buradan dinler (ör. sayfa-11'de Işıl'ın ağız döngüsü konuşma
// bitince yumuşakça durur; TEKRAR ile yeniden başlar). Sahne bileşeni yalnız
// kendi sayfası açıkken mount olduğundan olayın hangi sayfaya ait olduğu
// bellidir — index taşınmaz.
const anlatimDinleyicileri = new Set()
export function sahneAnlatimDinle(fn) {
  anlatimDinleyicileri.add(fn)
  return () => anlatimDinleyicileri.delete(fn)
}
const anlatimYayinla = (olay) => anlatimDinleyicileri.forEach((f) => f(olay))

// SAYFA-0 TEKRARI: açılış sayfasının anlatımı ve konuşma animasyonu
// SevgiSahne0'ın kendi içindedir (bu hook index 0'ı atlar). TEKRAR düğmesi
// basılınca (baslat(0, hemen=true)) burada kayıtlı işleyici tetiklenir →
// sahne, Işıl'ın sesini VE ağız animasyonunu birlikte baştan oynatır.
let sayfa0TekrarFn = null
export function sayfa0TekrarKaydet(fn) {
  sayfa0TekrarFn = fn
  return () => {
    if (sayfa0TekrarFn === fn) sayfa0TekrarFn = null
  }
}

// Tüm anlatım seslerini topla (sayfa1..sayfa11 klasörleri).
const sesModulleri = import.meta.glob(
  '../assets/sounds/sayfa*/*.{mp3,ogg,wav}',
  { eager: true, import: 'default' },
)

// Klasör numarasına göre grupla → { [sayfaNo]: [url1, url2...] }
// Klasör = sayfa numarası; DOSYA ADINDAKİ sayı (1.mp3, 2.mp3) = çalma sırası.
const SAYFA_SESLERI = (() => {
  const harita = new Map()
  for (const [yol, url] of Object.entries(sesModulleri)) {
    const mSayfa = yol.match(/sayfa(\d+)\//)
    if (!mSayfa) continue
    const no = Number(mSayfa[1])
    // Dosya adının başındaki sayı = sıra (yoksa 1)
    const mSira = yol.match(/\/(\d+)\.[^/]+$/)
    const sira = mSira ? Number(mSira[1]) : 1
    if (!harita.has(no)) harita.set(no, [])
    harita.get(no).push({ sira, url })
  }
  const sonuc = {}
  for (const [no, liste] of harita) {
    liste.sort((a, b) => a.sira - b.sira)
    sonuc[no] = liste.map((x) => x.url)
  }
  return sonuc
})()

export function useSahneSesi(sahneIndex, duraklatildi, onBitti) {
  const howlRef = useRef(null) // o an çalan Howl
  const siraRef = useRef([]) // henüz çalınmamış url'ler (ardışık)
  const bittiRef = useRef(true) // anlatım tamamlandı mı?
  // Duraklat durumunu ref'te tut ki çalma başlatan kod güncel değeri görsün.
  const duraklatRef = useRef(duraklatildi)
  duraklatRef.current = duraklatildi
  // Bitiş callback'i her render'da tazelenir (kapanış eskimesin).
  const onBittiRef = useRef(onBitti)
  onBittiRef.current = onBitti

  // Elle başlayan sayfalarda dokunuşu bekleyen url listesi (yoksa null)
  const bekleyenRef = useRef(null)

  // --- yardımcılar (ref'lere kapanır, yeniden oluşturmaya gerek yok) ---
  const fnRef = useRef(null)
  if (!fnRef.current) {
    const temizle = () => {
      const h = howlRef.current
      if (h) {
        h.off()
        h.stop()
        h.unload()
      }
      howlRef.current = null
      siraRef.current = []
      bekleyenRef.current = null
      bittiRef.current = true
    }

    const calSonraki = () => {
      const url = siraRef.current.shift()
      if (!url) {
        // Buraya yalnızca SON sesin onend'inden gelinir (baslat boş listeyle
        // calSonraki çağırmaz) → anlatım gerçekten tamamlandı.
        bittiRef.current = true
        howlRef.current = null
        onBittiRef.current?.()
        anlatimYayinla('bitti')
        return
      }
      const ilkParca = bittiRef.current // yeni anlatımın ilk sesi mi?
      bittiRef.current = false
      const h = new Howl({
        src: [url],
        volume: 0.9,
        onend: () => {
          h.off()
          h.unload()
          if (howlRef.current === h) howlRef.current = null
          calSonraki() // varsa 2. sesi çal
        },
      })
      howlRef.current = h
      h.play()
      // Sahne duraklatılmışken açıldıysa hemen duraklat.
      if (duraklatRef.current) h.pause()
      if (ilkParca) anlatimYayinla('basladi')
    }

    // O sayfanın anlatımını BAŞTAN çal (varsa 1. + 2. ses ardışık).
    // EŞLEME: sahne index'i doğrudan ses klasörüyle örtüşür (index 0 =
    // sayfa0 açılışı, index 1 = kitabın 1. sayfası...). Bu, dizinin başına
    // eklenen AÇILIŞ sahnesi (sayfa0) sayesinde tam hizalıdır.
    // index 0 (AÇILIŞ) ATLANIR: sayfa0'ın sesini SevgiSahne0 bileşeni,
    // koreografinin sonunda (Işıl gelince) kendisi çalar.
    // hemen=true (TEKRAR düğmesi): elle başlayan sayfada da dokunuş
    // beklemeden çalar.
    const baslat = (idx, hemen = false) => {
      temizle()
      if (idx === 0) {
        // Açılış sayfası: TEKRAR basıldıysa sahne0'ın kayıtlı işleyicisi
        // konuşmayı baştan oynatır; otomatik başlatma yok (sahne kendi çalar).
        if (hemen) sayfa0TekrarFn?.()
        return
      }
      const urller = SAYFA_SESLERI[idx]
      if (!urller || !urller.length) return
      if (!hemen && ELLE_BASLAYANLAR.has(idx)) {
        bekleyenRef.current = [...urller] // sahnedeki ilk dokunuşu bekle
        return
      }
      siraRef.current = [...urller]
      calSonraki()
    }

    // Sahneden gelen dokunuş tetiği: bekleyen anlatımı başlat (bir kez).
    const elleBaslat = () => {
      const bekleyen = bekleyenRef.current
      if (!bekleyen) return // zaten başladı / bu sayfa beklemiyor
      bekleyenRef.current = null
      siraRef.current = bekleyen
      calSonraki()
    }

    fnRef.current = { temizle, calSonraki, baslat, elleBaslat }
  }

  // Global tetiği bu hook örneğine bağla (BookReader'da tek örnek var).
  useEffect(() => {
    elleBaslatFn = () => fnRef.current.elleBaslat()
    return () => {
      elleBaslatFn = null
    }
  }, [])

  // Güncel sahne indeksini ref'te tut (tekrar butonu doğru sayfayı çalsın).
  const sahneIndexRef = useRef(sahneIndex)
  sahneIndexRef.current = sahneIndex

  // --- SAHNE DEĞİŞİNCE: önceki anlatımı durdur, yenisini baştan çal ---
  useEffect(() => {
    fnRef.current.baslat(sahneIndex)
    return fnRef.current.temizle
  }, [sahneIndex])

  // --- DURDUR / DEVAM ---
  useEffect(() => {
    const h = howlRef.current
    if (!h) return
    if (duraklatildi) {
      if (h.playing()) h.pause()
    } else if (!bittiRef.current && !h.playing()) {
      h.play()
    }
  }, [duraklatildi])

  // TEKRAR: o an bulunulan sayfanın sesli anlatımını baştan çalar
  // (elle başlayan sayfalarda da hemen — dokunuş beklemez).
  const tekrarCal = () => fnRef.current.baslat(sahneIndexRef.current, true)
  return { tekrarCal }
}

export default useSahneSesi
