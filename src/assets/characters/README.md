# characters/ — KARAKTER sprite'ları (oyuncular)

Buraya yalnızca **bir karaktere/oyuncuya ait** kare (frame) dizileri girer.
Yani sahnede "rol oynayan" varlıklar: Işıl, Canım (çiçek), tavşan, uğurböceği…

Her alt klasör tek bir karakterin tek bir hareketidir ve `import.meta.glob`
ile sıralı olarak toplanır (dosya adları `*_pose_01.png`, `_02`… sıralı olmalı):

| Klasör                  | Kim / ne          | Nerede kullanılır            |
|-------------------------|-------------------|------------------------------|
| `isil-yurume/`          | Işıl yürüyüş      | Yükleme ekranı + 1. sahne    |
| `isil_cicegi_birak/`    | Işıl çiçeği uzatır| 2. sahne                     |
| `cicek_animasyon/`      | Canım (çiçek)     | 2. sahne                     |
| `tavsan-zipla/`         | Tavşan            | 1. sahne                     |
| `ugurbocegi-zipla/`     | Uğurböceği        | 1. sahne                     |

Not: Sayfa-3'teki Işıl tek bir poz (`backgrounds/sayfa3/isil.png`) olduğu için
kare dizisi değildir; sürüklenen tek görsel olarak arka plan klasöründe durur.

➡️ Karaktere ait OLMAYAN görsel efektler (duman, parıltı, konfeti kareleri vb.)
buraya değil, **`../animations/`** klasörüne girer.
