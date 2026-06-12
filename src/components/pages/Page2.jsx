/**
 * Page2: GEÇİCİ test sayfası.
 *
 * Tek amacı, Book.jsx'teki sayfa geçiş sistemini (oklar + fade efekti)
 * deneyebilmek. Gerçek 2. sayfayı yaparken bu dosyanın içeriğini
 * tamamen değiştirebilir veya Page1.jsx'i şablon olarak kopyalayabilirsin.
 */
function Page2() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-seker/30 to-krem">
      <span className="animate-kalp text-7xl">🌷</span>
      <h2 className="font-baslik text-3xl font-extrabold text-gece md:text-4xl">
        2. sayfa yakında!
      </h2>
      <p className="font-metin text-lg text-gece/70">
        (Bu bir test sayfası — fade geçişini denemek için)
      </p>
    </div>
  )
}

export default Page2
