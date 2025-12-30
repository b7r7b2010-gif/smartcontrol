import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA-zjjTrXJdXIX0z4SjGFwlu09KTZAZGRk",
  authDomain: "samrtcontrol.firebaseapp.com",
  projectId: "samrtcontrol",
  storageBucket: "samrtcontrol.firebasestorage.app",
  messagingSenderId: "780118753476",
  appId: "1:780118753476:web:99061878f7909aa381c991"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// FORCE the URL directly here to bypass the config issue
const db = getDatabase(app, "https://samrtcontrol-default-rtdb.europe-west1.firebasedatabase.app");

export { app, db };