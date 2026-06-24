/* ===============================================================
   SÜRÜKLE İPUCU — "tutup sürükle" el işareti

   Sürüklenebilir bir öğenin (sayfa3 Işıl, sayfa4 uçurtma) ÜZERİNDE durur:
   yumuşak bir el görseli yanlara kayarak "bu nesneyi TUTUP SÜRÜKLEYEBİLİRSİN"
   mesajını verir (çocuk bunu kendi keşfetmesin diye). İki yanındaki oklar
   sürükleme yönünü vurgular.

   YAŞAM DÖNGÜSÜ: İlk tutuşa kadar görünür; nesne bir kez tutulunca sahne
   bu ipucunu kaldırır. Sayfaya her gelişte sahne sıfırdan kurulduğu için
   (BookReader key={sahneIndex}) başka sayfaya gidip dönünce yeniden belirir.
   pointer-events YOK → altındaki nesnenin tutulmasını engellemez.

   Boyut sahneye göre (cqw) ölçeklenir; konum (left/top) ve zIndex çağırandan
   `style` ile gelir. translate(-50%, -50%) ile verilen nokta bileşenin
   MERKEZİdir (tıpkı DokunIpucu gibi).
=============================================================== */
function SurukleIpucu({ style }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ width: '22cqw', height: '13cqw', transform: 'translate(-50%, -50%)', ...style }}
    >
      {/* Yön okları — elin iki yanında, sürükleme eksenini gösterir */}
      <Ok yon="sol" />
      <Ok yon="sag" />

      {/* EL — flexbox ile ortalanır (transform animasyona serbest kalsın),
          animate-surukle-el ile tut → kay → bırak → dön döngüsünü oynar. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="animate-surukle-el"
          style={{ width: '9.5cqw', height: '9.5cqw', filter: 'drop-shadow(0 0.6cqw 0.6cqw rgba(70,45,25,0.35))' }}
        >
          <ElGorseli />
        </div>
      </div>
    </div>
  )
}

/* Yumuşak, çocuk dostu açık el (palm) — krem dolgu + mor (gece) ana hat.
   Material "pan_tool" silüeti: dört parmak + başparmak, evrensel "taşı/sürükle"
   jesti. Sahne paletiyle uyumlu (krem/gece) olacak şekilde boyandı. */
function ElGorseli() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <path
        d="M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z"
        fill="#fff6e9"
        stroke="#5a4a78"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* Yön oku (chevron) — elin sol/sağ yanında nazikçe nabız atar. */
function Ok({ yon }) {
  const sol = yon === 'sol'
  return (
    <div
      className="animate-surukle-ok absolute top-1/2 -translate-y-1/2"
      style={{
        [sol ? 'left' : 'right']: 0,
        width: '4cqw',
        height: '4cqw',
        animationDelay: sol ? '0s' : '1.2s',
      }}
    >
      <svg viewBox="0 0 24 24" className="h-full w-full" style={{ transform: sol ? 'scaleX(-1)' : 'none' }}>
        <path
          d="M9 5l7 7-7 7"
          fill="none"
          stroke="#5a4a78"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export default SurukleIpucu
