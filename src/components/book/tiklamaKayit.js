import { createContext } from 'react'

/* ===============================================================
   TIKLAMA KAYIT (registry) — piksel-hassas tıklama yönlendirmesi

   SORUN: Tıklanabilir sprite'lar (kütük, uğurböceği) sayfa-çevirme
   sürükleme bölgeleriyle (BookReader) ve birbirleriyle aynı alanda
   üst üste gelebiliyor. Ayrı ayrı <button> hotspot'lar hem taşıyor
   hem de sürükleme bölgesinin altında kaldığı için bazı yerlerde
   tıklama hiç algılanmıyordu.

   ÇÖZÜM: Her TiklamaliSprite kendini bu kayıt defterine yazar
   (hitTest + oynat + zIndex). BookReader, KİTAP YÜZEYİNE gelen her
   pointerdown'ı (capture aşamasında) yakalar; üstten alta sprite'ları
   alfa-kanalına göre dener. Bir sprite'ın GÖRÜNEN pikseline isabet
   varsa onu oynatır ve olayı durdurur (sürükleme başlamaz). İsabet
   yoksa olay normal akışına devam eder (sayfa çevrilir, çiçeğe
   dokunulur). Böylece tıklama yalnızca sprite'ın gerçek görünen
   kısmında çalışır ve hiçbir bölge çakışması kalmaz.

   Değer: { ekle(id, api), cikar(id) } | null
   api  : { canli(): bool, zIndex: number, hitTest(x,y): bool, oynat() }
=============================================================== */
export const TiklamaKayitContext = createContext(null)

export default TiklamaKayitContext
