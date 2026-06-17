import KareAnimasyon from './KareAnimasyon.jsx'

/* ===============================================================
   CANIM (ÇİÇEK) — 2. sahnedeki büyük ayçiçeği karakteri

   2 pozlu, ŞEFFAF arka planlı kare dizisi (cicek_animasyon):
     pose_01 = gözler AÇIK,  pose_02 = gözler KAPALI (kırpma).
   Her poz tam 16:9 bir tuvaldir; çiçek tuvalin ortasına gömülüdür.
   Bu yüzden bileşen ölçeklenip sahnenin SAĞ tarafına konumlandırılır
   (bkz. SevgiSahne2).

   Oynatma: DOĞAL GÖZ KIRPMA — uzun süre açık, kısa süre kapalı
   (kareSureleri ile asimetrik tempo). Sürekli döngü.
=============================================================== */

// Göz kırpma temposu (ms): [açık uzun, kapalı kısa] → ~3 sn'de bir kırpar
const KIRPMA = [2600, 200]
const moduller = import.meta.glob('../../assets/characters/cicek_animasyon/*.png', {
  eager: true,
  import: 'default',
})
const frames = Object.keys(moduller)
  .sort()
  .map((yol) => moduller[yol])

export const CICEK_KARE_SAYISI = frames.length

function CicekCanim({ width = '100%', className = '', style = {}, oynat = true }) {
  return (
    <KareAnimasyon
      frames={frames}
      kareSureleri={KIRPMA}
      loop
      oynat={oynat}
      width={width}
      className={className}
      style={style}
      alt="Canım çiçek"
    />
  )
}

export default CicekCanim
