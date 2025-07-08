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
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'; // Import the new icon


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


  const apiKey = process.env.REACT_APP_Maps_API_KEY;

   // Crie as referências para as seções de destino
    const novaOcorrenciaRef = useRef(null);
    const descricaoOcorrenciasRef = useRef(null);


  async function handleLogout() {
    await logout();
  }



  const GravidadeSpan = styled('span')(({ gravidade }) => ({
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





  const handleAdicionarOcorrencia = async () => {
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleString();
    const enderecoAtual = enderecoEditavel.trim();

    // Verifica se a descrição da nova ocorrência não está vazia
    if (novaOcorrencia.descricao.trim()) {
      const nova = {
        usuarioId: user.uid,
        nomeUsuario: user.nome,
        descricao: novaOcorrencia.descricao,
        gravidade: novaOcorrencia.gravidade, // Inclui a gravidade
        endereco: enderecoAtual,
        observacoes,
        status: 'Pendente',
        data: dataFormatada,


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
      for (const o of ocorrencias) {
        const imgs = await getImages(o.id);
        loadedImages[o.id] = imgs;
      }
      setImagensPorOcorrencia(loadedImages);
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
        <Container maxWidth="sm">
            <Box sx={{ mb: 3 }}>
                <Button variant="outlined" color="secondary" onClick={handleLogout} fullWidth>
                    Sair
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/ocorrenciasMes')}
                    fullWidth
                >
                    Ver Ocorrências do Mês
                </Button>
                  <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/perfilUsuario')}
                  fullWidth
                  sx={{ mt: 1 }}
              >
                  Voltar ao Perfil
              </Button>
            </Box>

            <Paper sx={{ padding: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Registrar Ocorrências da sua Região
                </Typography>
                <Typography variant="subtitle1" gutterBottom> 
                    Bem-vindo, {user.nome}
                </Typography>

                <List>
                    {ocorrencias.map((o, index) => (
                        <React.Fragment key={o.id}>
                            <ListItem>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2">
                                            <strong>Nome Ocorrência:</strong> {o.descricao}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Descrição da Ocorrência:</strong> {o.observacoes}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Gravidade:</strong> <GravidadeSpan gravidade={o.gravidade}>{o.gravidade}</GravidadeSpan>
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Categoria da Descrição:</strong> {o.categoria}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Data e Horário  da Ocorrência:</strong> {o.data}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Endereço:</strong> {o.endereco}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Tarefa executada:</strong> {o.tarefaEditada || 'Não selecionada'}
                                        </Typography>

                                        <Typography variant="body2">
                                            <strong>Data da execução:</strong>
                                            {o.dataTarefaExecutada ?
                                                new Date(o.dataTarefaExecutada).toLocaleString('pt-BR') :
                                                'Data não disponível'}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: (() => {
                                                    const status = (o?.status || 'Pendente').trim().toLowerCase();
                                                    if (status === 'pendente') return 'red';
                                                    if (status === 'concluído') return 'green';
                                                    if (status === 'em análise') return 'orange';
                                                    return 'black';
                                                })(),
                                            }}
                                        >
                                            Status: {o?.status || 'Pendente'}
                                        </Typography>

                                        <Typography variant="body2">
                                            <strong>Imagens:</strong>
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                            {imagensPorOcorrencia[o.id]?.map((img) => (
                                                <Box key={img.id} position="relative" sx={{ m: 1 }}>
                                                    <img
                                                        src={img.url}
                                                        alt={`Imagem da ocorrência ${o.id}`}
                                                        style={{
                                                            width: 100,
                                                            height: 100,
                                                            objectFit: 'cover',
                                                            borderRadius: 4
                                                        }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            right: 0,
                                                            backgroundColor: 'rgba(255,255,255,0.7)'
                                                        }}
                                                        onClick={() => handleRemoveImage(o.id, img.id)}
                                                    >
                                                        <DeleteIcon fontSize="small" color="error" />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleAddImage(o.id, e)}
                                            style={{ display: "none" }}
                                            id={`image-upload-${o.id}`}
                                        />
                                        <label htmlFor={`image-upload-${o.id}`}>
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                startIcon={<AddPhotoAlternateIcon />}
                                            >
                                                Adicionar Imagem
                                            </Button>
                                        </label>
                                        <Button variant="outlined" color="primary" onClick={() => handleEditarClick(o.id)}>
                                            Editar
                                        </Button>
                                        <Button variant="outlined" color="success" onClick={handleSalvarEdicao}>
                                            Salvar
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleRemoverOcorrencia(o.id)}
                                            startIcon={<RemoveCircleOutlineIcon />}
                                        >
                                            Remover
                                        </Button>
                                    </Box>
                                </Box>
                            </ListItem>
                            {index < ocorrencias.length - 1 && <Divider sx={{ my: 2, borderColor: 'grey.700' }} />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            <Box mt={4} ref={novaOcorrenciaRef}> {/* Adicione a ref aqui */}
                <Typography variant="h6">Nova Ocorrência</Typography>
                <TextField
                    value={novaOcorrencia.descricao}
                    onChange={(e) => setNovaOcorrencia({ ...novaOcorrencia, descricao: e.target.value })}
                    fullWidth
                    variant="outlined"
                    label="Descrição da nova ocorrência"
                    margin="normal"
                />
               
                {/* O Box de botões para 'Adicionar Ocorrência' estava fora do Box pai da seção 'Nova Ocorrência'.
                    Movi-o para dentro para que o scrollIntoView funcione corretamente e a estrutura seja lógica. */}
                <Box mt={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button variant="contained" color="secondary" onClick={handleAdicionarOcorrencia}>
                        Adicionar Ocorrência
                    </Button>
                </Box>
            </Box> {/* Fechamento do Box de 'Nova Ocorrência' */}


            <Box mt={4} ref={descricaoOcorrenciasRef}> {/* Adicione a ref aqui */}
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
            </Box>

            <div>
                <h1>Localização</h1>
                <button onClick={obterLocalizacao}>Obter Localização</button>
                {erroLocalizacao && <p style={{ color: 'red' }}>{erroLocalizacao}</p>}

                <Typography variant="body2">
                    <strong>Endereço:</strong> {endereco}
                </Typography>

                <div>
                    <h2>Endereço Editável</h2>
                    <input
                        type="text"
                        value={enderecoEditavel}
                        onChange={handleEnderecoEdit}
                        onBlur={salvarEnderecoEditado} // Salva quando o campo perder o foco
                        placeholder="Digite o endereço manualmente"
                    />
                </div>
            </div>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Container>
    );
}

export default RegistroProblemas;