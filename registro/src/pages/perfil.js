import React, { useState, useContext, useEffect } from "react";
import { Button, TextField, Container, Box, List, ListItem, Typography, Avatar } from "@mui/material";
import { AuthContext } from "../contexts/auth";
import { db, storage, auth } from "../services/firebaseConnection";
import { doc, getDoc, getDocs, updateDoc, setDoc, collection, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useNavigate } from "react-router-dom"; // Importa o hook para navegação
import { updateProfile } from "firebase/auth";
import { toast } from "react-toastify";



function PerfilUsuario() {
  const { user, logout } = useContext(AuthContext);
  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [endereco, setEndereco] = useState(user?.endereco || "");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
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
          setFotoPerfil(userData.fotoPerfil || "");

          // Verificar se a URL da foto está sendo carregada corretamente
          console.log("Foto de perfil recuperada:", userData.fotoPerfil);
          setFotoPreview(userData.fotoPerfil || null); // Define a foto de perfil se houver
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao carregar dados. Tente novamente.");
      });
  }, [user?.uid]);





  const handleLogout = async () => {
    await logout();
    alert("Você saiu com sucesso!");
  };


  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) { // Verifica se o arquivo é uma imagem
      setFotoPerfil(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Por favor, selecione um arquivo de imagem.");
    }
  };
  


  const handleTelefoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    const formattedValue = value
      .replace(/^(\d{2})(\d)/, '($1) $2') // Adiciona parênteses ao DDD
      .replace(/(\d{4,5})(\d{4})$/, '$1-$2'); // Adiciona o traço
    setTelefone(formattedValue); // Atualiza o estado com o telefone formatado
  };




  
  



  const handleIrParaRegistroProblemas = () => {
    navigate("/registroProblemas");
  };



  async function excluirPerfil(user, logout, navigate) {
    if (!user || !user.uid) {
      toast.error("Usuário não autenticado.");
      return;
    }

    try {
      setLoading(true);

      // Exclui o documento da coleção 'users'
      const docRefUsers = doc(db, "users", user.uid);
      await deleteDoc(docRefUsers);

      // Exclui o documento da coleção 'login'
      const docRefLogin = doc(db, "login", user.uid);
      await deleteDoc(docRefLogin);

      // Remove a conta do Firebase Authentication
      await auth.currentUser.delete();

      // Limpa o estado do usuário e redireciona
      await logout();
      toast.success("Perfil excluído com sucesso.");
      navigate("/");
    } catch (error) {
      console.error("Erro ao excluir perfil:", error);
      toast.error("Erro ao excluir perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const handleSalvarAlteracoes = async (e) => {
    e.preventDefault(); // Evita a ação padrão do formulário
    if (!user?.uid) {
      alert("Usuário não identificado.");
      return;
    }
  
    setLoading(true);  // Inicia o carregamento
    const userDocRef = doc(db, "users", user.uid);
  
    try {
      const docSnap = await getDoc(userDocRef);
      const updates = {};
  
      if (fotoPerfil) {
        // Faz o upload da nova foto de perfil para o Firebase Storage
        const fotoRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(fotoRef, fotoPerfil);
  
        // Obtém a URL da foto após o upload
        const fotoURL = await getDownloadURL(fotoRef);
  
        updates.fotoPerfil = fotoURL;  // Atualiza a URL da foto
      }
  
      // Verifica as alterações nos dados
      if (nome !== user?.nome) updates.nome = nome.trim();
      if (telefone !== user?.telefone) updates.telefone = telefone.trim();
      if (endereco !== user?.endereco) updates.endereco = endereco.trim();
      if (fotoPerfil !== user?.fotoPerfil) updates.fotoPerfil = fotoPerfil.trim();
  
      // Atualiza o Firestore apenas se houver alterações
      if (Object.keys(updates).length > 0) {
        await updateDoc(userDocRef, updates);
        toast.success("Alterações salvas com sucesso!"); // Feedback ao usuário
      } else {
        toast.info("Nenhuma alteração detectada.");
      }
    } catch (error) {
      console.error("Erro ao salvar as alterações:", error);
      toast.error("Erro ao salvar as alterações. Tente novamente.");
    } finally {
      setLoading(false);  // Termina o carregamento após finalizar todas as operações
    }
  };
  



  return (
    <>
      <Container maxWidth="sm">
        <Box mt={4} textAlign="center">
          <Typography variant="h4" gutterBottom>
            Perfil do Usuário
          </Typography>

          <Box mb={3}>
            <Typography>Upload Foto de Perfil</Typography>
            <Button variant="contained" component="label">
              Escolher Foto
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFotoChange}
              />
            </Button>
          </Box>

          {fotoPreview && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 2,
              }}
            >
              <Avatar src={fotoPreview} sx={{ width: 150, height: 150 }} />
            </Box>
          )}

          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Telefone"
            type="tel"
            value={telefone}
            onChange={handleTelefoneChange}
            inputProps={{
              maxLength: 15, // Máximo de caracteres considerando o formato completo
              autoComplete: 'off',
            }}
            helperText="Digite o número de telefone no formato correto."
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Endereço"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>

        <Box mt={3}>
          <Button
            type="button" // Impede o envio do formulário
            variant="contained"
            color="primary"
            onClick={handleSalvarAlteracoes} // Chama diretamente a função
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>



          <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mr: 2 }}>
            Sair
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleIrParaRegistroProblemas}
            sx={{ mr: 2 }}
          >
            Registro de Problemas
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => excluirPerfil(user, logout, navigate)}
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Excluir Perfil'}
          </Button>
        </Box>


      </Container>
    </>
  );
};

export default PerfilUsuario;