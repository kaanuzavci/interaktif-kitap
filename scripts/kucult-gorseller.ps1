# =====================================================================
# kucult-gorseller.ps1
#
# Oyun/kitap görsellerini web için optimize eder:
#   - Karakter frame PNG'lerini (şeffaflık korunarak) 600px genişliğe,
#   - Arka plan JPG'lerini 2560px genişliğe küçültür.
#
# Orijinaller silinmez: önce "asset-yedek/" klasörüne kopyalanır
# (bu klasör .gitignore'da, GitHub'a gitmez).
#
# Kullanım (proje kök klasöründe):
#   powershell -ExecutionPolicy Bypass -File scripts/kucult-gorseller.ps1
# =====================================================================

param(
    [string]$KarakterKlasoru   = "src/assets/characters/isil-yurume",
    [string]$ArkaplanKlasoru   = "src/assets/backgrounds",
    [int]$KarakterGenislik     = 600,
    [int]$ArkaplanGenislik     = 2560,
    [string]$YedekKlasoru      = "asset-yedek"
)

Add-Type -AssemblyName System.Drawing

# --- Yardımcı: bir görseli hedef genişliğe küçültüp üzerine yazar ---
function Kucult([string]$dosya, [int]$hedefGenislik, [bool]$pngMi) {
    # Dosyayı önce hafızaya oku ki kilitlenmesin (üzerine yazabilmek için)
    $bytes = [System.IO.File]::ReadAllBytes($dosya)
    $stream = New-Object System.IO.MemoryStream(,$bytes)
    $orijinal = [System.Drawing.Image]::FromStream($stream)

    # Zaten yeterince küçükse dokunma
    if ($orijinal.Width -le $hedefGenislik) {
        $orijinal.Dispose(); $stream.Dispose()
        Write-Host "  atlandi (zaten kucuk): $dosya"
        return
    }

    # En-boy oranını koruyarak yeni boyutu hesapla
    $oran = $hedefGenislik / $orijinal.Width
    $hedefYukseklik = [int][Math]::Round($orijinal.Height * $oran)

    # PNG'lerde şeffaflık için 32-bit ARGB tuval kullan
    $yeni = New-Object System.Drawing.Bitmap($hedefGenislik, $hedefYukseklik, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($yeni)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($orijinal, 0, 0, $hedefGenislik, $hedefYukseklik)
    $g.Dispose()
    $orijinal.Dispose()
    $stream.Dispose()

    if ($pngMi) {
        $yeni.Save($dosya, [System.Drawing.Imaging.ImageFormat]::Png)
    } else {
        # JPG: kalite 80 ile kaydet (görsel fark yok denecek kadar az, boyut çok düşer)
        $jpgCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
        $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)
        $yeni.Save($dosya, $jpgCodec, $params)
    }
    $yeni.Dispose()

    $yeniBoyutKB = [Math]::Round((Get-Item $dosya).Length / 1KB)
    Write-Host "  kuculdu: $dosya -> ${hedefGenislik}x${hedefYukseklik}px, ${yeniBoyutKB} KB"
}

# --- Yardımcı: dosyayı klasör yapısını koruyarak yedekle ---
function Yedekle([string]$dosya) {
    $hedef = Join-Path $YedekKlasoru $dosya
    $hedefKlasor = Split-Path $hedef -Parent
    New-Item -ItemType Directory -Force $hedefKlasor | Out-Null
    Copy-Item $dosya $hedef -Force
}

# ================== 1. KARAKTER FRAME'LERİ (PNG) ==================
Write-Host "`nKarakter frame'leri isleniyor: $KarakterKlasoru"
Get-ChildItem (Join-Path $KarakterKlasoru "*.png") | ForEach-Object {
    $goreliYol = Resolve-Path $_.FullName -Relative
    Yedekle $goreliYol
    Kucult $_.FullName $KarakterGenislik $true
}

# ================== 2. ARKA PLANLAR (JPG) ==================
Write-Host "`nArka planlar isleniyor: $ArkaplanKlasoru"
Get-ChildItem (Join-Path $ArkaplanKlasoru "*.jpg") | ForEach-Object {
    $goreliYol = Resolve-Path $_.FullName -Relative
    Yedekle $goreliYol
    Kucult $_.FullName $ArkaplanGenislik $false
}

Write-Host "`nBitti! Orijinaller '$YedekKlasoru/' klasorunde duruyor." -ForegroundColor Green
