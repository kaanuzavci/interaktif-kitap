/* ===============================================================
   ALFA HARİTASI — piksel-hassas tıklama yardımcıları (paylaşımlı)

   Tıklanabilir öğeler (TiklamaliSprite sprite'ları + TiklanirGorsel
   statik görselleri) dikdörtgen hotspot YERİNE görselin ALFA kanalını
   kullanır: yalnızca saydam OLMAYAN (görünen) pikseller tıklanabilir.

   Burada üç şey paylaşılır:
   - alfaHaritasiAl(im) : bir Image'in küçültülmüş alfa haritası + opak
     sınır kutusu (bbox), kare URL'sine göre önbellekli.
   - opakMerkez(im)     : opak piksellerin merkezi (0..1) → "dokun" halkası
     bu noktaya oturur.
   - noktaDolu(el, im, cx, cy) : ekran noktası, `el`'in kapladığı kutuya
     göre `im`'in alfasına çevrilip test edilir (küçük tolerans ile).

   Ölçüm oransal (getBoundingClientRect + alfa haritası) olduğundan her
   ekran boyutunda (telefon/tablet) birebir doğrudur.
=============================================================== */

// Alfa haritası çözünürlüğü (px). Doğal kare ~960px.
const HIT_GENISLIK = 240
// Bu alfa değerinin (0-255) üstü "dolu/görünen" piksel sayılır (yumuşak
// kenarları dışarıda bırakacak kadar yüksek → daha keskin silüet).
const ALFA_ESIK = 40
// Çok küçük dokunma toleransı (yaklaşık px) — yalnızca anti-alias/keskinlik
// payı; nesnenin dışına taşmayı önler.
const DOKUNMA_TOLERANS_PX = 4

// --- Alfa haritası + opak sınır (bbox) önbelleği (kare URL'sine göre) ---
const alfaCache = new Map()
let paylasilanCanvas = null
let paylasilanCtx = null

export function alfaHaritasiAl(im) {
  if (!im || !im.complete || !im.naturalWidth) return null
  const onbellek = alfaCache.get(im.src)
  if (onbellek) return onbellek
  if (!paylasilanCanvas) {
    paylasilanCanvas = document.createElement('canvas')
    paylasilanCtx = paylasilanCanvas.getContext('2d', { willReadFrequently: true })
  }
  const olcek = HIT_GENISLIK / im.naturalWidth
  const w = HIT_GENISLIK
  const h = Math.max(1, Math.round(im.naturalHeight * olcek))
  paylasilanCanvas.width = w
  paylasilanCanvas.height = h
  paylasilanCtx.clearRect(0, 0, w, h)
  try {
    paylasilanCtx.drawImage(im, 0, 0, w, h)
    const data = paylasilanCtx.getImageData(0, 0, w, h).data
    // Opak piksellerin sınır kutusu (ipucu dairesini ortalamak için)
    let minx = w, miny = h, maxx = -1, maxy = -1
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        if (data[(yy * w + xx) * 4 + 3] > ALFA_ESIK) {
          if (xx < minx) minx = xx
          if (xx > maxx) maxx = xx
          if (yy < miny) miny = yy
          if (yy > maxy) maxy = yy
        }
      }
    }
    const bbox = maxx >= 0 ? { minx, miny, maxx, maxy } : null
    const harita = { w, h, data, bbox }
    alfaCache.set(im.src, harita)
    return harita
  } catch {
    return null
  }
}

// Opak piksellerin merkezi (0..1) — "dokun" halkasını ortalamak için.
export function opakMerkez(im) {
  const h = alfaHaritasiAl(im)
  if (!h || !h.bbox) return null
  return {
    cx: (h.bbox.minx + h.bbox.maxx) / 2 / h.w,
    cy: (h.bbox.miny + h.bbox.maxy) / 2 / h.h,
  }
}

// Opak piksellerin sınır kutusu (0..1) — "kutu" (geniş/affedici) tıklama için:
// görselin görünen pikselleri arasında boşluk olsa bile (ör. raflar arası),
// tüm silüeti kapsayan dikdörtgene dokunmak öğeyi tetikler.
export function opakKutu(im) {
  const h = alfaHaritasiAl(im)
  if (!h || !h.bbox) return null
  return {
    minx: h.bbox.minx / h.w,
    miny: h.bbox.miny / h.h,
    maxx: h.bbox.maxx / h.w,
    maxy: h.bbox.maxy / h.h,
  }
}

// Piksel-hassas isabet testi: ekran noktasını `el`'in kapladığı kutuya
// göre `im`'in doğal pikseline çevir, alfasına bak (küçük tolerans ile).
// `im` henüz yüklenmediyse (harita yok) güvenli tarafta `true` döner.
export function noktaDolu(el, im, cx, cy) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return false
  const fx = (cx - r.left) / r.width
  const fy = (cy - r.top) / r.height
  if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return false
  const harita = alfaHaritasiAl(im)
  if (!harita) return true
  const { w, h, data } = harita
  const gx = Math.min(w - 1, Math.max(0, Math.round(fx * (w - 1))))
  const gy = Math.min(h - 1, Math.max(0, Math.round(fy * (h - 1))))
  const slop = Math.max(0, Math.round((DOKUNMA_TOLERANS_PX / r.width) * w))
  for (let dy = -slop; dy <= slop; dy++) {
    for (let dx = -slop; dx <= slop; dx++) {
      const px = gx + dx
      const py = gy + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      if (data[(py * w + px) * 4 + 3] > ALFA_ESIK) return true
    }
  }
  return false
}
