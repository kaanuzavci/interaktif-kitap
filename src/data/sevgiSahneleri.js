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
import arkaPlan0 from '../assets/backgrounds/sayfa0/arka_plan0.jpg'
import arkaPlan from '../assets/backgrounds/sayfa1/arka_plan.jpg'
import arkaPlan2 from '../assets/backgrounds/sayfa2/arka_plan2.jpg'
import arkaPlan3 from '../assets/backgrounds/sayfa3/arka_plan3.jpg'
// DİKKAT — SAYFA SIRASI DEĞİŞTİ: gökyüzü (güneş↔ay) sahnesi artık 4.,
// kır evi (uçurtma) sahnesi 5. sayfadır. Dosya/klasör adlarındaki
// "sayfa4/sayfa5" ve "SevgiSahne4/5" numaraları TARİHSELDİR (üretim
// sırası); kitaptaki gerçek sırayı AŞAĞIDAKİ DİZİNİN SIRASI belirler.
import arkaPlanKirEvi from '../assets/backgrounds/sayfa4/arka_plan4.jpg'
// Gökyüzü sahnesi TABAN: gündüz gökyüzü (gece gökyüzü + bulutlar SevgiSahne5 içinde).
import arkaPlanGokyuzu from '../assets/backgrounds/sayfa5/gündüz_gökyüzü.jpg'
import arkaPlanKir from '../assets/backgrounds/sayfa6/arka_plan6.jpg'
import arkaPlanOda from '../assets/backgrounds/sayfa8/arka_plan8.jpg'
import arkaPlanKurdele from '../assets/backgrounds/sayfa9/arka_plan9.jpg'
import arkaPlanDaire from '../assets/backgrounds/sayfa10/arka_plan10.jpg'
import arkaPlanMint from '../assets/backgrounds/sayfa11/arka_plan11.jpg'
import arkaPlan12 from '../assets/backgrounds/sayfa12/arka_plan12.jpg'

// SAYFA METİNLERİ (görsel olarak hazır) — her metin, yazısı DOĞRU KONUMDA
// gömülü tam 16:9 şeffaf PNG'dir; Sahne bunu arka planın üstüne bindirir.
// Klasörler KİTAP SIRASINA göre adlandırılmış (texts/sayfaN = kitabın N.
// sayfası), arka planların TARİHSEL numaralandırmasından bağımsız. Türkçe
// karakter/boşluk içeren dosya adlarında sorun olmaması için glob ile
// yükleniyor; sayfaNo → görsel eşlemesi metinBul() ile yapılır.
const METIN_GORSELLERI = import.meta.glob('../assets/texts/*/*.webp', {
  eager: true,
  import: 'default',
})
function metinBul(sayfaNo) {
  const anahtar = Object.keys(METIN_GORSELLERI).find((yol) =>
    yol.includes(`/sayfa${sayfaNo}/`),
  )
  return anahtar ? METIN_GORSELLERI[anahtar] : undefined
}

// Açılış (sayfa0) ve ilk sahne hemen yüklenir (kapaktan sonra ilk gösterilen).
import SevgiSahne0 from '../components/book/sahneler/SevgiSahne0.jsx'
import SevgiSahne1 from '../components/book/sahneler/SevgiSahne1.jsx'

// Sonraki sahneler LAZY — kullanıcı o sayfaya yaklaştığında yüklenir.
// Bu sayede sayfa 2/3/4'ün devasa sprite PNG'leri (cicek_animasyon ~3.9MB,
// duman_animasyon ~1.9MB, cicek_uzgun ~3.8MB, isil_ucurtma ~2.6MB vb.)
// uygulama başlangıcında yüklenmez → başlangıç yükü ~83MB → ~15MB.
const SevgiSahne2 = lazy(() => import('../components/book/sahneler/SevgiSahne2.jsx'))
const SevgiSahne3 = lazy(() => import('../components/book/sahneler/SevgiSahne3.jsx'))
const SevgiSahne4 = lazy(() => import('../components/book/sahneler/SevgiSahne4.jsx'))
const SevgiSahne5 = lazy(() => import('../components/book/sahneler/SevgiSahne5.jsx'))
const SevgiSahne6 = lazy(() => import('../components/book/sahneler/SevgiSahne6.jsx'))
const SevgiSahne8 = lazy(() => import('../components/book/sahneler/SevgiSahne8.jsx'))
const SevgiSahne9 = lazy(() => import('../components/book/sahneler/SevgiSahne9.jsx'))
const SevgiSahne10 = lazy(() => import('../components/book/sahneler/SevgiSahne10.jsx'))
const SevgiSahne11 = lazy(() => import('../components/book/sahneler/SevgiSahne11.jsx'))
const SevgiSahne12 = lazy(() => import('../components/book/sahneler/SevgiSahne12.jsx'))

export const SEVGI_SAHNELERI = [
  // --- 0. SAHNE (AÇILIŞ / sayfa0) ---
  // Kapaktan sonra gelen giriş sayfası. Kitap açık gibi iki yarıya bölünür;
  // SOL yarı boş (arka_plan0 kremi), TÜM içerik SAĞ sayfada. Dokun→yazı düş→
  // Işıl peek-a-boo (sol1/sag2/sol3/sag4)→Işıl büstü konuşur. Tüm koreografi
  // SevgiSahne0 bileşeninde; sesi (sounds/sayfa0/1.mp3) bileşen kendi çalar
  // (bu yüzden useSahneSesi index 0'ı otomatik çalmaz).
  {
    id: 'sevgi-00',
    arkaplan: arkaPlan0,
    icerikBileseni: SevgiSahne0,
    katmanlar: [],
  },

  {
    id: 'sevgi-01',
    metinGorseli: metinBul(1),
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
    metinGorseli: metinBul(2),
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
    metinGorseli: metinBul(3),
    arkaplan: arkaPlan3,
    icerikBileseni: SevgiSahne3,
    katmanlar: [],
  },

  // --- 4. SAHNE (GÖKYÜZÜ: güneş ↔ ay döngüsü) ---
  // (Eski 5. sahneydi; kitap sırası düzeltildi. Bileşen/varlık adlarındaki
  // "5" üretim numarasıdır.) TABAN arka plan gündüz gökyüzüdür; gece
  // gökyüzü + gündüz/gece bulutları + güneş/ay kareleri SevgiSahne5 içinde
  // crossfade ile yönetilir. Güneşe dokununca batar→ay gelir→zzz; aya
  // dokununca ay gider→güneş döner (döngü).
  {
    id: 'sevgi-04',
    metinGorseli: metinBul(4),
    // Gökyüzü sayfası: metin güneşle çakışmasın diye biraz yukarı.
    // Negatif = yukarı, pozitif = aşağı (sahne yüksekliğinin %'si).
    metinKaydir: '-1.5%',
    arkaplan: arkaPlanGokyuzu,
    icerikBileseni: SevgiSahne5,
    katmanlar: [],
  },

  // --- 5. SAHNE (KIR EVİ: pencerede Işıl + üzgün çiçek + sürüklenen uçurtma) ---
  // (Eski 4. sahneydi.) Arka plan (arka_plan4: kır + ev + pencere boşluğu +
  // çiçekler) üzerine:
  //   - Işıl (isil_ucurtma)   : pencerede; dokununca gülümseme/konuşma döngüsü
  //   - pencere.png           : statik kasa+saksı; Işıl'ın önünde
  //   - çiçek (cicek_uzgun)   : sol alt; dokununca üzgün göz kırpma döngüsü
  //   - uçurtma (ucurtma.png) : gökyüzü; SÜRÜKLENEBİLİR (sayfa3 mantığı)
  // Tüm etkileşim kendine özgü olduğu için SevgiSahne4 bileşeninde.
  {
    id: 'sevgi-05',
    metinGorseli: metinBul(5),
    arkaplan: arkaPlanKirEvi,
    icerikBileseni: SevgiSahne4,
    katmanlar: [],
  },

  // --- 6. SAHNE (KIR: Işıl uçurtma uçuruyor) ---
  // Arka plan (arka_plan6: ağaçlar + çayır + bulutlu gökyüzü) üzerine:
  //   - Işıl (syf6/isil, 8 kare)       : sağda ipi tutuyor; dokununca döngü
  //   - uçurtma (syf6/ucurtma, 11 kare): gökyüzünde; dokununca döngü
  // Kareler tam-tuval gömülü (4096→1920 indirgendi); SevgiSahne6 bileşeninde.
  {
    id: 'sevgi-06',
    metinGorseli: metinBul(6),
    arkaplan: arkaPlanKir,
    icerikBileseni: SevgiSahne6,
    katmanlar: [],
  },

  // --- 7. SAHNE — 4. sayfanın (gökyüzü: güneş ↔ ay döngüsü) AYNISI ---
  // İstek gereği 7. sayfa, kitaptaki 4. sayfayla birebir aynıdır: aynı arka
  // plan + aynı içerik bileşeni. Ekstra dosya/varlık gerekmez; BookReader her
  // sayfayı kendi key'iyle sıfırdan kurduğundan iki kopya birbirinden bağımsız
  // çalışır (7. sayfada döngü yine güneşle başlar).
  {
    id: 'sevgi-07',
    metinGorseli: metinBul(7),
    // 4. sayfayla aynı gökyüzü sahnesi → aynı metin kaydırması.
    metinKaydir: '-1.5%',
    arkaplan: arkaPlanGokyuzu,
    icerikBileseni: SevgiSahne5,
    katmanlar: [],
  },

  // --- 8. SAHNE (ODA: üzgün çiçek + çiçeğe konan kelebek) ---
  // Arka plan (arka_plan8: oda) üzerine:
  //   - isil1/isil2 (statik)             : yürüyen Işıl + yakın plan Işıl
  //   - çiçek (syf8/cicek, 48 kare)      : dokununca üzgün göz kırpma döngüsü
  //   - kelebek (syf8/kelebek1+2, canvas): İLK dokunuşta kelebek1 TEK SEFER
  //     uçar (Işıl'ın önünden çiçeğin üstüne konar; tekrar etmez), ardından
  //     konduğu yerde kelebek2 SONSUZ döngüye girer.
  // Tüm etkileşim kendine özgü olduğu için SevgiSahne8 bileşeninde.
  {
    id: 'sevgi-08',
    metinGorseli: metinBul(8),
    arkaplan: arkaPlanOda,
    icerikBileseni: SevgiSahne8,
    katmanlar: [],
  },

  // --- 9. SAHNE (Işıl üzgün çiçekle konuşuyor) ---
  // Arka plan (arka_plan9: krem + pembe dalga + kurdele/kalp) üzerine:
  //   - Işıl (syf9/isil, 12 kare)  : solda büst; dokununca konuşma döngüsü
  //   - çiçek (syf9/cicek, 75 kare): sağda saksılı; dokununca dertlenme döngüsü
  // Her ikisi KonumluSprite (kareler kırpık); SevgiSahne9 bileşeninde.
  {
    id: 'sevgi-09',
    metinGorseli: metinBul(9),
    arkaplan: arkaPlanKurdele,
    icerikBileseni: SevgiSahne9,
    katmanlar: [],
  },

  // --- 10. SAHNE (Işıl portresi — kapanış) ---
  // Arka plan (arka_plan10: sarı fon + turuncu daire) üzerine tek öğe:
  //   - Işıl (syf10/isil, 6 kare): dairenin ortasında büst; dokununca
  //     gülümseme döngüsü. SevgiSahne10 bileşeninde.
  {
    id: 'sevgi-10',
    metinGorseli: metinBul(10),
    arkaplan: arkaPlanDaire,
    icerikBileseni: SevgiSahne10,
    katmanlar: [],
  },

  // --- 11. SAHNE (OYUN: çiçeği sula, canlandır!) ---
  // Arka plan (arka_plan11: mint sulu boya) üzerine: solda solgun çiçek
  // (5 aşama görseli), sağda su kabı (12 kare uçuş) + su (16 kare dökme),
  // sağ üstte 3 yıldız yuvası, finalde rozet + konfeti. Su kabına her
  // dokunuşta kap uçup çiçeği sular → çiçek 1 aşama canlanır + 1 yıldız;
  // 3 sulamadan sonra çiçek gülümser, rozet pop'lar, konfeti patlar.
  // Tüm koreografi SevgiSahne11 bileşeninde.
  {
    id: 'sevgi-11',
    arkaplan: arkaPlanMint,
    icerikBileseni: SevgiSahne11,
    katmanlar: [],
  },

  // --- 12. SAHNE (KAPANIŞ: solda mutlu/konuşan çiçek) ---
  // Arka plan (arka_plan12: solda sarı daire + sağda mint) üzerine:
  //   - çiçek (syf12/cicek, 73 kare, tam-16:9 gömülü): SOLDA saksılı; dokununca
  //     gülümseme/konuşma döngüsüne girer. Kareler tam-tuval → olcek/x/y gerekmez.
  {
    id: 'sevgi-12',
    metinGorseli: metinBul(12),
    arkaplan: arkaPlan12,
    icerikBileseni: SevgiSahne12,
    katmanlar: [],
  },
]

export default SEVGI_SAHNELERI
