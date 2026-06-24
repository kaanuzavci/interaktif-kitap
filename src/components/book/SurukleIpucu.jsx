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
      style={{ width: '12cqw', height: '12cqw', transform: 'translate(-50%, -50%)', ...style }}
    >
      {/* EL — flexbox ile ortalanır (transform animasyona serbest kalsın),
          animate-surukle-el ile tut → kay → bırak → dön döngüsünü oynar. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="animate-surukle-el"
          style={{ width: '8cqw', height: '8cqw', filter: 'drop-shadow(0 0.5cqw 0.55cqw rgba(70,45,25,0.32))' }}
        >
          <ElGorseli />
        </div>
      </div>
    </div>
  )
}

/* Yumuşak, çocuk dostu "tutan" el — krem dolgu + gece (mor) ana hat.
   Parmaklar nesnenin üstüne KIVRILMIŞ (tutma/kavrama pozu): el sırtı üstte,
   dört parmak alt kenarda nesneyi sarar gibi, başparmak solda içe kıvrık.
   Sahne paletiyle (krem/gece) uyumlu; küçük ve sade durur. */
function ElGorseli() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <g fill="#fff6e9" stroke="#6d5c93" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        {/* başparmak — solda, içe kıvrık */}
        <path d="M18 33 q-9 -1 -10 7 q-1 7 7 8 q5 0 6 -5 z" />
        {/* el sırtı (üst, yuvarlak) + dört kıvrık parmak (alt kenar tutar gibi) */}
        <path d="M14 30 C14 17 24 15 32 15 C40 15 50 17 50 30 C50 34 49 37 46 39 C45 45 41 46 39 40 C37 46 33 47 31 40 C29 46 25 46 23 39 C21 45 17 44 16 38 C15 35 14 33 14 30 Z" />
        {/* parmak boğum çizgileri (parmakları belirginleştirir) */}
        <g stroke="#6d5c93" strokeWidth="1.5" fill="none" opacity="0.5">
          <path d="M23 33 v6" />
          <path d="M31 33 v7" />
          <path d="M39 33 v6" />
        </g>
      </g>
    </svg>
  )
}

export default SurukleIpucu
