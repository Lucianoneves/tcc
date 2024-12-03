import React, { useState, useContext, useEffect } from "react";
import { Button, TextField, Container, Box, Typography, Avatar } from "@mui/material";
import { AuthContext } from "../contexts/auth";
import { db } from "../services/firebaseConnection";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

function PerfilUsuario() {
  const { user, logout } = useContext(AuthContext); // Obter usuário e função de logout do contexto
  const [nome, setNome] = useState(user?.nome || ""); // Nome do usuário
  const [email, setEmail] = useState(user?.email || ""); // E-mail do usuário
  const [telefone, setTelefone] = useState(user?.telefone || ""); // Número de telefone
  const [endereco, setEndereco] = useState(user?.endereco || ""); // Endereço do usuário
  const [imageAvatar, setImageAvatar] = useState(user?.photoURL || null); // Foto do perfil
  const [loading, setLoading] = useState(false); // Para bloquear múltiplas submissões

  useEffect(() => {
    const userDocRef = doc(db, "users", user?.uid);
    getDoc(userDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setNome(userData.name);
          setEmail(userData.email);
          setTelefone(userData.telefone);
          setEndereco(userData.endereco);
          setImageAvatar(userData.photoURL || null);
        }
      })
      .catch((error) => console.error("Erro ao carregar dados:", error));
  }, [user]);

  const handleSalvarAlteracoes = async () => {
    setLoading(true);

    const userDocRef = doc(db, "users", user?.uid);
    try {
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        // Atualiza o documento do usuário no Firestore
        await updateDoc(userDocRef, {
          name: nome,
          email: email,
          telefone: telefone,
          endereco: endereco,
          photoURL: imageAvatar, // A foto de perfil
        });
        alert("Alterações salvas com sucesso!");
      } else {
        // Se o documento não existir, cria um novo documento
        await setDoc(userDocRef, {
          name: nome,
          email: email,
          telefone: telefone,
          endereco: endereco,
          photoURL: imageAvatar,
        });
        alert("Documento criado e dados salvos com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar as alterações:", error);
      alert("Erro ao salvar as alterações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    alert("Você saiu com sucesso!");
  };

  const handleFotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageAvatar(URL.createObjectURL(file)); // Pré-visualiza a imagem
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4} textAlign="center">
        <Typography variant="h4" gutterBottom>
          Perfil do Usuário
        </Typography>

        {/* Avatar do Usuário */}
        <Box mb={3}>
          <Avatar
            alt="Foto do Usuário"
            src={imageAvatar || ""}
            sx={{ width: 100, height: 100, margin: "0 auto" }}
          />
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Alterar Foto
            <input type="file" hidden onChange={handleFotoChange} />
          </Button>
        </Box>

        {/* Formulário de Alterações */}
        <Box component="form" sx={{ "& .MuiTextField-root": { mb: 2 }, mt: 2 }}>
          <TextField
            fullWidth
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            label="Telefone"
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <TextField
            fullWidth
            label="Endereço"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
        </Box>

        {/* Botões */}
        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSalvarAlteracoes}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Sair
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default PerfilUsuario;
