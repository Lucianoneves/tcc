import React, { useState, useContext, useEffect } from "react";
import { Button, TextField, Container, Box, List, ListItem, Typography, Avatar } from "@mui/material";
import { AuthContext } from "../contexts/auth";
import { db, storage } from "../services/firebaseConnection";
import { doc, getDoc,getDocs, updateDoc, setDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom"; // Importa o hook para navegação
import { updateProfile } from "firebase/auth";

function PerfilUsuario() {
  const { user, logout } = useContext(AuthContext);
  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [endereco, setEndereco] = useState(user?.endereco || "");
  const [imageAvatar, setImageAvatar] = useState(user?.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook para navegação
  const [ocorrencias, setOcorrencias] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, "users", user.uid);
    getDoc(userDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setNome(userData.nome || "");
          setEmail(userData.email || "");
          setTelefone(userData.telefone || "");
          setEndereco(userData.endereco || "");
          setImageAvatar(userData.avatarUrl || null);
        }
      })
      .catch((error) => console.error("Erro ao carregar dados:", error));
  }, [user?.uid]);

  const handleSalvarAlteracoes = async () => {
    if (!user?.uid) {
      alert("Usuário não identificado.");
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, "users", user.uid);

    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();

        const updates = {};
        if (userData.nome !== nome.trim()) updates.nome = nome.trim();
        if (userData.telefone !== telefone.trim()) updates.telefone = telefone.trim();
        if (userData.endereco !== endereco.trim()) updates.endereco = endereco.trim();
        if (userData.avatarUrl !== imageAvatar) updates.avatarUrl = imageAvatar;

        if (Object.keys(updates).length > 0) {
          await updateDoc(userDocRef, updates);
          alert("Alterações salvas com sucesso!");
        } else {
          alert("Nenhuma alteração detectada.");
        }
      } else {
        await setDoc(userDocRef, {
          nome: nome.trim(),
          telefone: telefone.trim(),
          endereco: endereco.trim(),
          avatarUrl: imageAvatar,
        });
        alert("Documento criado com sucesso!");
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

  const handleFotoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setImageAvatar(downloadURL);

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { photoURL: downloadURL });
      alert("Foto de perfil atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao alterar a foto de perfil:", error);
      alert("Erro ao alterar a foto de perfil. Tente novamente.");
    }
  };

  const handleIrParaRegistroProblemas = () => {
    navigate("/registroProblemas");
  };  


  const fetchOcorrencias = async () => {
    const querySnapshot = await getDocs(collection(db, "ocorrencias"));
    const ocorrenciasData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOcorrencias(ocorrenciasData);
  };

  fetchOcorrencias();





  return (
    <Container maxWidth="sm">
      <Box mt={4} textAlign="center">
        <Typography variant="h4" gutterBottom>
          Perfil do Usuário
        </Typography>

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
          <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mr: 2 }}>
            Sair
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleIrParaRegistroProblemas}
          >
            Registro de Problemas
          </Button>
        </Box>
      </Box>

      <List>
      {ocorrencias.map((o) => (
    <ListItem key={o.id}>
      <Typography>
        Ocorrência: {o.descricao} - Registrada por: {o.usuarioNome} (ID: {o.usuarioId})
      </Typography>
    </ListItem>
  ))}
</List>



    </Container>
  );
}

export default PerfilUsuario;
