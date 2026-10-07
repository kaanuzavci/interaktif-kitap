/* ===============================================================
   SAYFA KAYDIRMA İPUCU — "sayfayı kaydır" el işareti

   Çocuğa sayfanın nasıl çevrileceğini gösterir:
   - SAĞ sayfada: el, sayfanın orta hizasında belirir ve YALNIZCA
     YATAYDA SOLA kayarak söner (ileri çevirme hareketi).
   - SOL sayfada: aynısının aynası — el SOLDAN SAĞA kayar (geri).

   BookReader, yalnızca o yönde çevrilecek sayfa varken çizer.
   pointer-events yok → altındaki sürükleme bölgesini engellemez.
   Animasyon saf CSS (index.css: sayfaKaydirSol/Sag) olduğundan hem
   "hareketleri azalt" (.hareketsiz → animasyon yok, taban opacity:0
   sayesinde el hiç görünmez) hem durdur düğmesi (.kitap-duraklat →
   olduğu yerde donar) otomatik çalışır.

   Props:
   - yon: 'ileri' → sağ sayfada sola kayan el
          'geri'  → sol sayfada sağa kayan el
=============================================================== */
function SayfaKaydirIpucu({ yon }) {
  const ileri = yon === 'ileri'
  return (
    <div
      className={`pointer-events-none absolute z-[35] ${
        ileri ? 'animate-sayfa-kaydir-sol' : 'animate-sayfa-kaydir-sag'
      }`}
      style={{
        // Sayfanın orta hizası: sağ sayfada %75 (sağ yarının ortası),
        // sol sayfada %25. translate merkez ankrajı keyframe'lerde.
        left: ileri ? '75%' : '25%',
        top: '50%',
        width: '7%', // sahne genişliğinin yüzdesi → her ekranda oransal
        aspectRatio: '1 / 1',
        opacity: 0, // animasyon yoksa (hareketsiz) görünmez kalsın
        transform: 'translate(-50%, -50%)',
        filter: 'drop-shadow(0 2px 5px rgba(50,30,15,0.35))',
      }}
      aria-hidden="true"
    >
      {/* El (dokunan el silüeti) — geri yönünde yatay aynalanır */}
      <svg
        viewBox="0 0 24 24"
        style={{
          width: '100%',
          height: '100%',
          transform: ileri ? 'none' : 'scaleX(-1)',
        }}
      >
        {/* Hareket izi çizgileri (elin arkasında, kayma yönünün tersinde) */}
        <g stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.85">
          <line x1="21.5" y1="9" x2="23.5" y2="9" />
          <line x1="22" y1="13" x2="24" y2="13" />
        </g>
        {/* Dokunan el (Material 'touch_app' silüeti) — beyaz dolgulu,
            koyu konturlu: her sayfa renginin üstünde okunur */}
        <path
          d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6a1.5 1.5 0 0 0-3 0v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"
          fill="#ffffff"
          stroke="#5a4a78"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export default SayfaKaydirIpucu
