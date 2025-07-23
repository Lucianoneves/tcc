import React, { useState, useEffect, useContext, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { Button, Checkbox, FormControlLabel, TextField, Typography, Container, Box, List, ListItem, Divider, IconButton, Grid, Paper, Input, Snackbar, MenuItem } from '@mui/material'; // Importando componentes do Material-UI
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import MapIcon from '@mui/icons-material/Map';
import { styled } from '@mui/system';
import '../styles/registroProblemas.css';
import { AuthContext } from '../contexts/auth';
// eslint-disable-next-line no-unused-vars
import { collection, doc, getDoc, setDoc, addDoc, query, where, getDocs, deleteDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../services/firebaseConnection";
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { toast } from 'react-toastify';
import { saveImage, getImages, deleteImage } from "./imageDB";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';  
import LocationOnIcon from '@mui/icons-material/LocationOn';



function RegistroProblemas() {
  const navigate = useNavigate(); // Hook para redirecionamento
  const [ocorrencias, setOcorrencias] = useState([]);
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    descricao: '',
    gravidade: '' // Valor padrão
  });
  const [selecionadas, setSelecionadas] = useState([]);
  const [localizacao, setLocalizacao] = useState('');
  const [erroLocalizacao, setErroLocalizacao] = useState(null);
  const [enderecoEditavel, setEnderecoEditavel] = useState('');
  const [endereco, setEndereco] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [resultadoEndereco, setResultadoEndereco] = useState('');
  const [melhoria, setMelhoria] = useState('');
  const [imagensPorOcorrencia, setImagensPorOcorrencia] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [imagem, setImagem] = useState(null);
  const [imagens, setImagens] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const storage = getStorage(); // Esta linha cria a referência para o Firebase Storage
  const [observacoes, setObservacoes] = useState('');
  const [o, setO] = useState({ status: 'Pendente' });
  const [problemas, setProblemas] = useState([]);
  const [dataOcorrencia, setDataOcorrencia] = useState('');
  const [ocorrenciaEditar, setOcorrenciaEditar] = useState(null); // Ocorrência a ser editada 
  const [ocorrencia, setOcorrencia] = useState({});
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [imagensExecucaoPorOcorrencia, setImagensExecucaoPorOcorrencia] = useState({});







  const apiKey = process.env.REACT_APP_Maps_API_KEY;

  // Crie as referências para as seções de destino
  const novaOcorrenciaRef = useRef(null);
  const descricaoOcorrenciasRef = useRef(null); // Referência para a seção de descrição das ocorrências


  async function handleLogout() {
    await logout();
  }



  const GravidadeSpan = styled('span')(({ gravidade }) => ({ // Estilização condicional baseada na gravidade
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
    backgroundColor:
      gravidade === 'Alta' ? '#f44336' :
        gravidade === 'Média' ? '#FFA500' :
          gravidade === 'Baixa' ? '#4caf50' : '#9e9e9e'
  }));

  // Adicione também a lista de gravidades disponíveis
  const GRAVIDADE = ['Baixa', 'Média', 'Alta'];


  useEffect(() => { // Carrega o script do Google Maps API quando o componente é montado
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






  const fetchOcorrencias = async () => {
    try {
      // Se o user.uid não estiver definido, não faça a busca
      if (!user?.uid) {
        console.error("Usuário não autenticado.");
        return;
      }

      const ocorrenciasRef = collection(db, "ocorrencias");

      // Consulta para buscar ocorrências do usuário logado
      const q = query(ocorrenciasRef, where("usuarioId", "==", user.uid));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("Nenhuma ocorrência encontrada.");
        setOcorrencias([]); // Atualiza para estado vazio se não encontrar ocorrências
        return;
      }

      const ocorrenciasList = [];
      querySnapshot.forEach((doc) => {
        ocorrenciasList.push({ id: doc.id, ...doc.data() });
      });

      // Sort the occurrences by date in descending order (most recent first)
      ocorrenciasList.sort((a, b) => {
        // Convert to Date objects for accurate comparison
        const dateA = new Date(a.data);
        const dateB = new Date(b.data);
        return dateB - dateA; // For descending order
      });

      // Atualiza o estado com as ocorrências filtradas e ordenadas
      setOcorrencias(ocorrenciasList);
    } catch (error) {
      console.error("Erro ao buscar ocorrências:", error);
      toast.error("Erro ao carregar as ocorrências.");
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchOcorrencias(); // Chama a função para carregar as ocorrências do usuário logado
    }
  }, [user?.uid]);






  useEffect(() => {
    const loadOcorrencias = async () => {
      const ocorrenciasSalvas = localStorage.getItem('ocorrencias');
      if (ocorrenciasSalvas) {
        // Parse and sort the data from localStorage
        const parsedOcorrencias = JSON.parse(ocorrenciasSalvas);
        parsedOcorrencias.sort((a, b) => {
          const dateA = new Date(a.data);
          const dateB = new Date(b.data);
          return dateB - dateA;
        });
        setOcorrencias(parsedOcorrencias);
      } else {
        try {
          // Carregar do Firebase se não houver dados no localStorage
          const querySnapshot = await getDocs(collection(db, 'problemas'));
          const ocorrenciasFirebase = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Sort the data fetched from Firebase
          ocorrenciasFirebase.sort((a, b) => {
            const dateA = new Date(a.data);
            const dateB = new Date(b.data);
            return dateB - dateA;
          });
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





  const handleAdicionarOcorrencia = async () => { //  Função para adicionar uma nova ocorrência 
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleString();
    const enderecoAtual = enderecoEditavel.trim();

    // Verifica se a descrição da nova ocorrência não está vazia
    if (novaOcorrencia.descricao.trim()) {
      // Função para gerar um código de protocolo único
      const gerarProtocolo = () => {
        const timestamp = Date.now().toString(36); // base 36 = letras + números
        const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PROTOCOLO-${timestamp}-${aleatorio}`;
      };

      const protocolo = gerarProtocolo();

      const nova = {
        usuarioId: user.uid,
        nomeUsuario: user.nome,
        descricao: novaOcorrencia.descricao,
        gravidade: novaOcorrencia.gravidade,
        endereco: enderecoAtual,
        observacoes,
        status: 'Pendente',
        data: dataFormatada,
        protocolo: protocolo // Adicionando protocolo
      };

      try {
        const docRef = await addDoc(collection(db, "ocorrencias"), nova);

        if (selectedFile) {
          const fileRef = ref(storage, `ocorrencias/${docRef.id}/${selectedFile.name}`);
          await uploadBytes(fileRef, selectedFile);
          const fileURL = await getDownloadURL(fileRef);
          await updateDoc(doc(db, "ocorrencias", docRef.id), { media: [fileURL] });
        }

        // Add the new occurrence and sort the list
        setOcorrencias((prev) => {
          const updatedOcorrencias = [...prev, { id: docRef.id, ...nova }];
          return updatedOcorrencias.sort((a, b) => {
            const dateA = new Date(a.data);
            const dateB = new Date(b.data);
            return dateB - dateA;
          });
        });
        setNovaOcorrencia('');
        setObservacoes('');
        setSelectedFile(null);
        setSnackbarMessage('Ocorrência adicionada com sucesso!');
        setSnackbarSeverity('success');
        toast.success(`Protocolo gerado: ${protocolo}`);
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


  // Função para carregar imagens quando o componente montar ou ocorrências mudarem
  useEffect(() => {
    const loadImagesForOcorrencias = async () => {
      const loadedImages = {};
      const loadedExecucaoImages = {}; // Adicione esta linha
      for (const o of ocorrencias) {
        const imgs = await getImages(o.id);
        loadedImages[o.id] = imgs;

        // Carrega imagens de execução com o prefixo correto
        const execImgs = await getImages(`execucao_${o.id}`);
        loadedExecucaoImages[o.id] = execImgs;
      }
      setImagensPorOcorrencia(loadedImages);
      setImagensExecucaoPorOcorrencia(loadedExecucaoImages); // Atualiza o estado
    };

    if (ocorrencias.length > 0) {
      loadImagesForOcorrencias();
    }
  }, [ocorrencias]);

  const handleAddImage = async (ocorrenciaId, event) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    if (!file.type.match('image.*')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    try {
      const savedImage = await saveImage(file, ocorrenciaId);

      setImagensPorOcorrencia(prev => ({
        ...prev,
        [ocorrenciaId]: [...(prev[ocorrenciaId] || []), savedImage]
      }));

      toast.success('Imagem adicionada com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      toast.error('Erro ao salvar a imagem');
    }
  };

  const handleRemoveImage = async (ocorrenciaId, imageId) => {
    try {
      // Adiciona confirmação antes de remover
      const confirmacao = window.confirm('Tem certeza que deseja remover esta imagem?');

      if (!confirmacao) return; // Se o usuário cancelar, não prossegue

      await deleteImage(imageId);

      setImagensPorOcorrencia(prev => ({
        ...prev,
        [ocorrenciaId]: prev[ocorrenciaId].filter(img => img.id !== imageId)
      }));

      toast.success('Imagem removida com sucesso!');
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      toast.error('Erro ao remover a imagem');
    }
  };



  const handleEditarClick = (id) => {
    const ocorrenciaSelecionada = ocorrencias.find((ocorrencia) => ocorrencia.id === id);

    if (ocorrenciaSelecionada) {
      setOcorrenciaEditar(ocorrenciaSelecionada);
      setNovaOcorrencia({
        descricao: ocorrenciaSelecionada.descricao,
        gravidade: ocorrenciaSelecionada.gravidade || ''
      });
      setObservacoes(ocorrenciaSelecionada.observacoes);
      setEndereco(ocorrenciaSelecionada.endereco);

      // Nova lógica: rolar para a seção de nova ocorrência e descrição
      if (novaOcorrenciaRef.current) {
        novaOcorrenciaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSalvarEdicao = async () => {
    if (ocorrenciaEditar) {
      try {
        const novaOcorrenciaRef = doc(db, "ocorrencias", ocorrenciaEditar.id);
        await updateDoc(novaOcorrenciaRef, {
          descricao: novaOcorrencia.descricao,
          gravidade: novaOcorrencia.gravidade,
          observacoes: observacoes,
          nomeUsuario: user.nome,
          endereco: endereco,
        });

        const novaListaOcorrencias = ocorrencias.map((ocorrencia) => {
          if (ocorrencia.id === ocorrenciaEditar.id) {
            return {
              ...ocorrencia,
              descricao: novaOcorrencia.descricao,
              gravidade: novaOcorrencia.gravidade,
              observacoes: observacoes,
              nomeUsuario: user.nome,
              endereco: endereco,
            };
          }
          return ocorrencia;
        }).sort((a, b) => new Date(b.data) - new Date(a.data));

        setOcorrencias(novaListaOcorrencias);
        setNovaOcorrencia({ descricao: '', gravidade: '' });
        setObservacoes('');
        setOcorrenciaEditar(null);
        setEndereco('');

        setSnackbarMessage('Ocorrência atualizada com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Erro ao salvar edição:", error);
        setSnackbarMessage('Erro ao atualizar a ocorrência.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleRemoverOcorrencia = async (id) => {
    try {
      // Add confirmation before removing
      const confirmacao = window.confirm('Tem certeza que deseja remover esta ocorrência?');
      if (!confirmacao) return;

      // Remover do Firestore
      const ocorrenciaRef = doc(db, "ocorrencias", id);
      await deleteDoc(ocorrenciaRef);

      // Remover do estado e atualizar localStorage
      const updatedOcorrencias = ocorrencias.filter((o) => o.id !== id);
      setOcorrencias(updatedOcorrencias);
      localStorage.setItem('ocorrencias', JSON.stringify(updatedOcorrencias));

      setSnackbarMessage('Ocorrência removida com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Erro ao remover ocorrência: ", error);
      setSnackbarMessage('Erro ao remover a ocorrência.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };






  // Estado para controlar os checkboxes


  // Função para alternar o estado do checkbox




  const obterLocalizacao = () => {
    console.log('Botão clicado - Função chamada!');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
          setLocalizacao(`Latitude: ${latitude}, Longitude: ${longitude}`);
          setErroLocalizacao('');
          obterEndereco(latitude, longitude); // Obtém o endereço com base nas coordenadas
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
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
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.address) {
          const { road, neighbourhood, city, postcode } = data.address;
          const enderecoFormatado = `${road || ''}, ${neighbourhood || ''}, ${city || ''}, ${postcode || ''}`;
          const enderecoLimpo = enderecoFormatado.trim().replace(/,\s*,/g, ','); // Remove vírgulas extras

          setEndereco(enderecoLimpo);
          setEnderecoEditavel(enderecoLimpo); // Atualiza o campo editável

          localStorage.setItem('endereco', enderecoLimpo); // Salva no localStorage
          salvarEnderecoNoFirebase(enderecoLimpo); // Salva no Firebase
        } else {
          setErroLocalizacao('Não foi possível obter o endereço.');
        }
      })
      .catch(() => setErroLocalizacao('Erro ao buscar o endereço.'));
  };

  // No início do componente, recuperar os dados salvos no localStorage
  useEffect(() => {
    const enderecoSalvo = localStorage.getItem('endereco');
    if (enderecoSalvo) {
      setEndereco(enderecoSalvo);
      setEnderecoEditavel(enderecoSalvo);
    }
  }, []);

  const handleEnderecoEdit = (e) => {
    setEnderecoEditavel(e.target.value);
  };

  const salvarEnderecoEditado = () => {
    setEndereco(enderecoEditavel); // Atualiza o estado principal
    localStorage.setItem('endereco', enderecoEditavel); // Salva no localStorage
    salvarEnderecoNoFirebase(enderecoEditavel); // Salva no Firebase
  };

  // Função para salvar no Firebase
  const salvarEnderecoNoFirebase = async (endereco) => {
    try {
      const usuarioId = user.uid; // Use the authenticated user's ID
      await setDoc(doc(db, "enderecos", usuarioId), {
        endereco: endereco,
        timestamp: new Date(),
      });
      console.log("Endereço salvo no Firebase com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
    }
  };







  return ( 
    <Container maxWidth="md">
      {/* AÇÕES DO TOPO */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Ações Rápidas</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button variant="outlined" color="secondary" onClick={handleLogout} fullWidth>
              Sair
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" color="primary" onClick={() => navigate('/ocorrenciasMes')} fullWidth>
              Ocorrências do Mês
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" color="primary" onClick={() => navigate('/perfilUsuario')} fullWidth>
              Perfil do Usuário
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* REGISTRO DE OCORRÊNCIAS */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Registrar Ocorrências da sua Região
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Bem-vindo, {user.nome}
        </Typography>

        <List>
          {ocorrencias.map((o, index) => (
            <React.Fragment key={o.id}>
              <ListItem alignItems="flex-start">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={9}>
                    <Typography variant="body2"><strong>Protocolo:</strong> <strong> {o.protocolo || 'Não informado'}</strong>                                                                        </Typography>
                    <Typography variant="body2"><strong>Nome Ocorrência:</strong> {o.descricao}</Typography>
                    <Typography variant="body2"><strong>Descrição:</strong> {o.observacoes}</Typography>
                    <Typography variant="body2">
                      <strong>Gravidade:</strong> <GravidadeSpan gravidade={o.gravidade}>{o.gravidade}</GravidadeSpan>
                    </Typography>
                    <Typography variant="body2"><strong>Categoria:</strong> {o.categoria}</Typography>
                    <Typography variant="body2"><strong>Data:</strong> {o.data}</Typography>
                    <Typography variant="body2"><strong>Endereço da Ocorrência:</strong> {o.endereco}</Typography>
                    <Typography variant="body2"><strong>Tarefa:</strong> {o.tarefaEditada || 'Não selecionada'}</Typography>
                    <Typography variant="body2">
                      <strong>Execução:</strong> {o.dataTarefaExecutada ? new Date(o.dataTarefaExecutada).toLocaleString('pt-BR') : 'Data não disponível'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: getStatusColor(o.status) }}>
                      <strong>Status:</strong> {o.status || 'Pendente'}
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom><strong>Imagens:</strong></Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {imagensPorOcorrencia[o.id]?.map((img, imgIndex) => (
                        <Box key={`${img.id}-${imgIndex}`} position="relative" sx={{ width: 100, height: 100, overflow: 'hidden', borderRadius: '4px', border: '1px solid #ddd' }}>
                          <img
                            src={img.url}
                            alt={`Imagem da ocorrência ${o.id}, ${imgIndex + 1}`}
                            style={{ width: 100, height: 100, objectFit: 'cover' }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute', 
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(255,255,255,0.7)',
                              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                            }}
                            onClick={() => handleRemoveImage(o.id, img.id)}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      ))}
                            <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAddImage(o.id, e)}
                      style={{ display: "none" }}
                      id={`image-upload-${o.id}`}
                    />
                    <label htmlFor={`image-upload-${o.id}`}>
                      <Button fullWidth variant="outlined" component="span" startIcon={<AddPhotoAlternateIcon />}
                      color="warning"
                      >
                        Imagem
                      </Button>
                    </label>
                    </Box>

                    <Typography variant="body2"><strong>Imagens em Execução:</strong></Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {imagensExecucaoPorOcorrencia[o.id]?.map((img, index) => (
                        <Box key={index} sx={{ width: 100, height: 100 }}>
                          <img
                            src={img.url}
                            alt={`Execução ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={3}>
              
                    <Button fullWidth variant="outlined" color="primary" onClick={() => handleEditarClick(o.id)} sx={{ mt: 1 }}>
                      Editar
                    </Button>
                    <Button fullWidth variant="outlined" color="success" onClick={handleSalvarEdicao} sx={{ mt: 1 }}>
                      Salvar
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoverOcorrencia(o.id)}
                      startIcon={<RemoveCircleOutlineIcon />}
                      sx={{ mt: 1 }}
                    >
                      Remover
                    </Button>
                  </Grid>
                </Grid>
              </ListItem>
              {index < ocorrencias.length - 1 && <Divider sx={{ my: 2 }} />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* NOVA OCORRÊNCIA */}
      <Paper sx={{ p: 3, mb: 4 }} ref={novaOcorrenciaRef}>
        <Typography variant="h6">Nova Ocorrência</Typography>
        <TextField
          value={novaOcorrencia.descricao}
          onChange={(e) => setNovaOcorrencia({ ...novaOcorrencia, descricao: e.target.value })}
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
      </Paper>

      {/* DESCRIÇÃO ADICIONAL */}
      <Paper sx={{ p: 3, mb: 4 }} ref={descricaoOcorrenciasRef}>
        <Typography variant="h6">Descrição das Ocorrências</Typography>
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
      </Paper>

      {/* LOCALIZAÇÃO */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Localização da Ocorrência</Typography>
        <Button
  variant="contained"
  onClick={obterLocalizacao}
  sx={{ mb: 2, minWidth: '48px', padding: '8px' }}
>
  <LocationOnIcon />
</Button>

        {erroLocalizacao && <Typography color="error">{erroLocalizacao}</Typography>}

        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>Endereço:</strong> {endereco}
        </Typography>

        <TextField
          type="text"
          value={enderecoEditavel}
          onChange={handleEnderecoEdit}
          onBlur={salvarEnderecoEditado}
          placeholder="Digite o endereço manualmente"
          fullWidth
          label="Endereço Editável"
        />
      </Paper>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
}

const getStatusColor = (status) => {
  switch ((status || 'Pendente').toLowerCase()) {
    case 'pendente':
      return 'red';
    case 'concluído':
      return 'green';
    case 'em análise':
      return 'orange';
    default:
      return 'black';
  }
};

export default RegistroProblemas;