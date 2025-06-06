
// Esse codigo é para configurar e inicializar o Firebase no projeto web,
// firebase/app: Inicializa o Firebase no projeto.
//firebase/auth: Gerencia a autenticação de usuários.
//firebase/firestore: Permite o uso do Firestore (banco de dados NoSQL do Firebase).
//firebase/storage: Permite armazenar e recuperar arquivos no Firebase Storage. //



import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


// Variáveis globais fornecidas pelo ambiente Canvas


// eslint-disable-next-line no-use-before-define
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(firebaseConfig) :  {
    apiKey: "AIzaSyC863Auq1yphIbaD4S0e1iRWucyDSqPBok",
    authDomain: "tccregistro-1446b.firebaseapp.com",
    projectId: "tccregistro-1446b",
    storageBucket: "tccregistro-1446b.appspot.com",
    messagingSenderId: "634884137666",
    appId: "1:634884137666:web:7f515eb025ee353f34915b",
    measurementId: "G-757BZ6HRZ8",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);






export { auth, db, storage };
