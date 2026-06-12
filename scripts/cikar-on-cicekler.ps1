# =====================================================================
# cikar-on-cicekler.ps1
#
# Arka plandaki ÖN PLAN çiçeklerini (sol alttaki lale kümesi + alt
# şerit) ayrı bir saydam PNG katmanı olarak çıkarır.
#
# Neden? Işıl yolun başında bu çiçeklerin ARKASINDAN yürümeli.
# Arka plan tek parça JPG olduğu için bunu z-index ile yapamayız;
# çiçeklerin kopyasını saydam bir katman olarak çıkarıp Işıl'ın
# önüne koyuyoruz. Katmandaki pikseller arka planla birebir aynı
# olduğu için ek görüntü hiç belli olmaz - ama Işıl arkasında kalır.
#
# Yöntem: çiçek tepelerinin silüetini izleyen bir çokgen (POLIGON)
# tanımlı. Çokgenin içi korunur, dışı saydam olur. Silüet birebir
# oturmazsa aşağıdaki noktaları düzeltip scripti tekrar çalıştır.
#
# Kullanım (proje kök klasöründe):
#   powershell -ExecutionPolicy Bypass -File scripts/cikar-on-cicekler.ps1
# =====================================================================

param(
    [string]$ArkaplanDosya = "src/assets/backgrounds/sahne1-arkaplan.jpg",
    [string]$CikisDosya    = "src/assets/backgrounds/sahne1-on-cicekler.png"
)

Add-Type -AssemblyName System.Drawing

# --- Çiçek silüeti çokgeni ---
# Değerler görüntünün tamamına oranla: (x, y) = (genişlik%, yükseklik%)
# y yukarıdan aşağı artar (0 = üst kenar, 1 = alt kenar).
# Sıra: sol kenardan başlayıp çiçek tepelerini izleyerek sağa,
# sonra alt köşelerden geri kapanır.
$poligon = @(
    @(0.000, 0.765),  # sol kenar, ilk pembe lalenin tepe hizası
    @(0.018, 0.748),  # pembe lale tepesi
    @(0.045, 0.735),  # turuncu lale tepesi (en yüksek nokta)
    @(0.070, 0.760),  # iki çiçek arası çukur
    @(0.090, 0.748),  # ikinci pembe lale tepesi
    @(0.115, 0.785),  # kümenin sağ kenarı
    @(0.130, 0.830),  # alçalış
    @(0.150, 0.875),  # küçük sarı çiçekler
    @(0.165, 0.860),
    @(0.187, 0.815),  # ortadaki pembe lale tepesi
    @(0.210, 0.828),
    @(0.240, 0.840),  # turuncu lale
    @(0.260, 0.868),
    @(0.280, 0.888),  # sarı çiçek
    @(0.300, 0.868),
    @(0.320, 0.845),  # turuncu/kırmızı lale
    @(0.340, 0.872),
    @(0.365, 0.892),  # sağdaki sarı çiçek
    @(0.370, 1.000),  # sağ alt köşe
    @(0.000, 1.000)   # sol alt köşe (kapanış)
)

$bg = [System.Drawing.Image]::FromFile((Resolve-Path $ArkaplanDosya))
$W = $bg.Width; $H = $bg.Height

# Katmanın kapsayacağı bölge: x 0..%37, y %73..%100 (çokgeni içine alır)
$x0 = 0
$y0 = [int]($H * 0.73)
$kw = [int]($W * 0.37)
$kh = $H - $y0

# Saydam tuval oluştur, çokgeni kırpma alanı (clip) yap, arka planı içine çiz
$katman = New-Object System.Drawing.Bitmap($kw, $kh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($katman)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$yol = New-Object System.Drawing.Drawing2D.GraphicsPath
$noktalar = $poligon | ForEach-Object {
    # Çokgen noktalarını piksele çevir, bölge başlangıcına göre kaydır
    New-Object System.Drawing.PointF(($_[0] * $W - $x0), ($_[1] * $H - $y0))
}
$yol.AddPolygon([System.Drawing.PointF[]]$noktalar)
$g.SetClip($yol)

# Arka planın ilgili bölgesini, kırpma alanından içeri çiz
$g.DrawImage($bg,
    (New-Object System.Drawing.Rectangle(0, 0, $kw, $kh)),
    (New-Object System.Drawing.Rectangle($x0, $y0, $kw, $kh)),
    [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose(); $bg.Dispose()
$katman.Save($CikisDosya, [System.Drawing.Imaging.ImageFormat]::Png)
$katman.Dispose()

$kb = [Math]::Round((Get-Item $CikisDosya).Length / 1KB)
Write-Host "Olusturuldu: $CikisDosya (${kw}x${kh}px, ${kb} KB)" -ForegroundColor Green
Write-Host "Sahnede konum: left:0, bottom:0, width:%37"
