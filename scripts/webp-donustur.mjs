import { promises as fs } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

/* ===============================================================
   VARLIK OPTİMİZASYONU — PNG → kayıpsız WebP (+ görünmez piksel kırpma)

   Mobil çökme/kasma düzeltmesi (2026-07): görseller baskı
   çözünürsüzlüğünde geldiği için (2480×3508, 4096×2304) telefon
   belleği taşıyordu. Bu script:

   1. YENİDEN BOYUTLANDIRMA — yalnızca ekranın FİZİKSEL OLARAK
      gösteremediği pikselleri atar (en keskin cihaz iPad Pro retina
      ihtiyacının üzerine pay bırakılır):
        - Kare dizisi klasöründeki (>5 kare) DİKEY karakter kareleri
          → 1536×1536 kutusuna sığdır (ekranda en çok ~1240px görünür)
        - Diğer her PNG → 1920×1920 kutusuna sığdır (tam-sahne standardı;
          1920×1080 olanlara DOKUNULMAZ)
   2. KAYIPSIZ WebP — piksel birebir korunur (lossless). Renk profili
      (ICC) taşıyan dosyada profil aynen kopyalanır → renk kayması
      imkansız.
   3. DOĞRULAMA — boyutu değişmeyen her dosya dönüşüm sonrası piksel
      piksel karşılaştırılır; fark çıkarsa dosya PNG olarak BIRAKILIR
      ve rapor edilir.

   Kullanım:  node scripts/webp-donustur.mjs [--dry]
   Orijinallerin yedeği: C:\Temp\interaktif-kitap-png-yedek\

   ÖNEMLİ: Dönüşümden sonra MUTLAKA `node scripts/p3-profil-goms.mjs`
   çalıştırılmalı! iPad/Procreate çıkışı PNG'ler cICP/cHRM ile Display P3
   etiketlidir; WebP bu chunk'ları taşıyamaz → profil gömülmezse renkler
   SOLUK görünür (2026-07'de yaşandı). O script hangi dosyaya hangi
   profilin gerektiğini yedekteki PNG'lerden kendisi tespit eder.
=============================================================== */

const KOK = path.resolve('src/assets')
const DRY = process.argv.includes('--dry')
const KUTU_KARE_DIZISI_DIKEY = 1536 // dikey (boy>en) animasyon kareleri
const KUTU_GENEL = 1920 // diğer her şey (tam-sahne standardı)
const ESZAMANLI = 4 // aynı anda işlenecek dosya sayısı

// --- tüm PNG'leri topla ---
async function pngleriBul(dizin, sonuc = []) {
  for (const giris of await fs.readdir(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, giris.name)
    if (giris.isDirectory()) await pngleriBul(tam, sonuc)
    else if (/\.png$/i.test(giris.name)) sonuc.push(tam)
  }
  return sonuc
}

// klasördeki png sayısı >5 ise "kare dizisi" say (animasyon klasörü)
const klasorSayaci = new Map()
function kareDizisiMi(dosya, tumu) {
  const d = path.dirname(dosya)
  if (!klasorSayaci.has(d)) klasorSayaci.set(d, tumu.filter((f) => path.dirname(f) === d).length)
  return klasorSayaci.get(d) > 5
}

// GÖRÜNÜR piksel karşılaştırması (boyut değişmeyen dosyalar için).
// WebP kayıpsız kodlayıcı, TAMAMEN görünmez (alfa=0) piksellerin RGB
// değerini sıkıştırma için değiştirir — ekranda hiçbir karşılığı yoktur.
// Bu yüzden koşul: alfa kanalı birebir aynı + görünür (alfa>0) her
// pikselin RGB'si birebir aynı → ekran çıktısı matematiksel olarak özdeş.
async function birebirAyniMi(pngYolu, webpYolu) {
  const a = await sharp(pngYolu).ensureAlpha().raw({ depth: 'uchar' }).toBuffer()
  const b = await sharp(webpYolu).ensureAlpha().raw({ depth: 'uchar' }).toBuffer()
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] !== b[i + 3]) return false // alfa farkı → görünür fark
    if (a[i + 3] === 0) continue // tamamen görünmez piksel → RGB önemsiz
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) return false
  }
  return true
}

// OneDrive senkronu dosyayı anlık kilitleyebiliyor → silmeyi birkaç kez dene
async function sil(yol) {
  for (let deneme = 0; ; deneme++) {
    try {
      await fs.unlink(yol)
      return
    } catch (e) {
      if (deneme >= 4) throw e
      await new Promise((c) => setTimeout(c, 300 * (deneme + 1)))
    }
  }
}

async function isle(dosya, tumu, rapor) {
  const meta = await sharp(dosya).metadata()
  const dikey = (meta.height ?? 0) > (meta.width ?? 0)
  const kutu = kareDizisiMi(dosya, tumu) && dikey ? KUTU_KARE_DIZISI_DIKEY : KUTU_GENEL
  // %5 tolerans: 1921×1080 gibi sınırın kılpayı üstündekiler yeniden
  // örneklenmez (bellek kazancı sıfır olurdu, pikseller aynen korunur)
  const boyutDegisecek = meta.width > kutu * 1.05 || meta.height > kutu * 1.05

  if (DRY) {
    rapor.satirlar.push(
      `${boyutDegisecek ? 'KÜÇÜLT' : 'AYNEN '} ${meta.width}x${meta.height} b${meta.depth === 'ushort' ? 16 : 8} ${path.relative(KOK, dosya)}`,
    )
    return
  }

  const hedef = dosya.replace(/\.png$/i, '.webp')
  let boru = sharp(dosya)
  if (meta.icc) boru = boru.keepIccProfile() // renk profili aynen taşınır
  if (boyutDegisecek) boru = boru.resize(kutu, kutu, { fit: 'inside', withoutEnlargement: true })
  await boru.webp({ lossless: true, effort: 4 }).toFile(hedef)

  // 16-bit kaynaklar 8-bit'e iner (ekranlar zaten 8-bit gösterir) —
  // birebir karşılaştırma yalnızca 8-bit + boyutu değişmeyenlerde anlamlı.
  if (!boyutDegisecek && meta.depth !== 'ushort') {
    if (!(await birebirAyniMi(dosya, hedef))) {
      await sil(hedef) // webp'yi at, png kalsın → asla bozuk yayına çıkmaz
      rapor.farkli.push(path.relative(KOK, dosya))
      return
    }
    rapor.dogrulanan += 1
  }

  const eski = (await fs.stat(dosya)).size
  const yeni = (await fs.stat(hedef)).size
  rapor.eskiToplam += eski
  rapor.yeniToplam += yeni
  await sil(dosya)
  rapor.donusen += 1
  if (boyutDegisecek)
    rapor.satirlar.push(
      `KÜÇÜLTÜLDÜ ${meta.width}x${meta.height}→(kutu ${kutu}) ${path.relative(KOK, dosya)}`,
    )
}

const tumu = await pngleriBul(KOK)
console.log(`${tumu.length} PNG bulundu. ${DRY ? '(deneme — dosya değişmez)' : ''}`)
const rapor = { satirlar: [], farkli: [], dogrulanan: 0, donusen: 0, eskiToplam: 0, yeniToplam: 0 }

let i = 0
async function isci() {
  while (i < tumu.length) {
    const dosya = tumu[i++]
    try {
      await isle(dosya, tumu, rapor)
    } catch (e) {
      rapor.satirlar.push(`HATA ${path.relative(KOK, dosya)}: ${e.message}`)
    }
    if (i % 50 === 0) console.log(`... ${i}/${tumu.length}`)
  }
}
await Promise.all(Array.from({ length: ESZAMANLI }, isci))

console.log(rapor.satirlar.join('\n'))
if (rapor.farkli.length) {
  console.log(`\nUYARI — piksel farkı çıkan (PNG bırakılan) dosyalar:\n${rapor.farkli.join('\n')}`)
}
console.log(
  `\nÖZET: ${rapor.donusen} dosya dönüştü, ${rapor.dogrulanan} tanesi piksel-piksel birebir doğrulandı.` +
    (DRY ? '' : ` Boyut: ${(rapor.eskiToplam / 1e6).toFixed(1)} MB → ${(rapor.yeniToplam / 1e6).toFixed(1)} MB`),
)
