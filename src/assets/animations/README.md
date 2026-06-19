# animations/ — EFEKT animasyonları (karaktere ait olmayan)

Buraya **bir karaktere ait olmayan**, sahneye eklenen görsel efekt kare
dizileri girer: duman, buhar, parıltı, toz, konfeti vb. "Oyuncu" değil,
"efekt" olanlar.

| Klasör             | Ne                  | Nerede kullanılır                    |
|--------------------|---------------------|--------------------------------------|
| `duman_animasyon/` | Pastadan tüten duman | 3. sahne (Işıl keke varınca)         |

Kurallar:
- Kareler `import.meta.glob` ile sıralı toplanır → dosya adları sıralı olmalı
  (`duman_frame_01.png`, `_02`…).
- Tam 16:9 tuvale gömülü efektler (duman gibi) sahneye **tam-kaplama** olarak
  bindirilir; efekt zaten doğru konumdan (ör. kekin üstünden) başlar.
- Performans: kareler web için küçültülür (duman 4096px → 1280px). Orijinaller
  `asset-yedek/` altında (git'e girmez).

➡️ Bir KARAKTERE ait kare dizileri (Işıl, Canım, tavşan…) buraya değil,
**`../characters/`** klasörüne girer.
