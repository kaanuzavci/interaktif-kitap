/* ===============================================================
   KİTAPLIK — KİTAP LİSTESİ

   Giriş ekranındaki raf bu diziden oluşur. Yeni kitap eklemek için
   bir nesne ekle; kapak otomatik üretilir.

   Alanlar:
   - id       : benzersiz kimlik (App hangi kitabın açılacağını bilir)
   - ad       : kapaktaki isim
   - alt      : kapağın altındaki kısa tanıtım
   - ikon     : kapaktaki temsili emoji
   - renk     : kapağın aksan rengi (index.css @theme renk adı)
   - durum    : 'aktif'  -> okunabilir
                'yakinda'-> kilitli, "Yakında" rozeti
   - sahneler : (yalnızca aktif kitaplarda) okunacak sahnelerin dizisi
=============================================================== */

import { SEVGI_SAHNELERI } from './sevgiSahneleri.js'

export const KITAPLAR = [
  {
    id: 'sevgi',
    ad: 'Sevgi',
    alt: 'Işıl ve Canım',
    ikon: '💝',
    renk: 'seker',
    durum: 'aktif',
    sahneler: SEVGI_SAHNELERI,
  },
  {
    id: 'durustluk',
    ad: 'Dürüstlük',
    alt: 'Doğruyu söylemek',
    ikon: '🌟',
    renk: 'gunes',
    durum: 'yakinda',
  },
  {
    id: 'paylasmak',
    ad: 'Paylaşmak',
    alt: 'Birlikte daha güzel',
    ikon: '🤝',
    renk: 'cimen',
    durum: 'yakinda',
  },
  {
    id: 'saygi',
    ad: 'Saygı',
    alt: 'Herkese nazik ol',
    ikon: '🌸',
    renk: 'gokyuzu',
    durum: 'yakinda',
  },
]

// Id'den kitabı bulan küçük yardımcı (App ve BookReader kullanır)
export function kitapBul(id) {
  return KITAPLAR.find((k) => k.id === id) || null
}

export default KITAPLAR
