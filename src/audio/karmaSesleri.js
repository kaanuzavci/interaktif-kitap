/* ===============================================================
   KARMA SESLERİ — kitabın ortak (sayfaya özel olmayan) ses efektleri

   src/assets/sounds/karma/ klasöründeki dosyaların URL'lerini toplar:
     FON MÜZİĞİ        → fon müziği (anlatımın arkasında; useFonMuzigi)
     GÜLME SESİ        → sayfa0'da Işıl'ın ilk/son çıkışı (SevgiSahne0)
     KUŞ SESİ          → sayfa6'da hafif kuş cıvıltısı (SevgiSahne6)
     IŞILTI SESİ       → sayfa12'de çiçek yapraklarındaki parıltı (SevgiSahne12)
     yazı yamulma sesi → sayfa0'da "Sevgi" yazısı yamulurken (animasyon1)
     harf düşme sesi   → sayfa0'da harfler düşerken (animasyon2)
     sayfa çevirme sesi→ her sayfa çevrilişinde (useSayfaSesi)

   Dosya adları Türkçe (İ/Ş/Ü) olduğundan, Unicode normalizasyon sorunlarına
   düşmemek için AYIRT EDİCİ ASCII alt-dizgelerle eşleştirilir. Dosya yoksa
   ilgili sabit null döner → çağıran taraf sesi sessizce atlar (build kırılmaz).

   NOT: Dosyalar .mpeg uzantılı (aslında MPEG/MP3 ses). Hem Vite (bilinen
   varlık türü) hem Howler (mpeg codec'i) bu uzantıyı tanır; yine de Howl'a
   format: ['mpeg'] verilir ki hash'li URL'de otomatik algılama garanti olsun.
=============================================================== */

const moduller = import.meta.glob('../assets/sounds/karma/*.{mpeg,mp3,ogg,wav}', {
  eager: true,
  import: 'default',
})

// Yol büyük harfe çevrilip verilen ASCII parçayı içeren ilk dosyanın URL'i.
function bul(parca) {
  const anahtar = Object.keys(moduller).find((yol) => yol.toUpperCase().includes(parca))
  return anahtar ? moduller[anahtar] : null
}

export const FON_MUZIGI = bul('FON') // "FON MÜZİĞİ"
export const GULME_SESI = bul('LME') // "GÜLME SESİ"
export const KUS_SESI = bul('KU') //    "KUŞ SESİ"
export const ISILTI_SESI = bul('ILT') // "IŞILTI SESİ"
export const YAZI_YAMULMA_SESI = bul('YAMUL') // "yazı yamulma sesi"
export const HARF_DUSME_SESI = bul('HARF') //    "harf düşme sesi"
export const SAYFA_CEVIRME_SESI = bul('EVIR') // "sayfa çevirme sesi"
