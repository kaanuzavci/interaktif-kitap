# İnteraktif Kitap — Geliştirme Planı ve Mimari Yeniden Yapılandırma

> Bu dosya Claude Code için bir çalışma planıdır. Aşağıdaki tüm bölümleri dikkatle
> oku, mevcut kodu incele, sonra adım adım uygula. Bir bölümü bitirmeden diğerine
> geçme. Belirsiz bir nokta olursa varsayımını açıkça belirt ve devam et.

---

## 0. Proje Bağlamı

Bu proje, 3–6 yaş arası çocuklara **değerler eğitimi** veren web tabanlı bir
**interaktif kitap** uygulamasıdır. İlk bölüm "Sevgi" temalıdır; ana karakter
**Işıl** ve onun konuşan çiçeği **Canım**'dır. İlerleyen dönemde yeni bölümler
(Dürüstlük, Paylaşmak, Saygı vb.) eklenecektir.

**Teknoloji yığını (mevcut, değişmeyecek):**
- React 19 + Vite 8
- Tailwind CSS v4 (config dosyası yok; tema `src/index.css` içindeki `@theme` bloğunda)
- lottie-react, howler, canvas-confetti
- Firebase (henüz aktif değil, ileride kullanıcı kaydı + ilerleme için)

**Görsel varlıklar:**
- Arka planlar: `1920x1080` oranında (örn. `src/assets/backgrounds/sahne1-arkaplan.jpg`)
- Karakter animasyonları: şeffaf PNG kare dizileri (örn. `src/assets/characters/isil-yurume/isil_pose_01.png` … `isil_pose_08.png`), `import.meta.glob` ile otomatik toplanıyor

---

## 1. Bu Planın Amacı (Genel Değişiklikler)

Şu anki yapı: doğrudan tek bir sahne (Page1) açılıyor, sağda bir "ileri" oku ile
sayfa geçiliyor. Bu yapıyı **kökten değiştiriyoruz**. Yeni yapı üç ana katmandan
oluşacak:

1. **Yükleme Ekranı (Loading)** — Işıl'ın yürüme animasyonu loop halinde oynar.
2. **Giriş Ekranı (Kitaplık / Home)** — 4 kitap raf üzerinde durur; biri açık, üçü "yakında".
3. **Kitap Görünümü (Book Reader)** — Seçilen kitap ortaya gelip açılır; gerçek
   bir kitap gibi iki sayfalı, sayfa çevirme efektli, sürükleyerek çevrilen yapı.

Aşağıda her katman tek tek, teknik detayıyla anlatılıyor.

---

## 2. Yükleme Ekranı (Loading Screen)

**Amaç:** Site ilk açıldığında ve ağır varlıklar (arka planlar, kare dizileri,
sesler) yüklenirken klasik bir spinner yerine **Işıl'ın yürüyüş animasyonu**
gösterilecek.

**Gereksinimler:**
- Yeni component: `src/components/screens/LoadingScreen.jsx`
- Işıl'ın yürüme kareleri (`isil-yurume` klasöründeki PNG'ler) **loop** halinde,
  yerinde yürüyormuş gibi oynatılsın (mevcut yürüme animasyon mantığını kullan).
- Karakterin altında veya yanında ince, sıcak bir ilerleme göstergesi olsun:
  - "Yükleniyor…" yerine çocuk dostu bir ifade: örn. **"Işıl hazırlanıyor…"**
  - Altında yumuşak, yuvarlak köşeli, dolan bir progress bar (gerçek yükleme
    yüzdesiyle bağlı olması ideal; mümkün değilse sahte ama akıcı bir dolum).
- Arka plan: giriş ekranıyla aynı atmosferde (pastel gökyüzü), sade.
- Gerçek varlık ön-yükleme (preload) mantığı kur: kritik görseller (giriş ekranı
  görselleri + ilk bölümün ilk sahne arka planı) yüklenene kadar bu ekran kalsın,
  yüklenince yumuşak bir geçişle (fade) giriş ekranına devret.
- `prefers-reduced-motion` açıksa yürüme animasyonunu durdur, ilk kareyi statik göster.

---

## 3. Giriş Ekranı (Kitaplık / Home Screen)

**Amaç:** Çocuğun/ebeveynin kitap seçtiği ana ekran. Bir **kitaplık / raf** hissi
versin. 4 kitap görünür: 1'i aktif (şu an geliştirdiğimiz "Sevgi" kitabı), 3'ü
kilitli ve "Yakında" etiketli.

**Mevcut HomeScreen varsa onu bu tarife göre yeniden yaz; yoksa oluştur:**
`src/components/screens/HomeScreen.jsx`

**Tasarım yönü (önemli — frontend-design ilkelerini uygula):**
- Görsel dil mevcut "Sevgi" bölümüyle tutarlı olmalı: yumuşak, pastel, el çizimi
  masalsı atmosfer; yuvarlak köşeler; `index.css` `@theme` renkleri.
- **Şablon görünümünden kaçın.** "Krem arka plan + serif başlık + terracotta vurgu"
  gibi tipik yapay-zekâ-tasarımı klişelerine düşme. Bu bir çocuk kitaplığı; sıcak,
  oyuncaklı, ahşap raf / büyülü bahçe hissi taşımalı. Bir tane akılda kalıcı
  "imza" öğe belirle (örn. rafın üstünde hafifçe sallanan bir fener, süzülen
  parçacıklar, ya da kitapların üzerinde nazikçe parlayan bir ışık) ve gerisini
  sakin tut.
- Tipografi: başlık için karakterli, yuvarlak hatlı, çocuk dostu bir display font;
  gövde için okunaklı bir font. Aynı fontu her yere koyma; ölçek ve ağırlıkları bilinçli seç.

**Kitap kartları:**
- 4 kitap bir raf/grid üzerinde dizilsin (geniş ekranda yan yana, dar ekranda sarmalı).
- Her kitap bir **kapak** olarak görünsün (dik duran kitap sırtı/kapağı hissi).
- Kitap verisi component başında bir dizi olarak tutulsun ki yeni kitap eklemek kolay olsun:
  ```js
  const kitaplar = [
    { id: 'sevgi', ad: 'Sevgi', durum: 'aktif', kapak: ..., renk: ... },
    { id: 'durustluk', ad: 'Dürüstlük', durum: 'yakinda' },
    { id: 'paylasmak', ad: 'Paylaşmak', durum: 'yakinda' },
    { id: 'saygi', ad: 'Saygı', durum: 'yakinda' },
  ];
  ```
- **Aktif kitap:** Renkli, canlı, hover'da hafifçe yukarı kalkan/parlayan; tıklanabilir.
- **Yakında kitaplar:** Soluk/gri tonlu, üzerinde küçük bir kilit ikonu ve "Yakında"
  rozeti; tıklanınca yumuşak bir "Çok yakında!" geri bildirimi (sallanma veya küçük
  bir baloncuk) versin ama kitabı açmasın.

**Ayarlar:**
- Giriş ekranında bir **ayarlar** alanı olsun (köşede bir dişli ikonu → açılan panel):
  - Ses aç/kapat (mevcut SoundToggle mantığı)
  - Müzik seviyesi (varsa)
  - (İleride) ebeveyn/profil alanı için yer bırak — şimdilik placeholder.

**Kitap seçim animasyonu (kritik):**
- Aktif kitaba tıklanınca: seçilen kitap **yavaşça ekranın ortasına doğru gelir**
  (diğerleri soluklaşıp arkada kalır), ortaya geldiğinde **kapağı açılır** ve
  kitap görünümüne (Book Reader) geçilir. Bu geçiş akıcı ve "büyülü" hissettirmeli;
  ani sahne değişimi olmamalı. (Framer-motion benzeri bir geçiş; ekstra paket
  kurmadan CSS transition/transform ile de yapılabilir — hangisi daha temizse onu seç,
  ama gereksiz paket ekleme.)

---

## 4. Kitap Görünümü (Book Reader) — Projenin Kalbi

Bu, en kritik ve en dikkat gerektiren kısım. Hedef: ekranda **gerçek bir açık
kitap** gibi görünen, iki sayfalı, sayfaları sürükleyerek çevrilen bir okuyucu.

### 4.1. Sayfa Düzeni ve Arka Plan Yerleşimi

- Kitap, ekranda ortada, **iki sayfa yan yana** açık duracak (sol sayfa + sağ sayfa),
  ortada bir cilt/omurga (spine) çizgisi olacak.
- Bize verilen `1920x1080` arka plan görselleri **tek bir sahne** olarak çizilmiş.
  Bu görsel, açık kitabın **iki sayfasına eşit ve doğru şekilde** bölünerek yerleşmeli:
  - Görselin sol yarısı → sol sayfa, sağ yarısı → sağ sayfa.
  - Bölünme tam ortadan (960px hizasından) olmalı; iki yarı, cilt çizgisinde
    kusursuz birleşmeli (görsel kayması/kopması olmamalı).
  - Görsel oranı korunmalı; sayfa boyutuna `object-fit: cover` benzeri mantıkla,
    ama iki yarının ortada hizalı kalmasını garanti edecek şekilde yerleştir.
- Sahnedeki **karakterler ve animasyonlar** (örn. Işıl, Canım, tavşan, uğur böceği)
  bu arka planın üzerine, doğru konumda, ayrı katmanlar olarak gelecek. Bunlar
  sayfanın hangi yarısına denk geliyorsa o sayfayla birlikte hareket etmeli
  (sayfa çevrilirken sayfayla beraber dönmeli).

### 4.2. Kitap Hissi: Kavis ve Gölgelendirme (Kalite Bozulmadan)

- Sayfaların kitap hissi vermesi için **hafif kavis** ve **cilt gölgesi** olmalı:
  - Cilt (spine) bölgesinde içe doğru yumuşak bir gölge (sayfaların ortada
    kitaba doğru kıvrıldığı izlenimi).
  - Sayfa kenarlarında çok hafif bir eğrilik/gölge.
- **ÇOK ÖNEMLİ — kalite kaybı olmamalı:** Bu kavis efekti arka plan görselini
  deforme edip bulanıklaştırmamalı. Yaklaşım önerisi:
  - Arka plan görseli net ve düz kalsın; kavis/gölge hissi **üstüne bindirilen
    ayrı katmanlarla** verilsin (radial/linear gradient gölgeler, cilt gölgesi,
    kenar vinyet). Yani görseli büküp bozmak yerine, ışık-gölge ile kıvrım illüzyonu yarat.
  - Gerekirse çok hafif bir CSS `transform: perspective(...)` denenebilir ama
    metin/karakter netliğini bozarsa vazgeç. Önce gölge-tabanlı (non-destructive)
    yöntemi uygula ve ekran görüntüsüyle kaliteyi doğrula.

### 4.3. Sayfa Çevirme Etkileşimi

- **Sağdaki "ileri" oku KALDIRILACAK.** Sayfa geçişi artık kitabı çevirerek olacak.
- Kullanıcı bir sayfa köşesini/kenarını **tutup sürükleyerek** sayfayı çevirecek
  (mouse + dokunmatik desteği). Sürükleme bırakıldığında:
  - Yeterince çevrildiyse → sayfa tamamen dönsün (sonraki/önceki sahneye geç).
  - Yetersizse → sayfa geri yerine otursun.
- Çevirme sırasında sayfanın **arka yüzü** ve dönen kâğıdın gölgesi görünmeli
  (gerçekçi sayfa dönüşü). 3D `rotateY` + perspektif ile sayfa dönüşü uygula.
- Sayfa dönerken kalite korunmalı (dönüş anında görsel netliği kaybolmamalı).
- İleri ve geri (her iki yön) sürükleme desteklenmeli.
- Klavye erişilebilirliği: ok tuşlarıyla da sayfa geçişi mümkün olsun (erişilebilirlik için).
- `prefers-reduced-motion` açıksa dönüş animasyonu sadeleştirilsin (anında geçiş + kısa fade).

### 4.4. Sayfa Çevirme Sesi

- Her sayfa çevrildiğinde **kâğıt/kitap çevirme sesi** çalsın (Howler.js).
- Ses dosyası için `src/assets/sounds/sayfa-cevir.mp3` yolunu kullan; dosya
  henüz yoksa kodu bu yola bağla ve bir yorum bırak ("ses dosyası eklenecek").
- Ses, global ses aç/kapat ayarına bağlı olsun (kapalıysa çalmasın).

### 4.5. Bölüm İçi Navigasyon ve Çıkış

- Kitap görünümünde sol üstte küçük bir **"kitaplığa dön"** butonu (ev/kitap ikonu)
  olsun; basınca kitap kapanma animasyonuyla giriş ekranına dönsün.
- İsteğe bağlı: çok ince bir sayfa göstergesi ("3 / 14" gibi) köşede durabilir,
  ama kitap hissini bozmayacak kadar sade olmalı.

---

## 5. İçerik Mimarisi (Sayfalar / Sahneler)

- İlk bölüm ("Sevgi") yaklaşık **10–15 sayfa** olacak. Her sayfa bir **sahne**:
  bir arka plan + üzerinde karakterler/animasyonlar + bir metin kutusu + o sahneye
  özgü etkileşimler (dokununca zıplama, parlama vb.).
- Sahneleri **veri-odaklı** kur: her sahne bir nesne/obje olarak tanımlansın
  (arka plan yolu, metin, karakter katmanları ve konumları, etkileşimler).
  Böylece yeni sahne/sayfa eklemek bir diziye satır eklemek kadar kolay olsun.
  Örnek şema (uyarlayabilirsin):
  ```js
  {
    id: 'sevgi-01',
    arkaplan: '...jpg',
    metin: 'Işıl, bahçesindeki konuşan çiçeği Canım'la her sabah selamlaşırdı.',
    katmanlar: [
      { tip: 'animasyon', kaynak: 'isil-yurume', x: '...', y: '...', boyut: '...' },
      { tip: 'dokunmatik', ad: 'canim', x: '...', y: '...', etki: 'parla' },
    ],
  }
  ```
- Mevcut "Sevgi 1. sahne" içeriğini bu yeni veri yapısına taşı (boşa harcama,
  mevcut çalışan görseli koru).
- Bölüm yapısını da kitaplara bağla: `kitaplar` dizisindeki her aktif kitabın
  bir `sahneler` dizisi olsun.

---

## 6. Mimari ve Durum Yönetimi

- Üst seviye ekran durumu (`uiDurumu`): `'loading' | 'home' | 'book'`.
  - Açılış: `loading` → varlıklar hazır → `home`.
  - Kitap seçimi → kitap açılma animasyonu → `book`.
  - Kitaplığa dön → `home`.
- React Router KURMA — basit `useState` ile yönet.
- Kitap içindeyken aktif kitap id'si ve aktif sayfa index'i state'te tutulsun.
- (İleride) ilerleme kaydı için Firebase'e bağlanacak bir kanca (hook) yeri bırak,
  ama şimdilik bağlama — `src/services/firebase.js` taslağına dokunma.

---

## 7. Performans ve Kalite Kuralları

- **Görsel kalite önceliklidir:** sayfa kavisi, gölge ve dönüş efektleri arka plan
  ve karakter netliğini bozmamalı. Her büyük görsel değişiklikten sonra ekran
  görüntüsü alıp kaliteyi gözle doğrula.
- Ağır görseller için makul boyutlandırma yapılmış olmalı (mevcut `kucult-gorseller.ps1`
  mantığı korunur); ama kitap büyük ekranda açıkken bulanık görünmemeli — gerekirse
  arka planlar için yeterli çözünürlük tutulsun.
- Aynı anda çok sayıda ağır animasyon oynamasın; sahne dışı animasyonlar duraklatılsın.
- Hedef: orta seviye bir tablet/telefonda akıcı çalışsın.
- Yatay (landscape) zorunluluğu korunsun; dikey tutulunca mevcut "cihazını yan çevir"
  ekranı çıkmaya devam etsin.
- Erişilebilirlik tabanı: klavye ile sayfa çevirme, görünür odak (focus) halkaları,
  `prefers-reduced-motion` desteği.

---

## 8. Tasarım Becerileri (Skills) Hakkında — ÖNEMLİ

Bu projede kullanıcının (geliştiricinin) **tasarımsal Claude Code becerileri (skills)
mevcuttur.** Bu becerileri kullanmaktan **çekinme.** Özellikle giriş ekranı, kitaplık
tasarımı, kitap kapakları, sayfa kavisi/gölgelendirmesi ve genel görsel kimlik gibi
tasarım kalitesinin önemli olduğu yerlerde, ilgili tasarım becerilerini (örn.
frontend-design ve mevcut diğer tasarım skill'leri) **devreye almaktan kaçınma.**

- Zorunlu değil, ama **uygun ve faydalı olduğu her yerde** bu becerileri kullan.
- Tasarım kararlarını bu becerilerdeki ilkelere dayandır: şablon/jenerik görünümden
  kaçın, projeye özgü bir görsel kimlik kur, bir "imza" öğe belirle, gerisini sakin tut.
- Becerileri kullandığında hangi beceriyi neden devreye aldığını kısaca belirt.

---

## 9. Uygulama Sırası (Bu Sırayla İlerle)

1. **Mimari iskelet:** `uiDurumu` state'i ve üç ekran katmanı (`loading`/`home`/`book`)
   arasındaki geçişleri kur. Mevcut Book.jsx içeriğini bozmadan üstüne bu katmanı ekle.
2. **Loading ekranı:** Işıl yürüme loop'lu yükleme + varlık ön-yükleme + fade geçiş.
3. **Home (Kitaplık):** 4 kitaplı raf, aktif/yakında durumları, ayarlar paneli,
   kitap seçim → ortaya gelme → kapak açılma animasyonu. (Tasarım becerilerini kullan.)
4. **Book Reader — düzen:** İki sayfalı açık kitap, 1920x1080 arka planın iki yarıya
   doğru bölünmesi, cilt çizgisi, non-destructive kavis/gölge ile kitap hissi.
5. **Book Reader — etkileşim:** Sürükleyerek sayfa çevirme (mouse + dokunmatik),
   3D dönüş, geri/ileri, klavye desteği, reduced-motion.
6. **Ses:** Sayfa çevirme sesi (Howler), global ses ayarına bağlı.
7. **İçerik veri yapısı:** Sahneleri veri-odaklı hale getir, mevcut Sevgi 1. sahneyi taşı.
8. Her adımdan sonra `npm run dev` ile çalıştığını ve ekran görüntüsüyle kaliteyi doğrula.

---

## 10. Kod Kalitesi Beklentileri

- Tüm metinler **Türkçe**.
- Kod temiz, modüler ve **yorumlu** olsun (geliştirici React'te orta seviye;
  yapıyı okuyup anlayabilmeli).
- Yeni component'ler mantıklı klasörlere: `src/components/screens/`,
  `src/components/book/`, `src/components/ui/`.
- Gereksiz paket kurma; mevcut yığınla (React, Tailwind v4, lottie-react, howler,
  canvas-confetti) çöz. Yeni bir pakete gerçekten ihtiyaç varsa önce gerekçesini belirt.
- Git: anlamlı, küçük commit'ler; büyük binary dosyaları repoya gömme
  (mevcut `.gitignore` ve yedek mantığına uy).
