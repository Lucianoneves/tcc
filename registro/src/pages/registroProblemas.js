import React, { useState, useEffect, useContext } from 'react';
import { Button, Checkbox, FormControlLabel, TextField, Typography, Container, Box, List, ListItem, IconButton, Grid, Paper, Input, Snackbar, } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import '../styles/registroProblemas.css';
import { AuthContext } from '../contexts/auth';
import { collection, doc, getDoc, setDoc, addDoc, query, where, getDocs, deleteDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../services/firebaseConnection";
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { toast } from 'react-toastify';
import { saveImage, getImages, deleteImage } from "./imageDB";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";









function RegistroProblemas() {

  const navigate = useNavigate(); // Hook para redirecionamento
  const [ocorrencias, setOcorrencias] = useState([]);
  const [novaOcorrencia, setNovaOcorrencia] = useState('');
  const [selecionadas, setSelecionadas] = useState([]);
  const [localizacao, setLocalizacao] = useState('');
  const [erroLocalizacao, setErroLocalizacao] = useState(null);
  const [enderecoEditavel, setEnderecoEditavel] = useState('');
  const [endereco, setEndereco] = useState('');
  const [resultadoEndereco, setResultadoEndereco] = useState('');
  const [melhoria, setMelhoria] = useState('');
  const [imagensPorOcorrencia, setImagensPorOcorrencia] = useState({});
  const [imagem, setImagem] = useState(null);
  const [imagens, setImagens] = useState([]);
  const { user, logout, handleReg } = useContext(AuthContext);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
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

      // Atualiza o estado com as ocorrências filtradas
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

  function marcarParaEditar(ocorrencia) {
    // Lógica para editar a ocorrência
    setOcorrencia(ocorrencia);
    console.log(ocorrencia);
  }




  const handleAdicionarOcorrencia = async () => {
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleString();
    // Armazena o endereço antes de limpar o estado
    const enderecoAtual = enderecoEditavel.trim();


    setEndereco("");
    setEnderecoEditavel(""); // Limpa o campo editável também






    // Verifica se a descrição da nova ocorrência não está vazia  ou fixada 
    if (novaOcorrencia.trim()) {
      const nova = {
        usuarioId: user.uid,
        nomeUsuario: user.nome,
        descricao: novaOcorrencia,
        endereco: enderecoAtual,
        observacoes,
        status: '',
        data: dataFormatada,
        media: [],
      };

      // Função para editar o endereço de uma ocorrência específica
      const editarEnderecoOcorrencia = (id, novoEndereco) => {
        setOcorrencias((prevOcorrencias) =>
          prevOcorrencias.map((ocorrencia) =>
            ocorrencia.id === id ? { ...ocorrencia, endereco: novoEndereco } : ocorrencia
          )
        );
      };

      try {
        const docRef = await addDoc(collection(db, "ocorrencias"), nova);

        if (selectedFile) {
          const fileRef = ref(storage, `ocorrencias/${docRef.id}/${selectedFile.name}`);
          await uploadBytes(fileRef, selectedFile);
          const fileURL = await getDownloadURL(fileRef);
          await updateDoc(doc(db, "ocorrencias", docRef.id), { media: [fileURL] });
        }

        setOcorrencias((prev) => [...prev, { id: docRef.id, ...nova }]);
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





  const handleEditarOcorrencia = async (id) => {
    const ocorrenciaRef = doc(db, "ocorrencias", id); // Referência para a ocorrência que será editada

    // Atualizando os campos da ocorrência
    try {
      await updateDoc(ocorrenciaRef, {
        descricao: novaOcorrencia, // Atualiza a descrição
        observacoes: observacoes,  // Atualiza as observações
        status: o.status,          // Atualiza o status
        nomeUsuario: user.nome,
        endereco: endereco, // Atualiza o endereço
      });

      setOcorrencias((prev) =>
        prev.map((ocorrencia) =>
          ocorrencia.id === id ? { ...ocorrencia, endereco } : ocorrencia
        )
      );


      setSnackbarMessage('Ocorrência editada com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Erro ao editar ocorrência: ", error);
      setSnackbarMessage('Erro ao editar a ocorrência.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };



  const handleEditarClick = (id) => {
    const ocorrenciaSelecionada = ocorrencias.find((ocorrencia) => ocorrencia.id === id);

    if (ocorrenciaSelecionada) {
      setOcorrenciaEditar(ocorrenciaSelecionada); // Preenche o estado com a ocorrência selecionada
      setNovaOcorrencia(ocorrenciaSelecionada.descricao); // Preenche o campo de descrição
      setObservacoes(ocorrenciaSelecionada.observacoes); // Preenche o campo de observações
      setEndereco(ocorrenciaSelecionada.endereco); // Preenche o campo de endereço específico
    }
  };




  const handleSalvarEdicao = async () => {
    if (ocorrenciaEditar) {
      try {
        const novaOcorrenciaRef = doc(db, "ocorrencias", ocorrenciaEditar.id);
        await updateDoc(novaOcorrenciaRef, {
          descricao: novaOcorrencia,
          observacoes: observacoes,
          nomeUsuario: user.nome,
          endereco: endereco, // Atualiza o endereço específico da ocorrência
        });

        const novaListaOcorrencias = ocorrencias.map((ocorrencia) => {
          if (ocorrencia.id === ocorrenciaEditar.id) {
            return {
              ...ocorrencia,
              descricao: novaOcorrencia,
              observacoes: observacoes,
              nomeUsuario: user.nome,
              endereco: endereco, // Atualiza o endereço da ocorrência
            };
          }
          return ocorrencia;
        });

        setOcorrencias(novaListaOcorrencias); // Atualiza a lista de ocorrências
        setNovaOcorrencia("");
        setObservacoes("");
        setOcorrenciaEditar(null);
        setEndereco(""); // Limpa o endereço após salvar
      } catch (error) {
        console.error("Erro ao salvar edição:", error);
      }
    }
  };




  const handleRemoverOcorrencia = async (id) => {
    try {
      // Remover do Firestore
      const ocorrenciaRef = doc(db, "ocorrencias", id);
      await deleteDoc(ocorrenciaRef);

      // Remover do estado e atualizar localStorage
      setOcorrencias((prev) => prev.filter((o) => o.id !== id));
      localStorage.setItem('ocorrencias', JSON.stringify(ocorrencias.filter((o) => o.id !== id)));

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
          endereco: endereco,
          data: new Date().toISOString(),
          descricao: o.descricao,
          tarefaEditada: ocorrencia.tarefaEditada,
          localizacao: localizacao || '',
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




  // Estado para controlar os checkboxes


  // Função para alternar o estado do checkbox
  const handleCheckboxChange = (id) => {
    setSelecionadas((prevSelecionadas) =>
      prevSelecionadas.includes(id)
        ? prevSelecionadas.filter((itemId) => itemId !== id)  // Remove se já estiver selecionado
        : [...prevSelecionadas, id]  // Adiciona se não estiver selecionado
    );
  };




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
      const usuarioId = "usuario123"; // Substitua pelo ID real do usuário autenticado
      await setDoc(doc(db, "enderecos", usuarioId), {
        endereco: endereco,
        timestamp: new Date(),
      });
      console.log("Endereço salvo no Firebase com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
    }
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
          tarefaEditada: ocorrencia.tarefaEditada,
          localizacao: localizacao || "Não especificada",
          endereco: endereco,
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



  const handleDateChange = (e) => {
    setDataOcorrencia(e.target.value);
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
      </Box>

      <Paper sx={{ padding: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Registrar Ocorrências da sua Região
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Bem-vindo, {user.nome}
        </Typography>

        <List>
          {ocorrencias.map((o) => (
            <ListItem key={o.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Box>
                  <Typography variant="body2">
                    <strong>Ocorrência:</strong> {o.descricao}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Descrição da Ocorrência:</strong> {o.observacoes}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Data da Ocorrência:</strong> {o.data}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Endereço:</strong> {o.endereco}
                  </Typography>
                  <Typography variant="body2"></Typography>
                  <strong>Tarefa executada:</strong> {o.tarefaEditada || 'Não selecionada'}
                  <Typography variant="body2"></Typography>

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
                          src={img.url}  // Usando a URL diretamente
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
                <Box>
                  <Button variant="outlined" color="primary" onClick={() => handleEditarClick(o.id)}>
                    Editar
                  </Button>
                  <Button variant="outlined" color="success" onClick={handleSalvarEdicao}>
                    Salvar
                  </Button>
                </Box>
              </Box>
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

    </Container>
  )
}



export default RegistroProblemas;


