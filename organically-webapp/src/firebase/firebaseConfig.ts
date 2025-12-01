// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXHNE4gqxMjHiVLQG2UOdcANa_BAiTRhk",
  authDomain: "organically-2af1a.firebaseapp.com",
  projectId: "organically-2af1a",
  storageBucket: "organically-2af1a.firebasestorage.app",
  messagingSenderId: "222320323844",
  appId: "1:222320323844:web:ccf523c57fbde6fd6ff451",
  measurementId: "G-4MJCFGT8X4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
