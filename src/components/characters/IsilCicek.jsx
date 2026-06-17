import KareAnimasyon from './KareAnimasyon.jsx'

/* ===============================================================
   IŞIL (ÇİÇEKLE) — 2. sahnedeki Işıl'ın çiçeği tutuş/uzatış animasyonu

   2 pozlu, ŞEFFAF arka planlı kare dizisi (isil_cicegi_birak):
     pose_01 = dik duruş (çiçeği tutar),  pose_02 = öne eğilip uzatma.
   Tam 16:9 tuvale gömülü olduğundan bileşen tam-kare (inset-0) konumlanır
   (bkz. SevgiSahne2).

   Oynatma: iki poz arasında NAZİK, yavaş geçiş (asimetrik tempo) →
   tekrarlayan, sakin bir "al bunu" hareketi. (Yalnızca 2 anahtar poz
   olduğundan ara kare yoktur; bu yüzden tempo bilerek yavaş tutulur.)

   NOT: Kaynak pozlar siyah ZEMİN üzerine değil, gerçek ALFA
   (şeffaflık) ile gelir; köşe/zemin pikselleri alpha=0'dır. Yine de
   web'de test sayfasıyla (?test) doğrulanır.
=============================================================== */

// Duruş temposu (ms): [dik tutuş, öne uzatma] — sakin, yavaş alternasyon
const DURUS = [2000, 1500]
const moduller = import.meta.glob('../../assets/characters/isil_cicegi_birak/*.png', {
  eager: true,
  import: 'default',
})
const frames = Object.keys(moduller)
  .sort()
  .map((yol) => moduller[yol])

export const ISIL_CICEK_KARE_SAYISI = frames.length

function IsilCicek({ width = '100%', className = '', style = {}, oynat = true }) {
  return (
    <KareAnimasyon
      frames={frames}
      kareSureleri={DURUS}
      loop
      oynat={oynat}
      width={width}
      className={className}
      style={style}
      alt="Işıl çiçeği tutuyor"
    />
  )
}

export default IsilCicek
