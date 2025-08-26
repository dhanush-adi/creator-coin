// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsUA_qf7-erqR5HbQzUUMPAj49VG9fdE8",
  authDomain: "test-56046.firebaseapp.com",
  projectId: "test-56046",
  storageBucket: "test-56046.appspot.com",
  messagingSenderId: "872381887393",
  appId: "1:872381887393:web:4cbe74af738bd35983d1e0",
  measurementId: "G-07MN29TMGP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage();

export { db, storage };
