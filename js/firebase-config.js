/**
 * Firebase 設定 — GPS Field Game 2
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-5_OfWKLZw2BgUC62llh68tVCTdaSSUM",
  authDomain: "gps-field-game-2.firebaseapp.com",
  projectId: "gps-field-game-2",
  storageBucket: "gps-field-game-2.firebasestorage.app",
  messagingSenderId: "703088590407",
  appId: "1:703088590407:web:6de472d78ac8878fdcfb62"
};

/** 可選：限制老師 Google 登入的電郵網域（空字串 = 任何 Gmail / Google 帳號） */
window.ALLOWED_TEACHER_DOMAIN = ""; // 例如 "caritasfsc.edu.hk"

window.isFirebaseConfigured = function () {
  const c = window.FIREBASE_CONFIG || {};
  return !!(c.apiKey && !String(c.apiKey).startsWith("YOUR_") &&
            c.projectId && !String(c.projectId).startsWith("YOUR_"));
};
