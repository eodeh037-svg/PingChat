import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByobrtihuNSD7GSGzYGalKi-eKovaDOQM",
  authDomain: "ping-ce71c.firebaseapp.com",
  projectId: "ping-ce71c",
  storageBucket: "ping-ce71c.firebasestorage.app",
  messagingSenderId: "240936981509",
  appId: "1:240936981509:web:c14ccc602bd6b80c80386c",
  measurementId: "G-67WQTPRTTL"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);



