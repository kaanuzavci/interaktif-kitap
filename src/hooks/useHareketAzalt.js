import { useEffect, useState } from 'react'

/* ===============================================================
   useHareketAzalt — işletim sistemi "hareketi azalt" tercihi

   Kullanıcı cihaz ayarlarında "reduce motion" açtıysa true döner.
   App, bunu kullanıcının uygulama içi "Hareketleri azalt"
   anahtarıyla BİRLEŞTİRİR (ikisinden biri açıksa animasyonlar
   sadeleşir). Erişilebilirlik tabanının parçası.
=============================================================== */
export function useHareketAzalt() {
  const [azalt, setAzalt] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const dinle = (e) => setAzalt(e.matches)
    mq.addEventListener('change', dinle)
    return () => mq.removeEventListener('change', dinle)
  }, [])

  return azalt
}

export default useHareketAzalt
