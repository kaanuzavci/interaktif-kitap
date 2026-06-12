# =====================================================================
# kirp-frameler.ps1
#
# Sprite frame'lerindeki gereksiz şeffaf kenar boşluklarını kırpar.
#
# Neden gerekli? Frame'ler 16:9 tuvale export edilmiş; karakter ortada,
# iki yanda büyük şeffaf boşluk var. Component'te width verince bu
# boşluklar da hesaba katılıyor ve karakter küçücük görünüyor.
#
# Nasıl çalışır?
#  1. TÜM frame'lere bakıp karakterin değdiği en geniş ortak kutuyu
#     (union bounding box) bulur. Tek tek kırpsaydık her frame farklı
#     kırpılır, animasyon "zıplardı". Ortak kutu = hizalama korunur.
#  2. Her frame'i bu kutuya göre kırpar, hedef yüksekliğe küçültür.
#
# Kaynak: asset-yedek'teki YÜKSEK çözünürlüklü orijinaller
# Hedef : src/assets/characters/isil-yurume/ (üzerine yazar)
#
# Kullanım (proje kök klasöründe):
#   powershell -ExecutionPolicy Bypass -File scripts/kirp-frameler.ps1
# =====================================================================

param(
    [string]$KaynakKlasor = "asset-yedek/src/assets/characters/isil-yurume",
    [string]$HedefKlasor  = "src/assets/characters/isil-yurume",
    [int]$HedefYukseklik  = 700,   # retina ekranlar için ekran boyutunun ~2 katı
    [int]$KenarPayi       = 12     # kutunun etrafında bırakılacak nefes payı (px)
)

# Piksel piksel alpha taraması PowerShell döngüsüyle çok yavaş olurdu;
# bu yüzden taramayı yapan küçük bir C# parçası derliyoruz (anlık olur).
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class BboxHesap {
    // Görüntüde alpha > 8 olan (yani görünür) piksellerin sınır kutusunu döndürür
    public static int[] Bul(string path) {
        using (var bmp = new Bitmap(path)) {
            var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
            var data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int bytes = Math.Abs(data.Stride) * bmp.Height;
            byte[] buf = new byte[bytes];
            Marshal.Copy(data.Scan0, buf, 0, bytes);
            bmp.UnlockBits(data);

            int minX = bmp.Width, minY = bmp.Height, maxX = -1, maxY = -1;
            for (int y = 0; y < bmp.Height; y++) {
                int row = y * data.Stride;
                for (int x = 0; x < bmp.Width; x++) {
                    if (buf[row + x * 4 + 3] > 8) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            return new int[] { minX, minY, maxX, maxY };
        }
    }
}
"@

Add-Type -AssemblyName System.Drawing

$dosyalar = Get-ChildItem (Join-Path $KaynakKlasor "*.png") | Sort-Object Name
if ($dosyalar.Count -eq 0) { Write-Error "Kaynak klasorde PNG bulunamadi: $KaynakKlasor"; exit 1 }

# ---- 1. ADIM: tüm frame'lerin ortak (union) sınır kutusunu bul ----
Write-Host "Ortak sinir kutusu hesaplaniyor ($($dosyalar.Count) frame)..."
$minX = [int]::MaxValue; $minY = [int]::MaxValue; $maxX = -1; $maxY = -1
foreach ($d in $dosyalar) {
    $b = [BboxHesap]::Bul($d.FullName)
    if ($b[0] -lt $minX) { $minX = $b[0] }
    if ($b[1] -lt $minY) { $minY = $b[1] }
    if ($b[2] -gt $maxX) { $maxX = $b[2] }
    if ($b[3] -gt $maxY) { $maxY = $b[3] }
}

# Kenar payı ekle (görüntü sınırlarını aşmayacak şekilde)
$ornek = [System.Drawing.Image]::FromFile($dosyalar[0].FullName)
$resimW = $ornek.Width; $resimH = $ornek.Height
$ornek.Dispose()
$minX = [Math]::Max(0, $minX - $KenarPayi)
$minY = [Math]::Max(0, $minY - $KenarPayi)
$maxX = [Math]::Min($resimW - 1, $maxX + $KenarPayi)
$maxY = [Math]::Min($resimH - 1, $maxY + $KenarPayi)
$kutuW = $maxX - $minX + 1
$kutuH = $maxY - $minY + 1
Write-Host "Ortak kutu: x=$minX y=$minY ${kutuW}x${kutuH}px (orijinal: ${resimW}x${resimH})"

# ---- 2. ADIM: kırp + küçült + kaydet ----
$oran   = [Math]::Min(1.0, $HedefYukseklik / $kutuH)  # sadece küçült, büyütme
$yeniW  = [int][Math]::Round($kutuW * $oran)
$yeniH  = [int][Math]::Round($kutuH * $oran)
Write-Host "Cikis boyutu: ${yeniW}x${yeniH}px`n"

New-Item -ItemType Directory -Force $HedefKlasor | Out-Null
foreach ($d in $dosyalar) {
    $kaynak = [System.Drawing.Image]::FromFile($d.FullName)
    $yeni = New-Object System.Drawing.Bitmap($yeniW, $yeniH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($yeni)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    # Kaynaktaki kutu bölgesini, yeni tuvalin tamamına çiz (kırpma + küçültme tek adımda)
    $hedefRect  = New-Object System.Drawing.Rectangle(0, 0, $yeniW, $yeniH)
    $kaynakRect = New-Object System.Drawing.Rectangle($minX, $minY, $kutuW, $kutuH)
    $g.DrawImage($kaynak, $hedefRect, $kaynakRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose(); $kaynak.Dispose()

    $hedefDosya = Join-Path $HedefKlasor $d.Name
    $yeni.Save($hedefDosya, [System.Drawing.Imaging.ImageFormat]::Png)
    $yeni.Dispose()
    $kb = [Math]::Round((Get-Item $hedefDosya).Length / 1KB)
    Write-Host "  $($d.Name) -> ${yeniW}x${yeniH}px, ${kb} KB"
}

Write-Host "`nBitti!" -ForegroundColor Green
