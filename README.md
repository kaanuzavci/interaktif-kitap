# İnteraktif Kitap 📖

3-6 yaş arası çocuklar için değerler eğitimi veren interaktif web kitabı.
İlk bölüm: **Sevgi** — ana karakter **Işıl** ve konuşan çiçeği **Canım**.

## Çalıştırma

```bash
npm install     # bağımlılıkları yükle (ilk seferde)
npm run dev     # geliştirme sunucusu (http://localhost:5173)
npm run build   # yayın için derleme (dist/ klasörüne)
```

## Teknolojiler

| Paket | Ne için? |
|---|---|
| React + Vite | Uygulama iskeleti |
| Tailwind CSS v4 | Stiller (config dosyası yok, tema `src/index.css` içinde) |
| lottie-react | Karakter animasyonları (JSON) |
| Howler.js | Ses efektleri |
| canvas-confetti | Son sayfa konfeti |
| Firebase | *İleride:* kullanıcı + ilerleme kaydı (`src/services/firebase.js`) |

## Klasör Yapısı

```
src/
├── assets/
│   ├── backgrounds/   sahne arka planları (jpg/png)
│   ├── characters/    karakter Lottie JSON dosyaları
│   ├── animations/    diğer animasyonlar
│   └── sounds/        ses efektleri (mp3)
├── components/
│   ├── Book.jsx       sayfa geçişlerini yöneten ana component
│   ├── pages/         her kitap sayfası ayrı component (Page1, Page2...)
│   └── ui/            ortak butonlar (NavArrow, SoundToggle)
├── hooks/             ileride: useProgress, useSound
├── services/          ileride: firebase.js
├── App.jsx            en üst bileşen + dikey mod uyarısı
├── index.css          Tailwind + tema renkleri + animasyonlar
└── main.jsx           giriş noktası
```

## Notlar

- Kitap **yatay (landscape)** modda tasarlandı; telefon dik tutulursa
  "cihazını çevir" uyarısı çıkar.
- Yeni sayfa eklemek için: `pages/` içine component oluştur,
  `Book.jsx`'teki `pages` dizisine ekle. Oklar ve fade geçişi otomatik çalışır.
