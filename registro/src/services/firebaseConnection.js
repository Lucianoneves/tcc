import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref,  uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC863Auq1yphIbaD4S0e1iRWucyDSqPBok",
  authDomain: "tccregistro-1446b.firebaseapp.com",
  projectId: "tccregistro-1446b",
  storageBucket: "tccregistro-1446b.appspot.com", // Corrigido
  messagingSenderId: "634884137666",
  appId: "1:634884137666:web:7f515eb025ee353f34915b",
  measurementId: "G-757BZ6HRZ8",
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

export { auth, db, storage };
