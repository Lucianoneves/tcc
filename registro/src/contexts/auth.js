import { useState, createContext } from "react";
import { auth, db } from "../services/firebaseConnection";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AuthContext = createContext({});

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const navigate = useNavigate();

  // Função de Login
  async function login(email, senha) {
    setLoadingAuth(true);

    try {
      const value = await signInWithEmailAndPassword(auth, email, senha);
      let uid = value.user.uid;

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
        navigate("/dashboard");
      } else {
        toast.error("Usuário não encontrado no banco de dados!");
        setLoadingAuth(false);
        return;
      }
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      toast.error("Ops, algo deu errado!");
    } finally {
      setLoadingAuth(false);
    }
  }



  

  // Cadastrar Novo Usuário
  async function cadastrarUsuario(nomeCompleto, senha, email, Cpf, Endereco, Telefone) {
    setLoadingAuth(true);

    try {
      const value = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = value.user.uid;

      const userData = {
        nome: nomeCompleto,
        Cpf: Cpf || null,
        Endereco: Endereco || null,
        Telefone: Telefone || null,
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
      navigate("/dashboard");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Este e-mail já está em uso!");
      } else {
        console.error("Erro ao cadastrar usuário:", error.message);
        toast.error("Erro ao cadastrar. Tente novamente.");
      }
    } finally {
      setLoadingAuth(false);
    }
  }

  // Armazenar usuário no localStorage
  function storageUser(userData) {
    localStorage.setItem("@tickesPRO", JSON.stringify(userData));
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        login,
        cadastrarUsuario,
        loadingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;