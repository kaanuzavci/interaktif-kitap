/* ===============================================================
   SEVGİ KİTABI — SAHNELER (veri-odaklı içerik)

   Kitap, sahnelerin sıralı bir dizisidir. Her sahne, açık kitabın
   İKİ sayfasına birden yayılan tek bir 16:9 sahnedir (arka plan +
   üzerine binen katmanlar + bir hikaye metni).

   YENİ SAHNE EKLEMEK çok kolay: bu diziye bir nesne ekle. Çoğu sahne
   yalnızca `katmanlar` dizisini kullanır (Sahne.jsx bunları çizer):

     {
       id: 'sevgi-02',
       arkaplan: importEdilmisGorsel,
       baslik: '',                 // opsiyonel — sayfa üst başlığı
       metin: 'Hikaye cümlesi...',  // sayfada görünen anlatı kutusu
       metinKonum: 'alt',          // 'alt' | 'alt-sol' | 'alt-sag' | 'ust'
       katmanlar: [
         { tip: 'emoji', icerik: '🦋', x: '20%', y: '40%', boyut: '3rem', animasyon: 'yuzen' },
         { tip: 'dokunmatik', x: '70%', y: '15%', boyut: '5rem', icerik: '🐰', etki: 'zipla' },
       ],
     }

   Karmaşık, kendine özgü etkileşimi olan sahneler (ör. 1. sahnedeki
   Işıl yürüyüşü) bunun yerine bir `icerikBileseni` verir; o React
   bileşeni etkileşimi kendi içinde yönetir.

   Katman tipleri (Sahne.jsx içinde işlenir):
   - 'emoji'      : konumlu emoji/sembol (opsiyonel `animasyon` sınıfı)
   - 'gorsel'     : konumlu <img> (`kaynak` = import edilmiş url)
   - 'dokunmatik' : dokununca kısa bir tepki veren öğe (`etki`: 'parla'|'zipla'|'sallan')
=============================================================== */

// Yeni TABAN arka plan (çimensiz bölge + tavşan/uğurböceği yok); eksik
// parçalar SevgiSahne1 içinde katman/sprite olarak ekleniyor.
import arkaPlan from '../assets/backgrounds/arka_plan.jpg'
import SevgiSahne1 from '../components/book/sahneler/SevgiSahne1.jsx'

export const SEVGI_SAHNELERI = [
  {
    id: 'sevgi-01',
    arkaplan: arkaPlan,
    baslik: 'Sevgi 💝',
    metin:
      'Işıl, bahçesindeki konuşan çiçeği Canım’la her sabah selamlaşırdı.',
    // Üstteki boş gökyüzüne yaz (alt taraf kütük/çimen/çiçeklerle dolu)
    metinKonum: 'ust',
    // Bu sahnenin etkileşimi kendine özgü olduğu için özel bir
    // bileşenle çiziliyor (çimen + tavşan + uğurböceği + Işıl + Canım).
    icerikBileseni: SevgiSahne1,
    katmanlar: [],
  },

  // --- 2. SAHNE (GEÇİCİ / DEMO) ---
  // Bu sahnenin iki amacı var:
  //  1. Sayfa çevirme etkileşimi tek sahneyle denenemez; bu ikinci sahne
  //     çevirmeyi (ve sesi) görünür kılar.
  //  2. Arka plan GÖRSELİ olmadan, yalnızca `katmanlar` ile kurulan
  //     veri-odaklı sahne yolunu örnekler. Gerçek 2. sahne görseli
  //     gelince bu nesne onunla değiştirilebilir.
  {
    id: 'sevgi-02',
    // arkaplan yok → Sahne yumuşak bir degrade çizer
    arkaplanDegrade: 'linear-gradient(to bottom, #ffe3ee 0%, #fff1dd 55%, #fff6e9 100%)',
    baslik: 'Devam edecek…',
    metin: 'Işıl’ın hikâyesi büyüyor. Yeni sahneler çok yakında! 🌼',
    metinKonum: 'alt',
    katmanlar: [
      { tip: 'emoji', icerik: '🌸', x: '30%', y: '55%', boyut: 'clamp(2rem,7vw,5rem)', animasyon: 'sallan' },
      { tip: 'emoji', icerik: '🦋', x: '68%', y: '62%', boyut: 'clamp(1.5rem,5vw,3.5rem)', animasyon: 'yuzen' },
      { tip: 'emoji', icerik: '✨', x: '50%', y: '74%', boyut: 'clamp(1.2rem,4vw,2.5rem)', animasyon: 'parilti' },
      { tip: 'dokunmatik', ad: 'Tavşan', icerik: '🐰', x: '50%', y: '30%', boyut: 'clamp(2.5rem,9vw,6rem)', etki: 'zipla' },
    ],
  },
]

export default SEVGI_SAHNELERI
