
import React from 'react';
import { useState, createContext, useEffect, useContext } from "react";
import { auth, db } from "../services/firebaseConnection";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { query, setDoc, doc, getDoc, where, getDocs, addDoc, collection, deleteDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";  // Certifique-se de importar o 'getStorage' aqui
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

  // Carregar usuário autenticado no início
  useEffect(() => {
    async function loadUser() {
      const storageUser = localStorage.getItem("@tickesPRO");

      if (storageUser) {
        setUser(JSON.parse(storageUser));
      }
      setLoading(false); // Finaliza o estado de carregamento inicial
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
        localStorage.removeItem("user");
      }
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar
  }, []);

  function storageUser(userData) {
    localStorage.setItem("@tickesPRO", JSON.stringify(userData));
  }

  // Função de Login
  async function login(email, senha) {
    setLoadingAuth(true);

    try {
      const value = await signInWithEmailAndPassword(auth, email, senha);
      const uid = value.user.uid;

      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          uid: uid,
          nome: docSnap.data().nome,
          email: value.user.email,
          avatarUrl: docSnap.data().avatarUrl || null,
        };

        setUser(data);
        storageUser(data);
        toast.success("Bem-vindo!");
        navigate("");
      } else {
        toast.error("Usuário não encontrado no banco de dados!");
      }
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        toast.error("Usuário não encontrado!");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Senha incorreta!");
      } else {
        toast.error("Erro ao fazer login!");
      }
    } finally {
      setLoadingAuth(false);
    }
  }



  // Redefinição de senha
  async function redefinirSenha(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
    } catch (error) {
      // Imprimir o erro para mais detalhes
      console.error("Erro ao enviar e-mail de redefinição:", error);
      const erroMensagem = error.code ? error.code : error.message;
      toast.error(`Erro: ${erroMensagem}`);
    }
  }




  // Registro de problemas
  const handleReg = async () => {
    if (!titulo.trim() || !descricao.trim()) {
      toast.error("Preencha todos os campos!");
      return;
    }
    if (!user?.uid) {
      toast.error("Usuário não autenticado.");
      return;
    }

    const novaOcorrencia = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      data: new Date(),
      usuarioId: user.uid,
      nomeUsuario: user.nome,
    };

    try {
      await addDoc(collection(db, "ocorrencias"), novaOcorrencia);
      toast.success("Ocorrência registrada com sucesso!");
      navigate("/listaDeOcorrencias");
    } catch (error) {
      console.error("Erro ao registrar ocorrência:", error);
      toast.error("Erro ao registrar a ocorrência. Tente novamente.");
    }
  };

  // Cadastrar Novo Usuário
  async function cadastrarUsuario(nome, senha, email, cpf, endereco, telefone) {
    setLoadingAuth(true);

    try {
      const value = await createUserWithEmailAndPassword(auth, email, senha);
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
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Este e-mail já está em uso!");
      } else if (error.code === "auth/weak-password") {
        toast.error("Senha fraca!");
      } else {
        console.error("Erro ao cadastrar usuário:", error.message);
        toast.error("Erro ao cadastrar. Tente novamente.");
      }
    } finally {
      setLoadingAuth(false);
    }
  }

  // Logout
  async function logout() {
    await signOut(auth);
    localStorage.removeItem("@tickesPRO");
    setUser(null);
    toast.success("Você foi desconectado.");
  }

  // Função para excluir o perfil do usuário
async function excluirPerfil() {
  if (!user?.uid) {
    toast.error("Usuário não autenticado.");
    return;
  }

  try {
    // Remover dados do usuário no Firestore
    const docRef = doc(db, "users", user.uid);
    await deleteDoc(docRef);

    // Excluir o usuário no Firebase Authentication
    await user.delete();

    // Remover usuário do localStorage
    localStorage.removeItem("@tickesPRO");
    setUser(null);

    toast.success("Perfil excluído com sucesso.");
    navigate("/"); // Redirecionar para a página inicial (ou para onde preferir)
  } catch (error) {
    console.error("Erro ao excluir perfil:", error);
    toast.error("Erro ao excluir perfil. Tente novamente.");
  }
}

  





  return (
    <AuthContext.Provider
      value={{

        signed: !!user,
        user,
        login,
        redefinirSenha,
        cadastrarUsuario,
        logout,
        excluirPerfil,  // função excluirPerfil
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