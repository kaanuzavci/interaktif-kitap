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
import arkaPlan2 from '../assets/backgrounds/arka_plan2.jpg'
import SevgiSahne1 from '../components/book/sahneler/SevgiSahne1.jsx'
import SevgiSahne2 from '../components/book/sahneler/SevgiSahne2.jsx'

export const SEVGI_SAHNELERI = [
  {
    id: 'sevgi-01',
    arkaplan: arkaPlan,
    // NOT: Sayfa metinleri (başlık + anlatı) şimdilik kaldırıldı; yazılar
    // sonradan eklenecek. (baslik/metin verilince Sahne otomatik gösterir.)
    // Bu sahnenin etkileşimi kendine özgü olduğu için özel bir
    // bileşenle çiziliyor (çimen + tavşan + uğurböceği + Işıl + Canım).
    icerikBileseni: SevgiSahne1,
    katmanlar: [],
  },

  // --- 2. SAHNE (ODA: Işıl çiçeği uzatıyor + Canım) ---
  // Arka plan görseli (arka_plan2: oda + pencere + masa) üzerine
  // kalemler + Işıl (8 kare) + Canım (60 kare) katmanları, kendine özgü
  // bir içerik bileşeniyle (SevgiSahne2) yerleştirilir.
  {
    id: 'sevgi-02',
    arkaplan: arkaPlan2,
    icerikBileseni: SevgiSahne2,
    katmanlar: [],
  },
]

export default SEVGI_SAHNELERI
