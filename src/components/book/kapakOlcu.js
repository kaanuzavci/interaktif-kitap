/* ===============================================================
   KAPAK ÖLÇÜSÜ — kapalı kitap kapağının boyutu (paylaşımlı)

   Kapak, açık kitaptaki TEK sayfayla birebir aynı boyuttadır — BookReader'ın
   spread geometrisiyle hesaplanır: kitabın dış genişliği min(96vw, 92dvh·16/9),
   iç spread bunun 2·çerçeve dolgusu kadar içidir ve yüksekliği spread
   genişliğinin 9/16'sıdır. Tek sayfa da bu yükseklikte, 8:9 oranındadır.

   Hem KapakEkrani (açılış) hem HomeScreen (kitap seçilince ortaya gelen kitabın
   bizim kapağımıza dönüştüğü geçiş) AYNI ölçüyü kullanır → morph kusursuz oturur.
=============================================================== */
export const SAYFA_YUK =
  'calc((min(96vw, 92dvh * 16 / 9) - 2 * clamp(8px, 1.5vmin, 16px)) * 9 / 16)'
export const SAYFA_GEN = `calc(${SAYFA_YUK} * 8 / 9)`
