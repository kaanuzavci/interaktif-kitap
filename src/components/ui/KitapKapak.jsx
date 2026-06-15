/* ===============================================================
   KİTAP KAPAĞI — rafta dik duran gerçek bir kitap nesnesi

   Giriş ekranındaki raf bu kapaklardan oluşur. Kapak; sol kenarında
   bir cilt (spine), sağ kenarında sayfa kenarı çizgileri, ortada
   krem bir başlık plakası (ikon + ad + alt) olan 3 boyutlu hissi
   veren bir objedir.

   - aktif    : true ise canlı/renkli, hafifçe nefes alır, "Başla" etiketi
                false ise soluk (grayscale), buzlu örtü + kilit + "Yakında"
   - aciliyor : kitap seçilip açılırken true olur; ÖN KAPAK cilt
                ekseninden (sol kenar) dışa doğru döner ve içerideki
                sıcak ışık görünür (kitap okuyucuya geçişin "büyülü" anı).
   - sallaniyor: kilitli kitaba dokununca kısa "çok yakında" sallanması
=============================================================== */

// Her kapak rengi için yüzey değerleri (index.css @theme renkleriyle uyumlu)
const KAPAK_RENK = {
  seker: { bg: '#ff8fab', glow: 'rgba(255,143,171,0.55)' },
  gunes: { bg: '#ffd166', glow: 'rgba(255,209,102,0.60)' },
  cimen: { bg: '#9bde7e', glow: 'rgba(155,222,126,0.55)' },
  gokyuzu: { bg: '#bde3ff', glow: 'rgba(120,180,235,0.55)' },
}

function KitapKapak({ kitap, aktif, aciliyor = false, sallaniyor = false }) {
  const renk = KAPAK_RENK[kitap.renk] || KAPAK_RENK.seker

  return (
    <div
      className={`relative ${aktif && !aciliyor ? 'animate-suzul' : ''} ${sallaniyor ? 'animate-tepki-salla' : ''}`}
      style={{ perspective: '1100px' }}
    >
      {/* Yumuşak alt gölge (rafa düşen gölge) */}
      <div
        className="absolute -bottom-3 left-1/2 h-4 w-[78%] -translate-x-1/2 rounded-[50%] blur-md"
        style={{ background: 'rgba(60,40,30,0.30)' }}
      />

      {/* KİTAP GÖVDESİ — 3:4 dik oran */}
      <div
        className="relative aspect-[3/4] w-full overflow-visible rounded-l-md rounded-r-lg"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ---- İÇERİ (kapak açılınca görünen sıcak ışık + sayfa hissi) ---- */}
        <div className="absolute inset-0 overflow-hidden rounded-l-md rounded-r-lg bg-krem">
          {/* sıcak ışık havuzu */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: aciliyor ? 1 : 0,
              background:
                'radial-gradient(circle at 30% 50%, rgba(255,221,150,0.95), rgba(255,246,233,0.6) 60%, rgba(255,246,233,0) 100%)',
            }}
          />
          {/* ince sayfa çizgileri */}
          <div
            className="absolute inset-y-3 right-2 left-3 opacity-40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent 0 10px, rgba(90,74,120,0.12) 10px 11px)',
            }}
          />
        </div>

        {/* ---- ÖN KAPAK (cilt ekseninden açılan kısım) ---- */}
        <div
          className="absolute inset-0 origin-left rounded-l-md rounded-r-lg shadow-[0_10px_22px_rgba(60,40,30,0.28)] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            background: renk.bg,
            transform: aciliyor ? 'rotateY(-158deg)' : 'rotateY(0deg)',
            transformStyle: 'preserve-3d',
            filter: aktif ? 'none' : 'grayscale(0.85) brightness(1.05)',
          }}
        >
          {/* Cilt (spine) — sol kenarda koyu şerit */}
          <div
            className="absolute inset-y-0 left-0 w-[12%] rounded-l-md"
            style={{
              background:
                'linear-gradient(to right, rgba(0,0,0,0.32), rgba(0,0,0,0.10) 60%, rgba(255,255,255,0.10))',
            }}
          />
          {/* Sayfa kenarı — sağ kenarda krem çizgiler */}
          <div
            className="absolute inset-y-1 right-0 w-[5%] rounded-r-lg"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, #fff6e9 0 2px, #e9dcc6 2px 4px)',
            }}
          />
          {/* Diyagonal sheen (ışık parlaması) */}
          <div
            className="pointer-events-none absolute inset-0 rounded-l-md rounded-r-lg"
            style={{
              background:
                'linear-gradient(125deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 42%)',
            }}
          />

          {/* Başlık plakası — krem, her renkte okunaklı */}
          <div className="absolute inset-x-[16%] top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border-2 border-white/70 bg-krem/95 px-2 py-3 text-center shadow-md">
            {/* İkon rozeti */}
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xl shadow md:h-11 md:w-11 md:text-2xl"
              style={{ background: renk.bg }}
            >
              {kitap.ikon}
            </span>
            <span className="font-baslik text-base font-extrabold leading-tight text-gece md:text-xl">
              {kitap.ad}
            </span>
            <span className="font-metin text-[10px] font-semibold leading-tight text-gece/55 md:text-xs">
              {kitap.alt}
            </span>
          </div>

          {/* Aktif: "Başla" etiketi (alt) / Kilitli: "Yakında" rozeti + kilit */}
          {aktif ? (
            <span className="animate-ziplama absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gece px-3 py-0.5 font-baslik text-xs font-bold text-white shadow-md md:text-sm">
              Başla ▶
            </span>
          ) : (
            <>
              <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gece/80 text-sm shadow">
                🔒
              </span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gece/70 px-3 py-0.5 font-baslik text-[11px] font-bold text-white shadow md:text-xs">
                Yakında
              </span>
            </>
          )}

          {/* Kilitli kapaklarda hafif buzlu örtü */}
          {!aktif && (
            <span className="pointer-events-none absolute inset-0 rounded-l-md rounded-r-lg bg-white/35 backdrop-blur-[1px]" />
          )}
        </div>

        {/* Aktif kitabın etrafında sıcak parıltı (kapak kapalıyken) */}
        {aktif && !aciliyor && (
          <div
            className="pointer-events-none absolute -inset-2 -z-10 rounded-2xl blur-xl"
            style={{ background: renk.glow }}
          />
        )}
      </div>
    </div>
  )
}

export default KitapKapak
