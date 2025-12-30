import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCVmGZk2CHrAaOdrydzKV1HESnRfCseUlU",
  authDomain: "smartcontrol-b2fe6.firebaseapp.com",
  databaseURL: "https://smartcontrol-b2fe6-default-rtdb.firebaseio.com",
  projectId: "smartcontrol-b2fe6",
  storageBucket: "smartcontrol-b2fe6.firebasestorage.app",
  messagingSenderId: "750737936480",
  appId: "1:750737936480:web:0dd63b807276e6b8b4f305"
};

// Singleton pattern to prevent multiple app initializations
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get a reference to the database service
// Passing the databaseURL explicitly ensures connection to the specific US region node
const db = getDatabase(app, firebaseConfig.databaseURL);

export { app, db };