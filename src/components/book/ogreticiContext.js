import { createContext } from 'react'

/* ===============================================================
   ÖĞRETİCİ BAĞLAMI — sayfa0'daki "durdur/ses/tekrar" tanıtımı aktif mi?

   BookReader kendi yerel state'iyle bu değeri üretir ve Provider ile
   ağaca yayar; SevgiSahne0 useContext ile OKUR. Context değeri render
   sırasında ebeveynden çocuğa senkron aktığı için (global pub-sub'ın
   aksine) effect sıralaması yarışı YAŞANMAZ: sayfa0 daha ilk render'da
   doğru değeri görür → öğretici sürerken koreografi (animasyon1...) hiç
   başlamaz, sayfa boş kalır.

   Varsayılan false: BookReader dışında (ör. ?test/TestSayfasi önizleme)
   sayfa0 normal akışıyla — öğreticisiz — çalışır.
=============================================================== */
export const OgreticiContext = createContext(false)

export default OgreticiContext
