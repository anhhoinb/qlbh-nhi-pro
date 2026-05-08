import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhGuKGWrIPTeRk1ffIhRkclP4QlCW2vsM",
  authDomain: "qlbh-nhi-pro.firebaseapp.com",
  databaseURL:
    "https://qlbh-nhi-pro-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "qlbh-nhi-pro",
  storageBucket:
    "qlbh-nhi-pro.firebasestorage.app",
  messagingSenderId:
    "359966884057",
  appId:
    "1:359966884057:web:67ed2c7e5b0c1fb6c73ec8",
  measurementId:
    "G-LL2WSC5W7E",
};

const app =
  initializeApp(firebaseConfig);

export const auth =
  getAuth(app);

export const db =
  getFirestore(app);