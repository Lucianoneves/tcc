import React, { useState, useEffect, useContext } from 'react';
import { Button, Checkbox, FormControlLabel, TextField, Typography, Container, Box, List, ListItem, IconButton, Grid, Paper, Input } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import '../styles/registroProblemas.css';
import { AuthContext } from '../contexts/auth';
import { collection, addDoc } from "firebase/firestore";
import { db } from "../services/firebaseConnection";


function RegistroProblemas() {
 

  const [ocorrencias, setOcorrencias] = useState([
    { id: 1, descricao: 'Buraco na rua' },
    { id: 2, descricao: 'Lâmpada queimada' },
    { id: 3, descricao: 'Alagamento' },
    { id: 4, descricao: 'Descarte irregular de lixo' },
    { id: 5, descricao: 'Vazamento de água' },
  ]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [novaOcorrencia, setNovaOcorrencia] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [erroLocalizacao, setErroLocalizacao] = useState(null);
  const [enderecoManual, setEnderecoManual] = useState('');
  const [resultadoEndereco, setResultadoEndereco] = useState('');
  const [melhoria, setMelhoria] = useState('');
  const [imagens, setImagens] = useState([]);
  const { user, logout, handleReg  } = useContext(AuthContext);
  const [nomeUsuario, setNomeUsuario] = useState ("");


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

  const handleSubmit = async () => {
    if (!selecionadas.length) {
      alert("Selecione pelo menos uma ocorrência.");
      return;
    }

    if (!user) {
      alert("Usuário não identificado. Faça login novamente.");
      return;
    }

    console.log("Nome do usuário:", user.nome);

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
          nomeUsuario: user.nome, // Aqui você está pegando o nome do usuário do contexto
          descricao: o.descricao,
          localizacao: localizacao || "Não especificada",
          data: new Date().toISOString(),
          melhoria,
          imagens: imagens,
        })
      );
  
     

      // Aguarda todas as promessas serem resolvidas
      await Promise.all(registros);

      alert("Ocorrências registradas com sucesso!");
      setSelecionadas([]);
      setMelhoria("");
    } catch (error) {
      console.error("Erro ao registrar ocorrências:", error);
      alert("Erro ao registrar as ocorrências. Tente novamente.");
    }
  };
  



  
 
  
  const handleCheckboxChange = (id) => {
    setSelecionadas((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
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
  
  

  if (!user) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h6" color="error" gutterBottom>
          Usuário não autenticado.
        </Typography>
      </Container>
    );
  }

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

        {/* Exibindo o nome do usuário */}
        <Typography variant="subtitle1" gutterBottom>
          Bem-vindo, {user.nome}!
        </Typography>

        <List>
          {ocorrencias.map((o) => (
            <ListItem key={o.id}>
              <FormControlLabel
                control={<Checkbox checked={selecionadas.includes(o.id)} onChange={() => handleCheckboxChange(o.id)} />}
                label={o.descricao}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth>
            Registrar Ocorrências
          </Button>
        </Box>
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
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOcorrencias([...ocorrencias, { id: ocorrencias.length + 1, descricao: novaOcorrencia }])}
          >
            Adicionar
          </Button>
        </Box>
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
          <Button variant="outlined" color="secondary" onClick={buscarEnderecoManual}>
            Buscar Manualmente
          </Button>
        </Box>
        {erroLocalizacao && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {erroLocalizacao}
          </Typography>
        )}
        {resultadoEndereco && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            {resultadoEndereco}
          </Typography>
        )}
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Adicionar Imagens</Typography>
        <Input
          type="file"
          inputProps={{ accept: "image/*", multiple: true }}
          onChange={handleAddImages}
          fullWidth
        />
        <Box sx={{ mt: 2 }}>
          {imagens.length > 0 && (
            <Grid container spacing={2}>
              {imagens.map((imagem, index) => (
                <Grid item xs={4} key={index}>
                  <Paper sx={{ padding: 1 }}>
                    <img src={imagem} alt={`Imagem ${index}`} style={{ width: '100%', height: 'auto' }} />
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
  );
};

export default RegistroProblemas;