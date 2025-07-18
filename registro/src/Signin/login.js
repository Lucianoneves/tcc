

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { AuthContext } from "../contexts/auth";
import { Box, Button, Grid, TextField, Typography,  InputAdornment, IconButton  } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material"; // Importe os ícones necessários
import { toast } from "react-toastify";
import { db } from "../services/firebaseConnection";
import { addDoc, collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { getAuth, deleteUser, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar a visibilidade da senha

  // Obtendo a função de login e o estado de carregamento do contexto
  const { login, loadingAuth, user } = useContext(AuthContext);

    const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };


    const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email || email.length < 5 || email.length > 50) {
    toast.error("O e-mail deve ter entre 5 e 50 caracteres.");
    return;
  }
  if (!senha || senha.length < 6 || senha.length > 12) {
    toast.error("A senha deve ter entre 6 e 12 caracteres.");
    return;
  }

  try {
    await login(email, senha); // Chama a função de login do contexto
    navigate("/perfil"); // Redireciona para o perfil após login bem-sucedido
  } catch (error) {
    console.error("Erro ao fazer login: ", error);
    
    // Verifica o tipo de erro
    if (error.code === 'auth/user-not-found') {
      toast.error("Usuário não cadastrado. Por favor, crie uma conta.");
    } else if (error.code === 'auth/wrong-password') {
      toast.error("Senha incorreta. Tente novamente.");
    } else if (error.code === 'auth/too-many-requests') {
      toast.error("Muitas tentativas falhas. Acesso temporariamente bloqueado. Tente novamente mais tarde.");
    } else if (error.code === 'auth/invalid-email') {
      toast.error("E-mail inválido. Verifique o formato do e-mail.");
    } else {
      toast.error("Erro ao fazer login. Verifique suas credenciais.");
    }
  }
};

  const handleEsqueciSenha = () => {   // Função para redirecionar para a página de redefinição de senha //
    navigate("/redefinir-senha");
  };

  const handleCadastro = () => {
    navigate("/cadastrarUsuario");
  };

  // Função para remover os dados do Firestore ao excluir o usuário
  const removerDadosLogin = async (email) => {
    try {
      // Cria uma rehandleSubmiterência para a coleção "login"
      const q = query(collection(db, "login"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      // Itera sobre os documentos encontrados com o e-mail correspondente
      querySnapshot.forEach(async (documento) => {
        await deleteDoc(doc(db, "login", documento.id)); // Exclui o documento
      });

      console.log("Dados de login excluídos com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir os dados de login: ", error);
    }
  };

  const excluirUsuario = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        // Exclui os dados de login antes de excluir a conta
        await removerDadosLogin(user.email);

        // Exclui o usuário autenticado
        await deleteUser(user);
        console.log("Usuário excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir o usuário: ", error);
      }
    }
  };


  return (

    <Box
      component="form"
      onSubmit={handleSubmit}
      autoComplete="off" // Desabilita o preenchimento automático no formulário
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 8,
        p: 3,
        border: "1px solid #ccc",
        borderRadius: 2,
        boxShadow: 2,
        bgcolor: "background.paper",
      }}
    >


      <Typography variant="h4" align="center" gutterBottom>
        Login
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="E-mail"
            name="email" // Nome único para evitar associações
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email" // Sugestão específica para o navegador ignorar histórico
            inputProps={{ minLength: 5, maxLength: 50 }} // Limites de caracteres
            helperText="O e-mail deve ter entre 5 e 50 caracteres."
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Senha"
            name="password" // Nome único para evitar associações
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type={showPassword ? "text" : "password"}  // Esta é a linha crucial que precisa ser alterad
            required
            autoComplete="new-password" // Evita preenchimento automático
            inputProps={{ minLength: 6, maxLength: 20 }} // Limites de caracteres
            helperText="A senha deve ter entre 6 e 12caracteres."
               InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
          
      

        <Grid item xs={12}>
          <Button type="submit" variant="contained" fullWidth>
            {loadingAuth ? "Carregando..." : "Acessar"}
          </Button>
        </Grid>

        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <Typography variant="body2">
            Esqueceu sua senha?{" "}
            <Button onClick={handleEsqueciSenha} variant="text">
              Clique aqui
            </Button>
          </Typography>
        </Grid>

        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <Typography variant="body2">
            Não possui uma conta?{" "}
            <Button onClick={handleCadastro} variant="text">
              Cadastre-se
            </Button>
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Login;