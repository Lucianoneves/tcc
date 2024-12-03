import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { AuthContext } from "../contexts/auth";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  // Obtendo a função de login e o estado de carregamento do contexto
  const { login, loadingAuth } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error("Preencha todos os campos.");
      return;
    }

    try {
      await login(email, senha); // Chama a função de login do contexto
      navigate("/perfil"); // Redireciona para o dashboard após login bem-sucedido
    } catch (error) {
      console.error("Erro ao fazer login: ", error);
      toast.error("Erro ao fazer login. Verifique suas credenciais.");
    }
  };

  const handleEsqueciSenha = () => {
    navigate("/redefinir-senha");
  };

  const handleCadastro = () => {
    navigate("/cadastrarUsuario");
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
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Senha"
            name="password" // Nome único para evitar associações
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type="password"
            required
            autoComplete="new-password" // Evita preenchimento automático
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
