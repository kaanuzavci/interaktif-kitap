/**
 * FIREBASE - HENÜZ KURULU DEĞİL (bilinçli olarak)
 *
 * Bu dosya, ileride eklenecek Firebase entegrasyonu için ayrılmış yer.
 * Kurulum zamanı gelince yapılacaklar:
 *
 *  1. Paketi yükle:
 *       npm install firebase
 *
 *  2. Firebase Console'dan (console.firebase.google.com) proje oluştur,
 *     web uygulaması ekle ve config bilgilerini al.
 *
 *  3. Config'i .env dosyasına koy (API anahtarları koda yazılmaz!):
 *       VITE_FIREBASE_API_KEY=...
 *       VITE_FIREBASE_PROJECT_ID=...
 *     (.env zaten .gitignore'da, GitHub'a gitmez)
 *
 *  4. Bu dosyada initialize et ve dışarı aç:
 *       import { initializeApp } from 'firebase/app'
 *       import { getAuth } from 'firebase/auth'
 *       import { getFirestore } from 'firebase/firestore'
 *
 *       const app = initializeApp({
 *         apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 *         ...
 *       })
 *       export const auth = getAuth(app)
 *       export const db = getFirestore(app)
 *
 * Planlanan kullanım alanları:
 *  - Kullanıcı kaydı / giriş (çocuğun profili)
 *  - İlerleme kaydetme: hangi bölüm, hangi sayfa
 *    (örn. src/hooks/useProgress.js diye bir hook yazılıp
 *     Book.jsx'teki currentPage değişince Firestore'a yazılabilir)
 */

// Şimdilik boş export - import edenler hata almasın diye.
export {}
