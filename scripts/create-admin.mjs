/**
 * LIBRA AI - Təhlükəsiz Admin İstifadəçisi Yaratma Skripti
 * 
 * İstifadə qaydası:
 * node scripts/create-admin.mjs <admin_email> <admin_password> [ad] [soyad]
 * 
 * Nümunə:
 * node scripts/create-admin.mjs admin@libra.az Kitabxana2026! "Kamran" "Əliyev"
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = process.argv[2];
const password = process.argv[3];
const firstName = process.argv[4] || "Admin";
const lastName = process.argv[5] || "Kitabxanaçı";

if (!email || !password) {
  console.error("Xəta: Zəhmət olmasa email və şifrə daxil edin.");
  console.error("Nümunə: node scripts/create-admin.mjs admin@libra.az Sifre123! 'Ad' 'Soyad'");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || "ldptm-kitabxana";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, "\n") : undefined;

let app;
if (getApps().length > 0) {
  app = getApps()[0];
} else if (clientEmail && privateKey) {
  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
} else {
  app = initializeApp({ projectId });
}

const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  console.log(`Administrator hesabı yaradılır: ${email}...`);
  try {
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`İstifadəçi tapıldı (UID: ${user.uid}). Şifrəsi yenilənir...`);
      await auth.updateUser(user.uid, {
        password,
        displayName: `${firstName} ${lastName}`,
      });
    } catch {
      user = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
      });
      console.log(`Yeni istifadəçi yaradıldı (UID: ${user.uid}).`);
    }

    // Assign custom user claim: role = "admin"
    await auth.setCustomUserClaims(user.uid, { role: "admin" });
    console.log(`Custom Claim 'role: admin' uğurla təyin edildi.`);

    // Save in Firestore
    const now = new Date().toISOString();
    await db.collection("users").doc(user.uid).set(
      {
        uid: user.uid,
        email,
        role: "admin",
        firstName,
        lastName,
        phone: "+994 50 000 00 00",
        category: "Müəllim",
        status: "Aktiv",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    console.log(`Firestore 'users' kolleksiyasında Admin profili saxlanıldı.`);
    console.log(`\n Uğurlu! İndi https://ldptm-kitabxana.vercel.app/admin səhifəsindən daxil ola bilərsiniz.`);
    process.exit(0);
  } catch (err) {
    console.error("Xəta baş verdi:", err);
    process.exit(1);
  }
}

createAdmin();
