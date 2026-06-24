/* ===============================================================
   SÜRÜKLE İPUCU — "tutup sürükle" el işareti

   Sürüklenebilir bir öğenin (sayfa3 Işıl, sayfa4 uçurtma) ÜZERİNDE durur:
   yumuşak bir el, nesneyi TUTUP yana SÜRÜKLER gibi hareket eder (çocuk bunu
   kendi keşfetmesin diye). El, parmakları kıvrık "tutma" pozundadır.

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
      style={{ width: '13cqw', height: '13cqw', transform: 'translate(-50%, -50%)', ...style }}
    >
      {/* EL — flexbox ile ortalanır (transform animasyona serbest kalsın),
          animate-surukle-el ile tut → kay → bırak → dön döngüsünü oynar. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="animate-surukle-el"
          style={{ width: '7.6cqw', height: '9.4cqw', filter: 'drop-shadow(0 0.5cqw 0.55cqw rgba(70,45,25,0.32))' }}
        >
          <ElGorseli />
        </div>
      </div>
    </div>
  )
}

/* Çocuk dostu, RENKLİ "tutan" el — yumuşak ten dolgu + sıcak hat; üstte
   şeker-pembe manşet (kol). El YUKARIDAN nesneye uzanır: avuç üstte, dört
   ayrık parmak + başparmak nesneyi tutmak için aşağı iner. Manşet renk katar
   ve "kol uzanıyor" hissini güçlendirir (Sevgi temasına uygun). */
function ElGorseli() {
  return (
    <svg viewBox="0 0 60 74" className="h-full w-full">
      <g strokeLinejoin="round" strokeLinecap="round">
        {/* PARMAKLAR + BAŞPARMAK (avucun arkasında; tabanları avuçla örtülür) */}
        <g fill="#ffcea3" stroke="#c5895c" strokeWidth="2.3">
          <rect x="13" y="32" width="8.5" height="26" rx="4.25" transform="rotate(-8 17 45)" />
          <rect x="22.5" y="30" width="9" height="30" rx="4.5" />
          <rect x="32" y="32" width="8.5" height="27" rx="4.25" transform="rotate(7 36 45)" />
          <rect x="40.5" y="35" width="8" height="20" rx="4" transform="rotate(15 44 45)" />
          <rect x="2.5" y="35" width="8.5" height="19" rx="4.25" transform="rotate(40 7 44)" />
        </g>
        {/* AVUÇ (üstte; parmak tabanlarını örter → temiz boğum çizgisi) */}
        <path
          d="M11 36 q0 -12 19 -12 q19 0 19 12 v5 q0 9 -19 9 q-19 0 -19 -9 z"
          fill="#ffcea3"
          stroke="#c5895c"
          strokeWidth="2.3"
        />
        {/* MANŞET (renkli kol — şeker pembe) */}
        <path
          d="M15 30 q-1 -12 15 -12 q16 0 15 12 q-3 4 -15 4 q-12 0 -15 -4 z"
          fill="#ff8fab"
          stroke="#dd6f8e"
          strokeWidth="2.3"
        />
      </g>
    </svg>
  )
}

export default SurukleIpucu
