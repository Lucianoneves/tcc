import React, { useState, useEffect, useContext } from 'react';
import { Button, Checkbox, FormControlLabel, TextField, Typography, Container, Box, List, ListItem, IconButton, Grid, Paper, Input, Snackbar, } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import '../styles/registroProblemas.css';
import { AuthContext } from '../contexts/auth';
import { collection, addDoc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../services/firebaseConnection";
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';






function RegistroProblemas() {

  const [ocorrencias, setOcorrencias] = useState([]);
  const [novaOcorrencia, setNovaOcorrencia] = useState('');
  const [selecionadas, setSelecionadas] = useState([]);
  const [localizacao, setLocalizacao] = useState('');
  const [erroLocalizacao, setErroLocalizacao] = useState(null);
  const [enderecoManual, setEnderecoManual] = useState('');
  const [resultadoEndereco, setResultadoEndereco] = useState('');
  const [melhoria, setMelhoria] = useState('');
  const [imagens, setImagens] = useState([]);
  const { user, logout, handleReg } = useContext(AuthContext);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const navigate = useNavigate(); // Hook para redirecionamento
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const storage = getStorage(); // Esta linha cria a referência para o Firebase Storage
  const [observacoes, setObservacoes] = useState('');
  const [o, setO] = useState({ status: 'Pendente' });





  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;


  async function handleLogout() {
    await logout();
  }



  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [apiKey]);



  const [status, setStatus] = useState('Pendente');

// Atualizando o status para "Em Análise"
useEffect(() => {
  setTimeout(() => setStatus('Em Análise'), 2000); // Simulando uma mudança
}, []);





  useEffect(() => {
    if (!user) {
      navigate('/login'); // Redireciona para a página de login se o usuário não estiver autenticado
    }
  }, [user, navigate]);


  // Carrega as ocorrências do localStorage quando o componente é montado
  useEffect(() => {
    if (ocorrencias) {
      localStorage.setItem('ocorrencias', JSON.stringify(ocorrencias));
    }
  }, [ocorrencias]);



  useEffect(() => {
    const ocorrenciasSalvas = localStorage.getItem('ocorrencias');
    if (ocorrenciasSalvas) {
      setOcorrencias(JSON.parse(ocorrenciasSalvas));
    }
  }, []);





  useEffect(() => {
    const fetchOcorrencias = async () => {
      const ocorrenciasRef = collection(db, "ocorrencias");
      const querySnapshot = await getDocs(ocorrenciasRef);
      const ocorrenciasList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOcorrencias(ocorrenciasList);
    };

    fetchOcorrencias();
  }, []);





  useEffect(() => {
    const loadOcorrencias = async () => {
      const ocorrenciasSalvas = localStorage.getItem('ocorrencias');
      if (ocorrenciasSalvas) {
        setOcorrencias(JSON.parse(ocorrenciasSalvas)); // Carregar do localStorage
      } else {
        try {
          // Carregar do Firebase se não houver dados no localStorage
          const querySnapshot = await getDocs(collection(db, 'problemas'));
          const ocorrenciasFirebase = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setOcorrencias(ocorrenciasFirebase);
        } catch (error) {
          console.error('Erro ao buscar ocorrências do Firebase:', error);
        }
      }
    };

    loadOcorrencias();
  }, []); // Executa apenas na montagem do componente

  // Atualiza o localStorage sempre que as ocorrências mudarem
  useEffect(() => {
    if (ocorrencias.length > 0) {
      localStorage.setItem('ocorrencias', JSON.stringify(ocorrencias));
    }
  }, [ocorrencias]);




  const handleAdicionarOcorrencia = async () => {
    if (novaOcorrencia.trim()) {
      const nova = {
        usuarioId: user.uid,
        descricao: novaOcorrencia,
        observacoes, // Adiciona as observações aqui
        status: '',
        data: new Date(),
        media: [], // Aqui, será adicionada a URL do arquivo.
      };

      console.log("Adicionando nova ocorrência: ", nova); // Log para depuração

      try {
        // Adicionar no Firestore
        const docRef = await addDoc(collection(db, "ocorrencias"), nova);
        console.log("Ocorrência registrada com ID:", docRef.id);

        // Verificar se há um arquivo selecionado
        if (selectedFile) {
          const fileRef = ref(storage, `ocorrencias/${docRef.id}/${selectedFile.name}`);
          await uploadBytes(fileRef, selectedFile);
          const fileURL = await getDownloadURL(fileRef);

          // Atualizar a ocorrência com a URL do arquivo
          await updateDoc(docRef, { media: [...nova.media, fileURL] });
          console.log("Arquivo enviado e URL registrada no Firestore.");
        }

        // Adicionar no estado para atualizar a UI
        setOcorrencias((prev) => [...prev, { id: docRef.id, ...nova }]);
        setNovaOcorrencia(''); // Limpar o campo de entrada
        setObservacoes(''); // Limpar o campo de observações
        setSelectedFile(null); // Limpar o arquivo selecionado
        setSnackbarMessage('Ocorrência adicionada com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Erro ao adicionar ocorrência: ", error);
        setSnackbarMessage('Erro ao adicionar a ocorrência.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage('Por favor, descreva a nova ocorrência.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };



  const handleSubmit = async () => {
    if (!selecionadas.length) {
      alert("Selecione pelo menos uma ocorrência.");
      return;
    }
    if (!user) {
      alert("Usuário não identificado. Faça login novamente.");
      return;
    }

    const ocorrenciasSelecionadas = ocorrencias.filter((o) => selecionadas.includes(o.id));

    try {
      const registros = ocorrenciasSelecionadas.map((o) =>
        addDoc(collection(db, "problemas"), {
          usuarioId: user.uid,
          nomeUsuario: user.nome,
          descricao: o.descricao,
          localizacao: localizacao || "Não especificada",
          data: new Date().toISOString(),
          melhoria,
          imagens: imagens,
          status: "Pendente",
        })
      );
      await Promise.all(registros);

      alert("Ocorrências registradas com sucesso!");

      // Atualize o estado local e o localStorage
      const ocorrenciasAtualizadas = ocorrencias.filter((o) => !selecionadas.includes(o.id));
      setOcorrencias(ocorrenciasAtualizadas);
      localStorage.setItem('ocorrencias', JSON.stringify(ocorrenciasAtualizadas));

      setSelecionadas([]);
      setMelhoria("");
    } catch (error) {
      console.error("Erro ao registrar ocorrências:", error);
      alert("Erro ao registrar as ocorrências. Tente novamente.");
    }
  };



  const handleCheckboxChange = (id) => {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };




  const obterLocalizacao = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          obterEndereco(latitude, longitude);
        },
        (error) => {
          const mensagensErro = {
            1: 'Usuário negou a solicitação de Geolocalização.',
            2: 'Informação de localização não está disponível.',
            3: 'A solicitação para obter a localização expirou.',
          };
          setErroLocalizacao(mensagensErro[error.code] || 'Erro ao obter a localização.');
        }
      );
    } else {
      setErroLocalizacao('Geolocalização não é suportada pelo navegador.');
    }
  };

  const obterEndereco = (latitude, longitude) => {
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'OK') {
          setLocalizacao(data.results[0].formatted_address || 'Endereço não encontrado');
        } else {
          setErroLocalizacao('Não foi possível obter o endereço.');
        }
      })
      .catch(() => setErroLocalizacao('Erro ao obter o endereço.'));
  };

  const buscarEnderecoManual = () => {
    if (!enderecoManual.trim()) {
      setErroLocalizacao('Digite um endereço válido.');
      return;
    }

    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(enderecoManual)}&key=${apiKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'OK') {
          const resultado = data.results[0];
          setResultadoEndereco(
            `Endereço: ${resultado.formatted_address}, Coordenadas: ${resultado.geometry.location.lat}, ${resultado.geometry.location.lng}`
          );
        } else {
          setErroLocalizacao('Endereço não encontrado.');
        }
      })
      .catch(() => setErroLocalizacao('Erro ao buscar o endereço.'));
  };

  const handleSubmitNovaOcorrencia = async () => {
    if (!selecionadas.length) {
      alert("Selecione pelo menos uma ocorrência.");
      return;
    }

    if (!user) {
      alert("Usuário não identificado. Faça login novamente.");
      return;
    }

    console.log(user);

    if (!user.nome) {
      console.error("Nome do usuário não encontrado.");
      return;
    }

    const ocorrenciasSelecionadas = ocorrencias.filter((o) => selecionadas.includes(o.id));

    try {
      // Cria um array de promessas para registrar as ocorrências no Firestore
      const registros = ocorrenciasSelecionadas.map((o) =>
        addDoc(collection(db, "problemas"), {
          usuarioId: user.uid,
          nomeUsuario: user.nome,
          descricao: o.descricao,
          localizacao: localizacao || "Não especificada",
          data: new Date().toISOString(),
          melhoria,
          imagens: imagens,
          status: "Pendente",  // Adicionando o status com valor inicial
        })
      );

      // Aguarda todas as promessas serem resolvidas
      await Promise.all(registros);

      alert("Ocorrências registradas com sucesso!");
      setSelecionadas([]); // Limpar as ocorrências selecionadas
      setMelhoria(""); // Limpar o campo de melhoria
    } catch (error) {
      console.error("Erro ao registrar ocorrências:", error);
      alert("Erro ao registrar as ocorrências. Tente novamente.");
    }
  };





  const handleAddImages = (event) => {
    const files = event.target.files;
    if (files) {
      const newImagens = Array.from(files).map(file => URL.createObjectURL(file));
      setImagens(prevImagens => [...prevImagens, ...newImagens]);
    }
  };
  const handleRemoveImage = (index) => {
    setImagens(imagens.filter((_, i) => i !== index));
  };



  return (
    <Container maxWidth="sm">
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" color="secondary" onClick={handleLogout} fullWidth>
          Sair
        </Button>
      </Box>
      <Paper sx={{ padding: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Registrar Ocorrências da sua Região
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Bem-vindo, {user.nome}!
        </Typography>

        <List>
        {ocorrencias.map((o) => (
    <ListItem key={o.id}>
      <FormControlLabel
        control={
          <Checkbox
            checked={selecionadas.includes(o.id)}
            onChange={() => handleCheckboxChange(o.id)}
          />
        }
        label={
          <Box>

        <Typography
          variant="body2"
          sx={{
            color: (() => {
              const status = (o?.status || 'Pendente').trim().toLowerCase(); // Normaliza o valor
              if (status === 'pendente') return 'red'; // Cor cinza
              if (status === 'concluído') return 'green'; // Cor verde
              if (status === 'em análise') return 'orange'; // Cor laranja
              return 'black'; // Cor padrão
            })(),
          }}
        >
          Status: {o?.status || 'Pendente'} {/* Valor padrão para exibição */}
        </Typography>


           
          </Box>
        }
      />
    </ListItem>
  ))}
</List>
        
      </Paper>

      <Box mt={4}>
        <Typography variant="h6">Nova Ocorrência</Typography>
        <TextField
          value={novaOcorrencia}
          onChange={(e) => setNovaOcorrencia(e.target.value)}
          fullWidth
          variant="outlined"
          label="Descrição da nova ocorrência"
          margin="normal"
        />
        <Box mt={2} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" color="secondary" onClick={handleAdicionarOcorrencia}>
            Adicionar Ocorrência
          </Button>
        </Box>
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Observações</Typography>
        <TextField
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          fullWidth
          variant="outlined"
          label="Digite observações adicionais"
          margin="normal"
          multiline
          rows={4}
        />
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Localização Atual</Typography>
        <TextField
          value={localizacao}
          disabled
          fullWidth
          variant="outlined"
          label="Localização Atual"
          margin="normal"
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Button variant="outlined" color="primary" onClick={obterLocalizacao}>
            Obter Localização Atual
          </Button>
        </Box>
        {erroLocalizacao && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {erroLocalizacao}
          </Typography>
        )}
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Adicionar Imagens</Typography>
        <Input
          type="file"
          inputProps={{ accept: 'image/*', multiple: true }}
          onChange={handleAddImages}
          fullWidth
        />
        <Box sx={{ mt: 2 }}>
          {imagens.length > 0 && (
            <Grid container spacing={2}>
              {imagens.map((imagem, index) => (
                <Grid item xs={4} key={index}>
                  <Paper sx={{ padding: 1 }}>
                    <img src={imagem} alt={`Imagem ${index}`} style={{ width: '100%' }} />
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleRemoveImage(index)}
                      sx={{ mt: 1 }}
                      fullWidth
                    >
                      Remover
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Container>
  )
}


export default RegistroProblemas;