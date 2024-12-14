import { useState, createContext, useEffect, useContext } from "react";
import { auth, db } from "../services/firebaseConnection";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,onAuthStateChanged } from "firebase/auth";
import { query, setDoc, doc, getDoc, where, getDocs, addDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";



export const AuthContext = createContext({});

function AuthProvider({ children }) {
const [user, setUser] = useState(null);
const [loadingAuth, setLoadingAuth] = useState(false);
const [loading, setLoading] = useState(true);
const [titulo, setTitulo] = useState("");
const [descricao, setDescricao] = useState("");


const navigate = useNavigate();

useEffect(() => {
 async function loadUser() {
   const storageUser = localStorage.getItem('@tickesPRO');

   if (storageUser) {
     setUser(JSON.parse(storageUser));
   }
   setLoading(false); // Definido uma única vez
 }
 loadUser();

 const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
  if (currentUser) {
    const uid = currentUser.uid;
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = {
        uid,
        nome: docSnap.data().nome,
        email: currentUser.email,
        avatarUrl: docSnap.data().avatarUrl || null,
      };

      setUser(userData);
      storageUser(userData);
    }
  } else {
    setUser(null);
  }
});

return () => unsubscribe(); // Limpa o listener ao desmontar
}, []);


 

const fetchUserOcorrencias = async (userId) => {
  if (!userId) return;

  const q = query(
    collection(db, "ocorrencias"),
    where("usuarioId", "==", userId) // Filtra as ocorrências pelo usuárioId
  );

  try {
    const querySnapshot = await getDocs(q);
    const ocorrencias = [];

    querySnapshot.forEach((doc) => {
      ocorrencias.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return ocorrencias; // Retorna as ocorrências encontradas
  } catch (error) {
    console.error("Erro ao buscar ocorrências:", error);
    return [];
  }
};


   

const handleRegistro = async () => { 

  if (!user?.uid) {
    alert("Usuário não autenticado.");
    return;
  }

  if (!titulo.trim() || !descricao.trim()) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const novaOcorrencia = {
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    data: new Date(),
    usuarioId: user.uid,
  };

  try {
    await addDoc(collection(db, "ocorrencias"), novaOcorrencia);
    alert("Ocorrência registrada com sucesso!");
    setTitulo(""); // Limpa o título após o registro
    setDescricao(""); // Limpa a descrição após o registro
  } catch (error) {
    console.error("Erro ao registrar ocorrência:", error);
    alert("Erro ao registrar a ocorrência. Tente novamente.");
  }
}

function storageUser(userData) {
  localStorage.setItem("@tickesPRO", JSON.stringify(userData));
}


  //Ocorrencias por usuario //

const getOcorrenciasPorUsuario = async (uid) => {
  const q = query(collection(db, "ocorrencias"), where("usuarioId", "==", uid));
  const querySnapshot = await getDocs(q);
  const ocorrencias = querySnapshot.docs.map(doc => doc.data());
  return ocorrencias;
};




// Função de Login

async function login(email, senha) {
  setLoadingAuth(true); // Indica que o processo de login começou

  try {
    // Tenta autenticar o usuário com e-mail e senha
    const value = await signInWithEmailAndPassword(auth, email, senha);
    const uid = value.user.uid;

    // Referência ao documento do usuário no Firestore
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Usuário encontrado no banco de dados
      const data = {
        uid: uid,
        nome: docSnap.data().nome,
        email: value.user.email,
        avatarUrl: docSnap.data().avatarUrl || null,
      };

      setUser(data); // Atualiza o estado do usuário
      storageUser(data); // Salva os dados localmente
      toast.success("Bem-vindo!"); // Mensagem de sucesso
      navigate(""); // Redireciona o usuário
    } else {
      // Documento do usuário não encontrado
      toast.error("Usuário não encontrado no banco de dados!");
    }
  } catch (error) {
    // Trata possíveis erros durante o login
    if (error.code === "auth/user-not-found") {
      toast.error("Usuário não encontrado!");
    } else if (error.code === "auth/wrong-password") {
      toast.error("Senha incorreta!");
    } else {
      toast.error("Erro ao fazer login!");
    }
  } finally {
    setLoadingAuth(false); // Finaliza o estado de carregamento
  }
};



//registroProblemas para cada usuario//

const handleReg = async () => {
  if (!user?.uid) {
    alert("Usuário não autenticado.");
    return;
  }

  const novaOcorrencia = {
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    data: new Date(),
    usuarioId: user.uid, // Associa o ID do usuário à ocorrência
  };

  try {
    await addDoc(collection(db, "ocorrencias"), novaOcorrencia);
    alert("Ocorrência registrada com sucesso!");
  } catch (error) {
    console.error("Erro ao registrar ocorrência:", error);
    alert("Erro ao registrar a ocorrência. Tente novamente.");
  }
};





// Cadastrar Novo Usuário
async function cadastrarUsuario(nome, senha, email, cpf, endereco, telefone) {
 setLoadingAuth(true);

 try {
   const value = await signInWithEmailAndPassword(auth, email, senha);
   const uid = value.user.uid;

   const userData = {
     nome: nome,
     cpf: cpf || null,
     endereco: endereco || null,
     telefone: telefone || null,
     email: email,
     avatarUrl: null,
   };

   await setDoc(doc(db, "users", uid), userData);

   setUser({
     uid,
     ...userData,
   });

   storageUser({ uid, ...userData });

   toast.success("Bem-vindo ao Sistema!");
   navigate("/registroProblemas");
  }catch (error) {
   if (error.code === "auth/email-already-in-use") {
     toast.error("Este e-mail já está em uso!");
   } else if (error.code === "auth/weak-password") {
    toast.error("Senha fraca!");
   }else {
      console.error("Erro ao cadastrar usuário:", error.message);
      toast.error("Erro ao cadastrar. Tente novamente.");

    }
   }
  }


// Armazenar usuário no localStorage
function storageUser(userData) {
 localStorage.setItem("@tickesPRO", JSON.stringify(userData));
}

async function logout() {
 await signOut(auth); // Corrigido: passando o objeto 'auth'
 localStorage.removeItem('@tickesPRO');
 setUser(null);
 toast.success("Você foi desconectado.");
}

return (
 <AuthContext.Provider
   value={{
     signed: !!user,
     user,
     login,
     cadastrarUsuario,
     logout,
     loadingAuth,
     loading,
     handleReg, // Exponha handleReg para uso
   }}
 >
   {children}
 </AuthContext.Provider>
);
}

export default AuthProvider;