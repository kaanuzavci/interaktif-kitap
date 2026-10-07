import { promises as fs } from 'node:fs'
import fsSync from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

/* ===============================================================
   P3 RENK PROFİLİ GÖMME — soluk renk düzeltmesi (2026-07)

   Orijinal PNG'lerin bir kısmı (iPad/Procreate çıkışı) cHRM+gAMA
   chunk'larıyla DISPLAY P3 (geniş gam) olarak etiketliydi; tarayıcı
   bu sayede renkleri canlı gösteriyordu. WebP'de cHRM karşılığı
   olmadığından dönüşümde etiket düştü → tarayıcı pikselleri sRGB
   sanıp SOLUK gösterdi.

   Bu script PİKSELLERE DOKUNMADAN düzeltir:
   1. Display P3 (gamma 2.2 — PNG'deki gAMA 0.45455'in birebir
      karşılığı) bir ICC profili üretir,
   2. Yedekteki PNG'si P3-cHRM etiketli olan her dosyanın WebP'sine
      bu profili ICCP chunk'ı olarak gömer (VP8X genişletilmiş
      biçim), piksel verisi bayt bayt aynı kalır,
   3. Her dosyada gömme öncesi/sonrası pikselleri karşılaştırıp
      değişmediğini DOĞRULAR.

   Kullanım: node scripts/p3-icc-gom.mjs
   Yedek dizini: C:\Temp\interaktif-kitap-png-yedek\assets
=============================================================== */

const YEDEK = 'C:/Temp/interaktif-kitap-png-yedek/assets'
const HEDEF = path.resolve('src/assets')

/* ---------- 1. DISPLAY P3 (gamma 2.2) ICC PROFİLİ ÜRETİMİ ----------
   Matris/TRC tipi v2 profil: P3 primary'leri Bradford ile D50'ye
   uyarlanır (ICC standardı PCS'i D50'dir). Chrome/Safari/Firefox'un
   renk motorları (skcms/ColorSync/qcms) bu tip profili birebir okur. */
function p3Icc(gamma, primaryAdi = 'p3') {
  // 3x3 yardımcıları
  const mul = (A, B) => A.map((r, i) => B[0].map((_, j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]))
  const vec = (A, v) => A.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2])
  const inv = (m) => {
    const [a, b, c, d, e, f, g, h, i] = m.flat()
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
    return [
      [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
      [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
      [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
    ]
  }
  const xy2XYZ = (x, y) => [x / y, 1, (1 - x - y) / y]

  // Primary'ler + D65 beyaz noktası (cICP/cHRM ile birebir)
  const PRIMARYLER = {
    p3: { R: [0.68, 0.32], G: [0.265, 0.69], B: [0.15, 0.06] },
    srgb: { R: [0.64, 0.33], G: [0.3, 0.6], B: [0.15, 0.06] },
  }
  const { R, G, B } = PRIMARYLER[primaryAdi]
  const D65 = xy2XYZ(0.3127, 0.329)
  const D50 = [0.96422, 1.0, 0.82521]

  // RGB→XYZ(D65): primary sütunlarını beyaza göre ölçekle
  const P = [
    [xy2XYZ(...R)[0], xy2XYZ(...G)[0], xy2XYZ(...B)[0]],
    [xy2XYZ(...R)[1], xy2XYZ(...G)[1], xy2XYZ(...B)[1]],
    [xy2XYZ(...R)[2], xy2XYZ(...G)[2], xy2XYZ(...B)[2]],
  ]
  const S = vec(inv(P), D65)
  const M65 = P.map((r) => r.map((v, j) => v * S[j]))

  // Bradford ile D65 → D50 uyarlaması
  const BFD = [
    [0.8951, 0.2664, -0.1614],
    [-0.7502, 1.7135, 0.0367],
    [0.0389, -0.0685, 1.0296],
  ]
  const lms65 = vec(BFD, D65)
  const lms50 = vec(BFD, D50)
  const olcek = [
    [lms50[0] / lms65[0], 0, 0],
    [0, lms50[1] / lms65[1], 0],
    [0, 0, lms50[2] / lms65[2]],
  ]
  const M = mul(mul(inv(BFD), olcek), mul(BFD, M65))

  // ---- ICC ikili yapısı ----
  const s15f16 = (v) => {
    const t = Math.round(v * 65536)
    return t < 0 ? t + 0x100000000 : t
  }
  const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return b }
  const tag4 = (s) => Buffer.from(s, 'ascii')
  const XYZtag = (v) => Buffer.concat([tag4('XYZ '), u32(0), u32(s15f16(v[0])), u32(s15f16(v[1])), u32(s15f16(v[2]))])
  // curv: 4096 noktalı SAF GAMMA tablosu. Gamma değeri dosyanın
  // etiketine göre seçilir (aşağıda, ana akışta):
  //   - cICP(12,1,x,x) taşıyan dosyalar → 2.4 (Chrome cICP'yi her
  //     şeyden öncelikli okur ve BT.709 aktarımını BT.1886 ekran
  //     kuralıyla, yani saf gamma 2.4 ile uygular — ramp ölçümü +
  //     gerçek dosya kalibrasyonu ile doğrulandı, sapma 0)
  //   - yalnız cHRM+gAMA(45455) taşıyanlar → 2.2 (ramp ölçümü: fark 0)
  // Tablo kullanıyoruz çünkü u8Fixed8 tek girişli gamma 2.4'ü ancak
  // 2.3984 olarak kodlayabiliyor; tabloda kayıp yok.
  // gamma sayı ise saf üs; 'srgb' ise sRGB parçalı eğrisi (cICP aktarım 13)
  const N = 4096
  const egri = Buffer.alloc(N * 2)
  for (let k = 0; k < N; k++) {
    const v = k / (N - 1)
    const lin =
      gamma === 'srgb'
        ? v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
        : Math.pow(v, gamma)
    egri.writeUInt16BE(Math.round(lin * 65535), k * 2)
  }
  const curv = Buffer.concat([tag4('curv'), u32(0), u32(N), egri])
  const descMetin = `${primaryAdi === 'p3' ? 'Display P3' : 'sRGB primaries'} (${gamma === 'srgb' ? 'sRGB TRC' : 'Gamma ' + gamma})`
  const desc = Buffer.concat([
    tag4('desc'), u32(0), u32(descMetin.length + 1),
    Buffer.from(descMetin + '\0', 'ascii'),
    u32(0), u32(0), Buffer.alloc(2 + 1 + 67),
  ])
  const cprtMetin = 'CC0'
  const cprt = Buffer.concat([tag4('text'), u32(0), Buffer.from(cprtMetin + '\0', 'ascii')])

  const etiketler = [
    ['desc', desc],
    ['wtpt', XYZtag(D50)],
    ['rXYZ', XYZtag([M[0][0], M[1][0], M[2][0]])],
    ['gXYZ', XYZtag([M[0][1], M[1][1], M[2][1]])],
    ['bXYZ', XYZtag([M[0][2], M[1][2], M[2][2]])],
    ['rTRC', curv],
    ['gTRC', curv],
    ['bTRC', curv],
    ['cprt', cprt],
  ]

  // Tag tablosu + ofset hizalama (4 bayt)
  let ofset = 128 + 4 + etiketler.length * 12
  const tablo = [u32(etiketler.length)]
  const govde = []
  for (const [ad, veri] of etiketler) {
    tablo.push(tag4(ad), u32(ofset), u32(veri.length))
    const dolgulu = veri.length % 4 ? Buffer.concat([veri, Buffer.alloc(4 - (veri.length % 4))]) : veri
    govde.push(dolgulu)
    ofset += dolgulu.length
  }

  const baslik = Buffer.alloc(128)
  baslik.writeUInt32BE(ofset, 0) // toplam boyut
  baslik.write('none', 4, 'ascii') // CMM
  baslik.writeUInt32BE(0x02200000, 8) // sürüm 2.2
  baslik.write('mntr', 12, 'ascii')
  baslik.write('RGB ', 16, 'ascii')
  baslik.write('XYZ ', 20, 'ascii')
  baslik.writeUInt16BE(2026, 24) // tarih
  baslik.writeUInt16BE(7, 26)
  baslik.writeUInt16BE(16, 28)
  baslik.write('acsp', 36, 'ascii')
  baslik.write('MSFT', 40, 'ascii')
  // PCS aydınlatıcısı: D50
  baslik.writeUInt32BE(s15f16(0.9642), 68)
  baslik.writeUInt32BE(s15f16(1.0), 72)
  baslik.writeUInt32BE(s15f16(0.8249), 76)

  return Buffer.concat([baslik, ...tablo, ...govde])
}

/* ---------- 2. WebP'ye ICCP CHUNK'I GÖMME (piksellere dokunmadan) ---------- */
function iccpGom(webpBuf, icc, genislik, yukseklik, alfaVar) {
  if (webpBuf.toString('ascii', 0, 4) !== 'RIFF' || webpBuf.toString('ascii', 8, 12) !== 'WEBP')
    throw new Error('WebP degil')
  // Mevcut chunk'ları ayıkla
  const chunklar = []
  let i = 12
  while (i < webpBuf.length) {
    const tip = webpBuf.toString('ascii', i, i + 4)
    const len = webpBuf.readUInt32LE(i + 4)
    const uzunluk = 8 + len + (len % 2) // tek boyut 1 bayt dolgulanır
    chunklar.push({ tip, veri: webpBuf.subarray(i, i + uzunluk) })
    i += uzunluk
  }
  // Eski VP8X/ICCP varsa atılır (profil DEĞİŞTİRİLİR) — piksel chunk'ları korunur

  const u32le = (v) => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); return b }
  const u24le = (v) => { const b = Buffer.alloc(3); b.writeUIntLE(v, 0, 3); return b }

  // VP8X: bayrak baytı — bit5 ICC (0x20), bit4 Alfa (0x10)
  const bayrak = 0x20 | (alfaVar ? 0x10 : 0)
  const vp8x = Buffer.concat([
    Buffer.from('VP8X', 'ascii'), u32le(10),
    Buffer.from([bayrak, 0, 0, 0]),
    u24le(genislik - 1), u24le(yukseklik - 1),
  ])
  const iccDolgu = icc.length % 2 ? Buffer.concat([icc, Buffer.alloc(1)]) : icc
  const iccp = Buffer.concat([Buffer.from('ICCP', 'ascii'), u32le(icc.length), iccDolgu])

  // VP8X varsa (beklenmiyor) yeniden kurmuyoruz; sharp çıktısı düz VP8L'dir
  const eskiGovde = Buffer.concat(chunklar.filter((c) => c.tip !== 'VP8X').map((c) => c.veri))
  const yeniGovde = Buffer.concat([vp8x, iccp, eskiGovde])
  return Buffer.concat([Buffer.from('RIFF', 'ascii'), u32le(4 + yeniGovde.length), Buffer.from('WEBP', 'ascii'), yeniGovde])
}

/* ---------- 2b. WebP'den VP8X/ICCP'yi KALDIR (piksellere dokunmadan) ---------- */
function profilKaldir(webpBuf) {
  const parcalar = []
  let i = 12
  while (i < webpBuf.length) {
    const tip = webpBuf.toString('ascii', i, i + 4)
    const len = webpBuf.readUInt32LE(i + 4)
    const uz = 8 + len + (len % 2)
    if (tip !== 'VP8X' && tip !== 'ICCP') parcalar.push(webpBuf.subarray(i, i + uz))
    i += uz
  }
  const govde = Buffer.concat(parcalar)
  const bas = Buffer.alloc(12)
  bas.write('RIFF', 0, 'ascii')
  bas.writeUInt32LE(4 + govde.length, 4)
  bas.write('WEBP', 8, 'ascii')
  return Buffer.concat([bas, govde])
}

/* ---------- 3. PNG RENK ETİKETİ SINIFLANDIRMASI ----------
   Dönüş: gerekli gamma (2.4 / 2.2) veya null (profil gerekmez).
   ÖNCELİK SIRASI (Chrome'un uyguladığı): cICP > iCCP > sRGB > cHRM+gAMA.
   - cICP(12,1,x,x): Display P3 + BT.709 aktarımı → tarayıcı BT.1886
     (saf gamma 2.4) ile gösterir → 2.4 profili gerekir. cICP, iCCP'den
     bile öncelikli olduğundan iCCP'li dosyada cICP varsa yine 2.4!
   - cICP yok + iCCP/sRGB var: profil zaten korunuyor / gerek yok.
   - cICP yok + P3 cHRM + gAMA(45455): saf gamma 2.2 → 2.2 profili. */
function gerekliGamma(pngYolu) {
  const b = fsSync.readFileSync(pngYolu)
  let i = 8, chrm = null, iccp = false, srgb = false, cicp = null
  while (i < b.length - 8) {
    const len = b.readUInt32BE(i), tip = b.toString('ascii', i + 4, i + 8)
    if (tip === 'cHRM') chrm = Array.from({ length: 8 }, (_, k) => b.readUInt32BE(i + 8 + k * 4))
    else if (tip === 'iCCP') iccp = true
    else if (tip === 'sRGB') srgb = true
    else if (tip === 'cICP') cicp = [...b.subarray(i + 8, i + 8 + 4)]
    else if (tip === 'IDAT') break
    i += 12 + len
  }
  if (cicp) {
    if (cicp[0] === 12 && cicp[1] === 1) return 'p3-2.4' // P3 + BT.1886
    // cICP(12,13): Chrome bu kombinasyonu desteklemiyor ve dosyayı DÜZ sRGB
    // gibi gösteriyor (bitis.png üzerinde ölçüldü: kaynak=ekran, Δ0) —
    // birebir aynı görünüm için webp'de profil OLMAMALI (varsa kaldırılır).
    if (cicp[0] === 12 && cicp[1] === 13) return 'profil-kaldir'
    if (cicp[0] === 1 && cicp[1] === 1) return 'srgb-2.4' // sRGB primary + BT.1886
    if (cicp[0] === 1 && cicp[1] === 13) return null // tam sRGB → profil gerekmez
    throw new Error(`beklenmeyen cICP ${cicp} — elle incele: ${pngYolu}`)
  }
  if (iccp || srgb || !chrm) return null
  const p3 = [31270, 32900, 68000, 32000, 26500, 69000, 15000, 6000]
  const srgbChrm = [31270, 32900, 64000, 33000, 30000, 60000, 15000, 6000]
  if (chrm.every((v, k) => Math.abs(v - p3[k]) <= 60)) return 'p3-2.2'
  if (chrm.every((v, k) => Math.abs(v - srgbChrm[k]) <= 60)) return null
  throw new Error(`beklenmeyen cHRM ${chrm} — elle incele: ${pngYolu}`)
}

async function pngleriBul(dizin, sonuc = []) {
  for (const g of await fs.readdir(dizin, { withFileTypes: true })) {
    const t = path.join(dizin, g.name)
    if (g.isDirectory()) await pngleriBul(t, sonuc)
    else if (/\.png$/i.test(g.name)) sonuc.push(t)
  }
  return sonuc
}

/* ---------- ANA AKIŞ ---------- */
const iccProfiller = {
  'p3-2.4': p3Icc(2.4, 'p3'),
  'p3-2.2': p3Icc(2.2, 'p3'),
  'p3-srgb': p3Icc('srgb', 'p3'),
  'srgb-2.4': p3Icc(2.4, 'srgb'),
}
const icc = iccProfiller['p3-2.4'] // rXYZ sağlaması için
console.log('ICC profilleri üretildi:', Object.keys(iccProfiller).join(', '))
// Üretilen matrisin bilinen Display P3 değerlerine yakınlığını yaz (sağlama)
const oku = (of) => (icc.readUInt32BE(of) > 0x7fffffff ? icc.readUInt32BE(of) - 0x100000000 : icc.readUInt32BE(of)) / 65536
const tagOfset = (ad) => {
  const n = icc.readUInt32BE(128)
  for (let k = 0; k < n; k++) {
    if (icc.toString('ascii', 132 + k * 12, 136 + k * 12) === ad) return icc.readUInt32BE(136 + k * 12)
  }
}
const rOf = tagOfset('rXYZ')
console.log('rXYZ =', oku(rOf + 8).toFixed(5), oku(rOf + 12).toFixed(5), oku(rOf + 16).toFixed(5), '(beklenen ~0.51512 0.24120 -0.00105)')

let gomulen = 0, atlanan = 0, hatali = []
const gammaSayim = {}
for (const png of await pngleriBul(YEDEK)) {
  const rel = path.relative(YEDEK, png)
  let gamma
  try {
    gamma = gerekliGamma(png)
  } catch (e) {
    hatali.push(e.message)
    continue
  }
  if (gamma === null) { atlanan++; continue }
  gammaSayim[gamma] = (gammaSayim[gamma] || 0) + 1
  const webpYolu = path.join(HEDEF, rel.replace(/\.png$/i, '.webp'))
  try {
    const eski = await fs.readFile(webpYolu)
    const meta = await sharp(eski).metadata()
    const yeni =
      gamma === 'profil-kaldir'
        ? profilKaldir(eski)
        : iccpGom(eski, iccProfiller[gamma], meta.width, meta.height, !!meta.hasAlpha)

    // DOĞRULAMA 1: sıkıştırılmış piksel verisi (VP8L bit akışı) bayt bayt
    // aynı kalmalı — profil dışında hiçbir şeye dokunmadığımızın kanıtı.
    // (sharp decode karşılaştırması KULLANILMAZ: sharp profili görünce
    // renk dönüşümünü uygular — tarayıcı gibi — bu yüzden decode çıktısı
    // kasıtlı olarak farklıdır.)
    const govdeAl = (buf) => {
      const parcalar = []
      let k = 12
      while (k < buf.length) {
        const tip = buf.toString('ascii', k, k + 4)
        const len = buf.readUInt32LE(k + 4)
        const uz = 8 + len + (len % 2)
        if (tip !== 'VP8X' && tip !== 'ICCP') parcalar.push(buf.subarray(k, k + uz))
        k += uz
      }
      return Buffer.concat(parcalar)
    }
    if (!govdeAl(eski).equals(govdeAl(yeni))) throw new Error('bit akisi degisti!')
    // DOĞRULAMA 2: yeni dosya çözülebilmeli, boyutlar aynı, profil okunmalı
    const metaYeni = await sharp(yeni).metadata()
    if (metaYeni.width !== meta.width || metaYeni.height !== meta.height)
      throw new Error('boyut bozuldu!')
    if (gamma === 'profil-kaldir' ? metaYeni.icc : !metaYeni.icc)
      throw new Error(gamma === 'profil-kaldir' ? 'profil kalkmadi!' : 'profil okunamadi!')
    await sharp(yeni).raw().toBuffer() // decode sağlaması (bozuksa fırlatır)

    await fs.writeFile(webpYolu, yeni)
    gomulen++
  } catch (e) {
    hatali.push(rel + ': ' + e.message)
  }
}
console.log(`\nÖZET: ${gomulen} WebP'ye P3 profili gömüldü (gamma dağılımı: ${JSON.stringify(gammaSayim)}), ${atlanan} dosyaya profil gerekmedi.`)
if (hatali.length) console.log('HATALI:\n' + hatali.join('\n'))
