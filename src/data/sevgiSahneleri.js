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

import { lazy } from 'react'

// Arka planlar artık SAYFA bazlı klasörlerde (backgrounds/sayfa1, /sayfa2,
// /sayfa3) — her sayfanın görselleri karışmasın diye ayrıldı. Eksik parçalar
// (çimen, kalemler, raf vb.) ilgili Sahne bileşeninde katman olarak eklenir.
import arkaPlan from '../assets/backgrounds/sayfa1/arka_plan.jpg'
import arkaPlan2 from '../assets/backgrounds/sayfa2/arka_plan2.jpg'
import arkaPlan3 from '../assets/backgrounds/sayfa3/arka_plan3.jpg'
import arkaPlan4 from '../assets/backgrounds/sayfa4/arka_plan4.jpg'

// İlk sahne hemen yüklenir (kullanıcı her zaman buradan başlar).
import SevgiSahne1 from '../components/book/sahneler/SevgiSahne1.jsx'

// Sonraki sahneler LAZY — kullanıcı o sayfaya yaklaştığında yüklenir.
// Bu sayede sayfa 2/3/4'ün devasa sprite PNG'leri (cicek_animasyon ~3.9MB,
// duman_animasyon ~1.9MB, cicek_uzgun ~3.8MB, isil_ucurtma ~2.6MB vb.)
// uygulama başlangıcında yüklenmez → başlangıç yükü ~83MB → ~15MB.
const SevgiSahne2 = lazy(() => import('../components/book/sahneler/SevgiSahne2.jsx'))
const SevgiSahne3 = lazy(() => import('../components/book/sahneler/SevgiSahne3.jsx'))
const SevgiSahne4 = lazy(() => import('../components/book/sahneler/SevgiSahne4.jsx'))

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

  // --- 3. SAHNE (MUTFAK: Işıl'ı keke götür → pastadan duman çıkar) ---
  // Arka plan (arka_plan3: mutfak + masa + kek) üzerine:
  //   - kek rafı (TiklanirGorsel)  : GİZLİ, dokununca belirir (sayfa2 mantığı)
  //   - Işıl (isil.png)            : TUTULUP keke SÜRÜKLENİR
  //   - duman (duman_animasyon)    : Işıl keke varınca pastadan tüter
  // Tüm etkileşim kendine özgü olduğu için SevgiSahne3 bileşeninde.
  {
    id: 'sevgi-03',
    arkaplan: arkaPlan3,
    icerikBileseni: SevgiSahne3,
    katmanlar: [],
  },

  // --- 4. SAHNE (KIR EVİ: pencerede Işıl + üzgün çiçek + sürüklenen uçurtma) ---
  // Arka plan (arka_plan4: kır + ev + pencere boşluğu + çiçekler) üzerine:
  //   - Işıl (isil_ucurtma)   : pencerede; dokununca gülümseme/konuşma döngüsü
  //   - pencere.png           : statik kasa+saksı; Işıl'ın önünde
  //   - çiçek (cicek_uzgun)   : sol alt; dokununca üzgün göz kırpma döngüsü
  //   - uçurtma (ucurtma.png) : gökyüzü; SÜRÜKLENEBİLİR (sayfa3 mantığı)
  // Tüm etkileşim kendine özgü olduğu için SevgiSahne4 bileşeninde.
  {
    id: 'sevgi-04',
    arkaplan: arkaPlan4,
    icerikBileseni: SevgiSahne4,
    katmanlar: [],
  },
]

export default SEVGI_SAHNELERI
