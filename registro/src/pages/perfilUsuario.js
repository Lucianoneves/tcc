import React, { useState, useContext, useEffect, useCallback } from "react";
import { Button, TextField, Container, Box, Typography, Avatar } from "@mui/material";
import { AuthContext } from "../contexts/auth";
import { db, storage, auth } from "../services/firebaseConnection";
import { doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getDatabase, ref as dbRef, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function PerfilUsuario() {
  const { user, logout } = useContext(AuthContext);
  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [endereco, setEndereco] = useState(user?.endereco || "");
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [ocorrencias, setOcorrencias] = useState([]);



  useEffect(() => {
    if (user?.uid) {
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setNome(userData.nome || "");  // Agora carregando o nome corretamente
            setEmail(userData.email || "");
            setTelefone(userData.telefone || "");
            setEndereco(userData.endereco || "");
            setFotoPreview(userData.fotoPerfil || null); // Carrega a foto de perfil se existir
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          toast.error("Erro ao carregar os dados do usuário.");
        }
      };

      fetchUserData();
    }
  }, [user?.uid]);


  // Alteração de foto de perfil
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem("fotoPerfil", reader.result);
        setFotoPreview(reader.result);
        toast.success("Foto de perfil atualizada!");
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Por favor, selecione uma imagem válida.");
    }
  };


  // Função para excluir a foto de perfil
  // eslint-disable-next-line no-unused-vars
  const handleExcluirFoto = async () => {
    if (!user?.uid) {
      toast.error("Usuário não autenticado.");
      return;
    }

    const confirmacao = window.confirm(
      "Tem certeza que deseja remover sua foto de perfil?\n\n" +
      "Esta ação não pode ser desfeita."
    );

    if (!confirmacao) {
      toast.info("Remoção da foto de perfil cancelada.");
      return;
    }

    setLoading(true);

    try {
      const userDocRef = doc(db, "users", user.uid);

      await updateDoc(userDocRef, {
        fotoPerfil: null,
      });

      localStorage.removeItem("fotoPerfil");
      setFotoPreview(null);

      toast.success("Foto de perfil removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover foto de perfil:", error);
      toast.error("Erro ao remover foto de perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };




  // Formatação de telefone
  const handleTelefoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    const formattedValue = value
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})$/, "$1-$2");
    setTelefone(formattedValue);
  };



  // Carregar foto salva no localStorage ao iniciar
  useEffect(() => {
    const fotoSalva = localStorage.getItem("fotoPerfil");  // Armazena a URL da imagen   localStorage a imagen e convertida em uma string com a chave fotoPerfil, mas esse 
    if (fotoSalva) {                                         // metodo  é utilizado para imagens pequenas ou medias  pois tem uma limitação de 5MB por dominio  //
      setFotoPreview(fotoSalva);
    }
  }, []);





  // Buscar ocorrências
  const fetchOcorrencias = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const ocorrenciasRef = collection(db, "ocorrencias");
      const q = query(ocorrenciasRef, where("usuarioId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const ocorrenciasList = [];
      querySnapshot.forEach((doc) => {
        ocorrenciasList.push({ id: doc.id, ...doc.data() });
      });
      setOcorrencias(ocorrenciasList);
    } catch (error) {
      console.error("Erro ao buscar ocorrências:", error);
      toast.error("Erro ao carregar as ocorrências.");
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchOcorrencias();
  }, [user?.uid, fetchOcorrencias]);



  // Salvar nome, telefone e endereço no Firebase
  const handleSalvarAlteracoes = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setLoading(true);
  const userDocRef = doc(db, "users", user.uid);

  // Determina o valor final para fotoPerfil
  let fotoPerfilToSave = fotoPreview; // Assume o valor atual do preview

  // Se o preview estiver null e o user original tinha uma foto,
  // significa que a foto foi removida.
  // Se o preview tiver uma Data URL, ela será salva.
  // Se o preview tiver um URL de storage, ele será salvo.

  // A principal preocupação aqui é que se 'fotoPreview' for null,
  // então 'fotoPerfilToSave' será null. O Firestore aceita null.

  const updates = {
    nome: nome.trim(),
    email: email.trim(),
    telefone: telefone.trim(),
    endereco: endereco.trim(),
    fotoPerfil: fotoPerfilToSave, // Este valor será null se a foto foi excluída, ou a Data URL/URL de Storage
  };

  try {
    await updateDoc(userDocRef, updates);
    toast.success("Dados salvos com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    // Adicione console.log para ver o erro exato do Firebase
    console.error("Detalhes do erro do Firebase:", error.code, error.message);
    toast.error("Erro ao salvar dados. Tente novamente.");
  } finally {
    setLoading(false);
  }
};

  // Logout
  const handleLogout = async () => {
    await logout();
    toast.success("Você saiu com sucesso!");
  };

  // Excluir perfil
  const excluirPerfil = async () => {
    if (!user?.uid) return;

    // Adiciona confirmação antes de excluir
  const confirmacao = window.confirm(
    "Tem certeza que deseja excluir seu perfil permanentemente?\n\n" +
    "Esta ação não pode ser desfeita e removerá:\n" +
    "- Seus dados pessoais\n" +
    "- Todas as suas ocorrências registradas\n" +
    "- Sua conta de acesso\n\n" +
    "Clique em OK para confirmar ou Cancelar para voltar."
  );

  if (!confirmacao) {
    toast.info("Exclusão do perfil cancelada.");
    return;
  }

  setLoading(true);


    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteDoc(doc(db, "login", user.uid));

      const ocorrenciasRef = collection(db, "ocorrencias");
      const ocorrenciasSnap = await getDocs(ocorrenciasRef);
      const ocorrenciasPromises = ocorrenciasSnap.docs
        .filter(doc => doc.data().usuarioId === user.uid)
        .map(doc => deleteDoc(doc.ref));

      await Promise.all(ocorrenciasPromises);

      if (user.fotoPerfil) {
        const fotoRef = ref(storage, `profile_pictures/${user.uid}`);
        await deleteObject(fotoRef);
      }

      await auth.currentUser.delete();
      await logout();
      toast.success("Perfil  excluídos com sucesso."); // Mensagem de sucesso após exclusão 
      navigate("/");
    } catch (error) {
      console.error("Erro ao excluir perfil:", error);
      toast.error("Erro ao excluir perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <Container maxWidth="sm">
      <Box mt={4} textAlign="center">
        <Typography variant="h4" gutterBottom>Perfil do Usuário</Typography>

        <Box mb={3}>
          <Typography>Upload Foto de Perfil</Typography>
          <Button variant="contained" component="label">
            Escolher Foto
            <input type="file" accept="image/*" hidden onChange={handleFotoChange} />
          </Button>
            {/* BOTÃO EXCLUIR FOTO COM VISUAL "CONTAINED" */}
          {fotoPreview && (
            <Button
              variant="contained" // Alterado de "outlined" para "contained"
              color="error"
              onClick={handleExcluirFoto}
              sx={{ ml: 2 }}
              disabled={loading}
            >
              {loading ? 'Removendo...' : 'Excluir Foto'}
            </Button>
          )}
        </Box>

        {fotoPreview && (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
            <Avatar src={fotoPreview} sx={{ width: 150, height: 150 }} />
          </Box>
        )}

        <TextField fullWidth label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Telefone" value={telefone} onChange={handleTelefoneChange} sx={{ mb: 2 }} />
        <TextField fullWidth label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} sx={{ mb: 2 }} />

        <Box mt={3}>
          <Button variant="contained" color="primary" onClick={handleSalvarAlteracoes} disabled={loading} sx={{ mr: 2 }}> 
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
          <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mr: 2 }}>
            Sair
          </Button>
          <Button variant="contained" color="secondary" onClick={() => navigate("/registroProblemas")} sx={{ mr: 2 }}>
            Registro de Problemas
          </Button>
          <Button variant="outlined" color="error" onClick={excluirPerfil} disabled={loading}>
            {loading ? 'Excluindo...' : 'Excluir Perfil'}
          </Button>
          <Button variant="outlined" color="info" onClick={() => navigate("/avaliacaoFeedback")} sx={{ mr: 2 }}>
            Minhas Avaliações e Feedback
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default PerfilUsuario;