// =====================================================================
// hazirla-sayfa6-8.mjs — sayfa 6 ve 8 varlıklarını web için hazırlar
//
// Proje geleneği (bkz. kucult-gorseller.ps1 / kirp-frameler.ps1):
//   - Orijinaller silinmez; önce "asset-yedek/" klasörüne kopyalanır
//     (bu klasör .gitignore'da, GitHub'a gitmez).
//   - Sayfa-6 kareleri 4096x2304 -> 1920x1080 indirgenir (sayfa-5
//     güneş/ay kareleriyle aynı karar: arka planlar zaten 1080p,
//     kitap tuvalinden büyük çözünürlük GPU belleğini boşa şişirir).
//   - Sayfa-8 çiçek kareleri (48 adet ~1.9MB tam-tuval PNG) TÜM
//     karelerin ORTAK (union) alfa kutusundan kırpılır -> hizalama
//     bozulmaz, dosya/decode maliyeti ~%75 düşer. Piksel kaybı yok
//     (kırpılan yerler tamamen şeffaf boşluk).
//
// Kullanım (proje kökünde):  node scripts/hazirla-sayfa6-8.mjs
// İkinci kez çalıştırılırsa işlenmiş dosyaları olduğu gibi bırakır
// (boyut kontrolüyle anlar), yalnızca ölçüm raporunu basar.
// =====================================================================
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

const KOK = process.cwd()
const YEDEK = path.join(KOK, 'asset-yedek')

// --- alfa>8 piksellerin sınır kutusu (kirp-frameler.ps1 ile aynı eşik) ---
async function bbox(dosya) {
  const { data, info } = await sharp(dosya)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: c } = info
  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++) {
    const satir = y * w * c
    for (let x = 0; x < w; x++) {
      if (data[satir + x * c + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, minY, maxX, maxY, w, h }
}

function yuzde(b) {
  const pc = (v, t) => ((v / t) * 100).toFixed(2)
  return (
    `x ${pc(b.minX, b.w)}..${pc(b.maxX + 1, b.w)}%  ` +
    `y ${pc(b.minY, b.h)}..${pc(b.maxY + 1, b.h)}%  ` +
    `merkez (${pc((b.minX + b.maxX + 1) / 2, b.w)}%, ${pc((b.minY + b.maxY + 1) / 2, b.h)}%)`
  )
}

async function pngler(klasor) {
  return (await fs.readdir(klasor))
    .filter((a) => a.toLowerCase().endsWith('.png'))
    .sort()
    .map((a) => path.join(klasor, a))
}

async function yedekle(dosya) {
  const goreli = path.relative(KOK, dosya)
  const hedef = path.join(YEDEK, goreli)
  await fs.mkdir(path.dirname(hedef), { recursive: true })
  try {
    await fs.access(hedef) // zaten yedeklenmişse üzerine yazma
  } catch {
    await fs.copyFile(dosya, hedef)
  }
}

// ---------- 1) SAYFA-6: 4096x2304 -> 1920x1080 ----------
async function sayfa6Kucult(klasor) {
  console.log(`\n== ${path.relative(KOK, klasor)} -> 1920x1080 ==`)
  for (const dosya of await pngler(klasor)) {
    const meta = await sharp(dosya).metadata()
    if (meta.width <= 1920) {
      console.log(`  atlandi (zaten kucuk): ${path.basename(dosya)} ${meta.width}px`)
      continue
    }
    await yedekle(dosya)
    const buf = await sharp(dosya)
      .resize(1920, 1080, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer()
    await fs.writeFile(dosya, buf)
    console.log(`  kuculdu: ${path.basename(dosya)} -> 1920x1080, ${(buf.length / 1024) | 0} KB`)
  }
}

// ---------- 2) ORTAK KUTU KIRPMA (+ opsiyonel küçültme) ----------
// TÜM karelerin ortak (union) alfa kutusunu bulup hepsini AYNI kutudan
// kırpar → hizalama bozulmaz (kirp-frameler.ps1 mantığı). hedefYukseklik
// verilirse kırpılan kutu o yüksekliğe indirilir (yalnızca küçültür;
// "ekran boyutunun ~2 katı" kuralı — 4K kitapta bile doğal çözünürlük üstü).
// orjGenislik: işlenmemiş karenin genişliği (ikinci çalıştırmada atlama koşulu).
async function cicekKirp(klasor, kenarPayi = 12, orjGenislik = 1920, hedefYukseklik = null) {
  console.log(`\n== ${path.relative(KOK, klasor)} ortak kutu kirpma ==`)
  const dosyalar = await pngler(klasor)
  const ilkMeta = await sharp(dosyalar[0]).metadata()
  if (ilkMeta.width < orjGenislik) {
    console.log(`  atlandi: kareler zaten kirpilmis (${ilkMeta.width}px)`)
    return
  }
  let u = null
  for (const dosya of dosyalar) {
    const b = await bbox(dosya)
    u = u
      ? {
          minX: Math.min(u.minX, b.minX),
          minY: Math.min(u.minY, b.minY),
          maxX: Math.max(u.maxX, b.maxX),
          maxY: Math.max(u.maxY, b.maxY),
          w: b.w,
          h: b.h,
        }
      : b
  }
  const minX = Math.max(0, u.minX - kenarPayi)
  const minY = Math.max(0, u.minY - kenarPayi)
  const maxX = Math.min(u.w - 1, u.maxX + kenarPayi)
  const maxY = Math.min(u.h - 1, u.maxY + kenarPayi)
  const kutu = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  console.log(`  ortak kutu (tuval ${u.w}x${u.h}): x=${minX} y=${minY} ${kutu.width}x${kutu.height}`)
  console.log(
    `  KONUM SABITLERI: left ${((minX / u.w) * 100).toFixed(2)}%  top ${((minY / u.h) * 100).toFixed(2)}%  width ${((kutu.width / u.w) * 100).toFixed(2)}%`,
  )
  for (const dosya of dosyalar) {
    await yedekle(dosya)
    let islem = sharp(dosya).extract(kutu)
    if (hedefYukseklik && kutu.height > hedefYukseklik) {
      islem = islem.resize(null, hedefYukseklik, { kernel: 'lanczos3' })
    }
    const buf = await islem.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
    await fs.writeFile(dosya, buf)
    console.log(`  kirpildi: ${path.basename(dosya)}, ${(buf.length / 1024) | 0} KB`)
  }
}

// ---------- 2b) KAYIPSIZ YENİDEN SIKIŞTIRMA (piksel birebir aynı) ----------
// Kelebek kareleri gevşek sıkıştırılmış geliyor; PNG'yi compressionLevel 9 +
// adaptif filtreyle YENİDEN kodlamak pikselleri değiştirmeden ~%60 küçültür.
async function yenidenSikistir(klasor) {
  console.log(`\n== ${path.relative(KOK, klasor)} kayıpsız yeniden sıkıştırma ==`)
  let eskiT = 0
  let yeniT = 0
  for (const dosya of await pngler(klasor)) {
    const eski = (await fs.stat(dosya)).size
    const buf = await sharp(dosya)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer()
    eskiT += eski
    if (buf.length < eski * 0.95) {
      await yedekle(dosya)
      await fs.writeFile(dosya, buf)
      yeniT += buf.length
    } else {
      yeniT += eski // kazanç yok → dokunma
    }
  }
  console.log(`  toplam: ${(eskiT / 1048576).toFixed(1)} MB -> ${(yeniT / 1048576).toFixed(1)} MB`)
}

// ---------- 2c) TEK DOSYA KIRPMA (yıldız gibi tek öğeli tam-tuval png) ----------
async function kirpTek(dosya, kenarPayi = 12, orjGenislik = 1920) {
  console.log(`\n== ${path.relative(KOK, dosya)} tek dosya kirpma ==`)
  const meta = await sharp(dosya).metadata()
  if (meta.width < orjGenislik) {
    console.log(`  atlandi: zaten kirpik (${meta.width}px)`)
    return
  }
  const b = await bbox(dosya)
  const minX = Math.max(0, b.minX - kenarPayi)
  const minY = Math.max(0, b.minY - kenarPayi)
  const kutu = {
    left: minX,
    top: minY,
    width: Math.min(b.w - 1, b.maxX + kenarPayi) - minX + 1,
    height: Math.min(b.h - 1, b.maxY + kenarPayi) - minY + 1,
  }
  console.log(
    `  kutu: x=${kutu.left} y=${kutu.top} ${kutu.width}x${kutu.height}  ` +
      `(tuvalde left ${((kutu.left / b.w) * 100).toFixed(2)}%  top ${((kutu.top / b.h) * 100).toFixed(2)}%  width ${((kutu.width / b.w) * 100).toFixed(2)}%)`,
  )
  await yedekle(dosya)
  const buf = await sharp(dosya)
    .extract(kutu)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
  await fs.writeFile(dosya, buf)
  console.log(`  kirpildi: ${(buf.length / 1024) | 0} KB`)
}

// ---------- 3) ÖLÇÜM RAPORU (konum sabitleri için) ----------
async function rapor(ad, dosya) {
  const b = await bbox(dosya)
  console.log(`  ${ad}: ${yuzde(b)}   [px: ${b.minX},${b.minY} .. ${b.maxX},${b.maxY} @ ${b.w}x${b.h}]`)
}

const A = 'src/assets'
await sayfa6Kucult(path.join(KOK, A, 'characters/syf6/isil'))
await sayfa6Kucult(path.join(KOK, A, 'characters/syf6/ucurtma'))
await cicekKirp(path.join(KOK, A, 'characters/syf8/cicek'))
await yenidenSikistir(path.join(KOK, A, 'characters/syf8/kelebek1'))
await yenidenSikistir(path.join(KOK, A, 'characters/syf8/kelebek2'))
// Sayfa-9/10: çiçek doğal ölçekte kırpılır; Işıl portreleri (2480x3508)
// kırpılıp "ekranın ~2 katı" yüksekliğe indirilir (syf9 ~%78, syf10 ~%91
// sahne yüksekliğinde görünür → 1080p sahnede ~845/985 px → 2 katı).
await cicekKirp(path.join(KOK, A, 'characters/syf9/cicek'))
await cicekKirp(path.join(KOK, A, 'characters/syf9/isil'), 12, 2480, 1700)
await cicekKirp(path.join(KOK, A, 'characters/syf10/isil'), 12, 2480, 2000)
// Sayfa-11: su kabı + su kareleri 4096→1920 (sayfa-5/6 kararıyla aynı);
// yıldız tek öğe olarak kırpılır (3 kez ayrı konumda kullanılacak).
await sayfa6Kucult(path.join(KOK, A, 'characters/syf11/su_kabi'))
await sayfa6Kucult(path.join(KOK, A, 'characters/syf11/su'))
await kirpTek(path.join(KOK, A, 'backgrounds/sayfa11/yıldız.png'))

console.log('\n== ÖLÇÜMLER (alfa kutuları, tuval %si) ==')
await rapor('syf6 isil f01   ', path.join(KOK, A, 'characters/syf6/isil/isil_frame_01.png'))
await rapor('syf6 ucurtma f01', path.join(KOK, A, 'characters/syf6/ucurtma/ucurtma_frame_01.png'))
await rapor('syf8 isil1      ', path.join(KOK, A, 'backgrounds/sayfa8/isil1.png'))
await rapor('syf8 isil2      ', path.join(KOK, A, 'backgrounds/sayfa8/isil2.png'))
await rapor('kelebek1 f001   ', path.join(KOK, A, 'characters/syf8/kelebek1/kelebek_frame_01.png'))
await rapor('kelebek1 f104   ', path.join(KOK, A, 'characters/syf8/kelebek1/kelebek_frame_104.png'))
await rapor('kelebek2 f01    ', path.join(KOK, A, 'characters/syf8/kelebek2/kelebek_frame_01.png'))
await rapor('kelebek2 f42    ', path.join(KOK, A, 'characters/syf8/kelebek2/kelebek_frame_42.png'))
await rapor('cicek f03 (kirpik)', path.join(KOK, A, 'characters/syf8/cicek/cicek_frame_03.png'))

console.log('\nBitti! Orijinaller asset-yedek/ klasöründe duruyor.')
