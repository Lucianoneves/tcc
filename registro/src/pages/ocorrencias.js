/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-no-undef */

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Checkbox, Button, TextField, Snackbar, List, ListItem, ListItemText, Divider, MenuItem, Box, IconButton, Paper, CircularProgress, Chip } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/system';
import DeleteIcon from '@mui/icons-material/Delete';
import { db, storage } from "../services/firebaseConnection";
import { doc, addDoc, collection, updateDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage, deleteObject } from "firebase/storage";
import { getAuth } from "firebase/auth";
// eslint-disable-next-line no-unused-vars
import MapaOcorrencias from './MapaOcorrencias';
// eslint-disable-next-line no-unused-vars
import { saveImage, getImages, deleteImage } from "./imageDB";
import * as THREE from 'three';
// Importe OrbitControls para permitir arrastar e girar a cena
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';



const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StatusSpan = styled('span')(({ status }) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
    backgroundColor:
        status === 'Em andamento' ? '#FFA500' :
            status === 'Pendente' ? '#f44336' :
                status === 'Concluído' ? '#4caf50' : '#9e9e9e'
}));

const GravidadeSpan = styled('span')(({ gravidade }) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
    backgroundColor:
        gravidade === 'Alta' ? '#f44336' :
            gravidade === 'Média' ? '#FFA500' :
                gravidade === 'Baixa' ? '#4caf50' : '#9e9e9e'
}));

const CATEGORIAS = [
    'Buraco na via',
    'Iluminação pública',
    'Vazamento de água',
    'Acúmulo de lixo',
    'Sinalização',
    'Podas de árvores',
    'Outros'
];

const GRAVIDADE = ['Baixa', 'Média', 'Alta'];

const Ocorrencias = () => {
    const navigate = useNavigate();
    const [ocorrencias, setOcorrencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [descricaoEditada, setdescricaoEditada] = useState('');
    const [tarefaEditada, setTarefaEditada] = useState('');
    const [statusEditado, setStatusEditado] = useState('');
    const [editandoOcorrencia, setEditandoOcorrencia] = useState(null);
    const [selecionadas, setSelecionadas] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const [imagensPorOcorrencia, setImagensPorOcorrencia] = useState({});
    const [categoriaEditada, setCategoriaEditada] = useState('');
    const [gravidadeEditada, setGravidadeEditada] = useState('');

    const [mostrarGraficos3D, setMostrarGraficos3D] = useState(false);
    const mountRef3D = useRef(null);

    const [dadosGraficoPorCategoria, setDadosGraficoPorCategoria] = useState({});
    const [dadosGraficoPorStatus, setDadosGraficoPorStatus] = useState({});
    const [dadosGraficoPorGravidade, setDadosGraficoPorGravidade] = useState({});
    const [adminNome, setAdminNome] = useState('');
    const [dataTarefaEditada, setDataTarefaEditada] = useState('');
    const graficosRef = useRef(null);  // Já existe no seu código, apenas certifique-se de usá-lo
    const [imagensExecucaoPorOcorrencia, setImagensExecucaoPorOcorrencia] = useState({});
    const [isUserInactive, setIsUserInactive] = useState(false);
    const inactivityTimeout = 15 * 60 * 1000; // 15 minutos em milissegundos

    useEffect(() => {
        let inactivityTimer;

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            setIsUserInactive(false);
            inactivityTimer = setTimeout(() => setIsUserInactive(true), inactivityTimeout);
        };

        // Eventos que resetam o temporizador (ex: clique, movimento do mouse, teclado)
        window.addEventListener('mousemove', resetInactivityTimer);
        window.addEventListener('keydown', resetInactivityTimer);
        window.addEventListener('click', resetInactivityTimer);

        // Inicia o temporizador
        resetInactivityTimer();

        // Limpeza ao desmontar o componente
        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', resetInactivityTimer);
            window.removeEventListener('keydown', resetInactivityTimer);
            window.removeEventListener('click', resetInactivityTimer);
        };
    }, []);


    // Função para obter uma cor baseada no status ou gravidade
    const getColorForData = (key, type) => {
        if (type === 'status') {
            switch (key) {
                case 'Concluído': return 0x4CAF50; // Verde
                case 'Em Andamento': return 0xFFA500; // Laranja
                case 'Pendente': return 0xF44336; // Vermelho
                default: return 0x9E9E9E; // Cinza
            }
        } else if (type === 'gravidade') {
            switch (key) {
                case 'Alta': return 0xF44336; // Vermelho
                case 'Média': return 0xFFA500; // Laranja
                case 'Baixa': return 0x4CAF50; // Verde
                default: return 0x9E9E9E; // Cinza
            }
        }
        return Math.random() * 0xffffff; // Cor aleatória para categorias
    };


    const renderizarCena3D = (dataCategoria, dataStatus, dataGravidade) => {
        if (!mountRef3D.current) {
            console.error("renderizarCena3D: mountRef3D.current é null.");
            return;
        }

        while (mountRef3D.current.firstChild) {
            mountRef3D.current.removeChild(mountRef3D.current.firstChild);
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        const width = mountRef3D.current.clientWidth;
        const height = mountRef3D.current.clientHeight;

        if (width === 0 || height === 0) {
            console.warn("renderizarCena3D: Largura ou altura do canvas é zero. Não vai renderizar a cena 3D.");
            return;
        }

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountRef3D.current.appendChild(renderer.domElement);

        // Controles de órbita para interação
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // para um movimento mais suave
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 10;
        controls.maxDistance = 50;

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // === GRÁFICO POR CATEGORIA ===

        // === GRÁFICO POR STATUS ===
        const maxStatusCount = Math.max(...Object.values(dataStatus));
        const statusScale = 5 / maxStatusCount;

        let xOffsetStatus = -10; // Posição inicial
        Object.entries(dataStatus).forEach(([status, count]) => {
            const barHeight = count * statusScale;
            const geometry = new THREE.BoxGeometry(1.5, barHeight, 1.5);
            const material = new THREE.MeshLambertMaterial({ color: getColorForData(status, 'status') });
            const bar = new THREE.Mesh(geometry, material);
            bar.position.set(xOffsetStatus, barHeight / 2, 0); // No meio
            scene.add(bar);
            xOffsetStatus += 2.5;
        });

        // === GRÁFICO POR GRAVIDADE ===
        const maxGravidadeCount = Math.max(...Object.values(dataGravidade));
        const gravidadeScale = 5 / maxGravidadeCount;

        let xOffsetGravidade = -10; // Posição inicial
        Object.entries(dataGravidade).forEach(([gravidade, count]) => {
            const barHeight = count * gravidadeScale;
            const geometry = new THREE.BoxGeometry(1.5, barHeight, 1.5);
            const material = new THREE.MeshLambertMaterial({ color: getColorForData(gravidade, 'gravidade') });
            const bar = new THREE.Mesh(geometry, material);
            bar.position.set(xOffsetGravidade, barHeight / 2, 5); // Mais para frente
            scene.add(bar);
            xOffsetGravidade += 2.5;
        });


        // Posição da câmera para ver todos os gráficos
        camera.position.set(-5, 10, 15); // Ajuste a posição para ver todos
        camera.lookAt(0, 2, 0); // Aponta a câmera para o centro dos gráficos

        const animate = () => {
            if (!mountRef3D.current || !mountRef3D.current.contains(renderer.domElement)) {
                return;
            }
            requestAnimationFrame(animate);
            scene.rotation.y += 0.005;
            controls.update(); // Atualiza os controles
            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (mountRef3D.current) {
                const newWidth = mountRef3D.current.clientWidth;
                const newHeight = mountRef3D.current.clientHeight;
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef3D.current && renderer.domElement.parentNode === mountRef3D.current) {
                mountRef3D.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            controls.dispose(); // Limpa os controles
        };
    };

    useEffect(() => {
        const nome = localStorage.getItem('adminNome');
        if (nome) {
            setAdminNome(nome);
        } else {
            navigate('/login');
        }

        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            navigate('/login');
        }
    }, [navigate]);



    const handleAddImagemExecucao = async (ocorrenciaId, event) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        if (!file.type.match('image.*')) {
            toast.error('Por favor, selecione um arquivo de imagem válido');
            return;
        }

        try {
            // Usamos um prefixo "execucao_" para diferenciar das imagens normais
            const savedImage = await saveImage(file, `execucao_${ocorrenciaId}`);

            setImagensExecucaoPorOcorrencia(prev => ({
                ...prev,
                [ocorrenciaId]: [...(prev[ocorrenciaId] || []), savedImage]
            }));

            toast.success('Imagem de execução adicionada com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar imagem de execução:", error);
            toast.error('Erro ao salvar a imagem de execução');
        }
    };


    const handleRemoveImagemExecucao = async (ocorrenciaId, imageId) => {
        try {
            const confirmacao = window.confirm('Tem certeza que deseja remover esta imagem de execução?');
            if (!confirmacao) return;

            await deleteImage(imageId);

            setImagensExecucaoPorOcorrencia(prev => ({
                ...prev,
                [ocorrenciaId]: prev[ocorrenciaId].filter(img => img.id !== imageId)
            }));

            toast.success('Imagem de execução removida com sucesso!');
        } catch (error) {
            console.error("Erro ao remover imagem de execução:", error);
            toast.error('Erro ao remover a imagem de execução');
        }
    };

    useEffect(() => {
        const loadImages = async () => {
            const loadedImages = {};
            const loadedExecucaoImages = {};

            for (const o of ocorrencias) {
                // Imagens normais
                const imgs = await getImages(o.id);
                loadedImages[o.id] = imgs;

                // Imagens de execução (com prefixo)
                const execImgs = await getImages(`execucao_${o.id}`);
                loadedExecucaoImages[o.id] = execImgs;
            }

            setImagensPorOcorrencia(loadedImages);
            setImagensExecucaoPorOcorrencia(loadedExecucaoImages);
        };

        if (ocorrencias.length > 0) {
            loadImages();
        }
    }, [ocorrencias]);


    useEffect(() => {
        let unsubscribeUsers;
        let unsubscribeOcorrencias;
        let mounted = true; // Flag para verificar se o componente ainda está montado

        const loadData = async () => {
            try {
                setLoading(true);

                // 1. Carrega todos os usuários primeiro
                unsubscribeUsers = onSnapshot(collection(db, "users"), (usersSnapshot) => {
                    if (!mounted) return;

                    const usersMap = {};
                    usersSnapshot.forEach((userDoc) => {
                        usersMap[userDoc.id] = userDoc.data().nome || userDoc.data().displayName || "Usuário não identificado";
                    });

                    // 2. Carrega as ocorrências com os nomes
                    unsubscribeOcorrencias = onSnapshot(collection(db, "ocorrencias"), (ocorrenciasSnapshot) => {
                        if (!mounted) return;

                        const ocorrenciasAtualizadas = ocorrenciasSnapshot.docs
                            .map((doc) => {
                                const data = doc.data();
                                return {
                                    id: doc.id,
                                    ...data,
                                    nomeUsuario: usersMap[data.usuarioId] || "Usuário Inativo",
                                };
                            })
                            .filter((oc) => oc.status !== "Concluído"); // <- aqui está o filtro

                        setOcorrencias(ocorrenciasAtualizadas);
                        setLoading(false);
                    });
                });
            } catch (error) {
                if (mounted) {
                    console.error("Erro ao carregar dados:", error);
                    setLoading(false);
                    setSnackbarMessage('Erro ao carregar ocorrências');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                }
            }
        };

        loadData();

        return () => {
            mounted = false;
            if (unsubscribeUsers) unsubscribeUsers();
            if (unsubscribeOcorrencias) unsubscribeOcorrencias();
        };
    }, []);

    useEffect(() => {
        const loadImages = async () => {
            const loadedImages = {};
            for (const o of ocorrencias) {
                const imgs = await getImages(o.id);
                loadedImages[o.id] = imgs;
            }
            setImagensPorOcorrencia(loadedImages);
        };

        if (ocorrencias.length > 0) {
            loadImages();
        }
    }, [ocorrencias]);

    useEffect(() => {
        const aggregateData = () => {
            const countsByCategory = {};
            const countsByStatus = {};
            const countsByGravidade = {};

            ocorrencias.forEach(oc => {
                countsByCategory[oc.categoria] = (countsByCategory[oc.categoria] || 0) + 1;
                countsByStatus[oc.status] = (countsByStatus[oc.status] || 0) + 1;
                countsByGravidade[oc.gravidade] = (countsByGravidade[oc.gravidade] || 0) + 1;
            });

            setDadosGraficoPorCategoria(countsByCategory);
            setDadosGraficoPorStatus(countsByStatus);
            setDadosGraficoPorGravidade(countsByGravidade);
        };

        if (ocorrencias.length > 0) {
            aggregateData();
        }
    }, [ocorrencias]);

    useEffect(() => {
        if (mostrarGraficos3D && !loading && ocorrencias.length > 0) {
            console.log("Iniciando renderização da cena 3D...");
            // Chama a função de renderização da cena 3D, passando os dados
            const cleanup = renderizarCena3D(
                dadosGraficoPorCategoria,
                dadosGraficoPorStatus,
                dadosGraficoPorGravidade
            );
            return cleanup;
        }
        return () => {
            if (mountRef3D.current) {
                while (mountRef3D.current.firstChild) {
                    mountRef3D.current.removeChild(mountRef3D.current.firstChild);
                }
            }
        };
    }, [mostrarGraficos3D, loading, ocorrencias, dadosGraficoPorCategoria, dadosGraficoPorStatus, dadosGraficoPorGravidade]);


    const handleSalvarEdicao = async (id) => {
        try {
            await updateDoc(doc(db, "ocorrencias", id), {
                descricao: descricaoEditada,
                status: statusEditado,
                tarefaEditada: tarefaEditada,
                dataTarefaExecutada: new Date().toISOString(),
                categoria: categoriaEditada,
                gravidade: gravidadeEditada
            });

            setOcorrencias(prev => prev.map(ocorrencia =>
                ocorrencia.id === id ? {
                    ...ocorrencia,
                    descricao: descricaoEditada,
                    status: statusEditado,
                    dataResolucao: new Date().toISOString(),
                    tarefaEditada: tarefaEditada,
                    dataTarefaExecutada: new Date().toISOString(),
                    categoria: categoriaEditada,
                    gravidade: gravidadeEditada
                } : ocorrencia
            ));

            setEditandoOcorrencia(null);
            setSnackbarMessage('Ocorrência atualizada com sucesso!');
            setSnackbarSeverity('success');
        } catch (error) {
            console.error("Erro ao editar ocorrência:", error);
            setSnackbarMessage('Erro ao editar a ocorrência.');
            setSnackbarSeverity('error');
        }
        setSnackbarOpen(true);
    };

    const handleCheckboxChange = (id) => {
        setSelecionadas((prevSelecionadas) =>
            prevSelecionadas.includes(id)
                ? prevSelecionadas.filter((item) => item !== id)
                : [...prevSelecionadas, id]
        );
    };

    const handleSelectAll = () => {
        setSelecionadas(ocorrencias.map((ocorrencia) => ocorrencia.id));
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    const handleSair = () => {
        localStorage.removeItem('isAdmin');
        navigate('/login');
    };

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ ml: 2 }}>Carregando ocorrências...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Gerenciar Ocorrências</Typography>
                <Button onClick={handleSair} variant="outlined" color="secondary">
                    Sair
                </Button>
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                Logado como: <strong>{adminNome}</strong>
                <Chip label="Administrador" color="primary" size="small" />
            </Typography>

            {/* Seção de Gráficos 3D */}
            {mostrarGraficos3D && (
                <Paper ref={graficosRef} elevation={3} sx={{ p: 3, mb: 4, borderRadius: '8px' }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>Visualização 3D das Ocorrências</Typography>
                    <Box sx={{
                        height: '600px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        p: 3,
                        mb: 4,
                        scrollMarginTop: '20px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px'
                    }}>
                        {ocorrencias.length === 0 ? (
                            <Typography variant="body1">Nenhuma ocorrência para exibir no gráfico 3D.</Typography>
                        ) : (
                            <>
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 3 }}>
                                    <Typography variant="h6" sx={{ width: '100%', textAlign: 'center', mb: 2 }}>Status das Ocorrências</Typography>
                                    {Object.entries(dadosGraficoPorStatus).map(([status, count]) => (
                                        <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: `#${getColorForData(status, 'status').toString(16).padStart(6, '0')}` }} />
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{status}:</Typography>
                                            <Typography variant="body2">{count} ocorrência(s)</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <Divider sx={{ width: '80%', my: 2 }} />

                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 3 }}>
                                    <Typography variant="h6" sx={{ width: '100%', textAlign: 'center', mb: 2 }}>Gravidade das Ocorrências</Typography>
                                    {Object.entries(dadosGraficoPorGravidade).map(([gravidade, count]) => (
                                        <Box key={gravidade} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: `#${getColorForData(gravidade, 'gravidade').toString(16).padStart(6, '0')}` }} />
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{gravidade}:</Typography>
                                            <Typography variant="body2">{count} ocorrência(s)</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Placeholder para o gráfico 3D real */}
                                <Box ref={mountRef3D} sx={{
                                    width: '100%',
                                    height: 'calc(100% - 200px)',
                                    minHeight: '300px',
                                    backgroundColor: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    border: '1px dashed #ccc'
                                }}>
                                    <Typography variant="h6" color="text.secondary">Gráfico 3D seria renderizado aqui</Typography>
                                </Box>
                            </>
                        )}
                    </Box>
                </Paper>
            )}

            <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                <Button
                    onClick={() => navigate('/MapaOcorrencias')}
                    variant="contained"
                    color="primary"
                    sx={{ minWidth: '200px', py: 1.5 }}
                >
                    Ver Mapa de Ocorrências
                </Button>
                <Button
                    onClick={() => navigate('/adminAvaliacaoFeedback')}
                    variant="contained"
                    color="info"
                    sx={{ minWidth: '200px', py: 1.5 }}
                >
                    Ver Avaliações e Feedbacks
                </Button>
                <Button
                    onClick={() => navigate('/adminPesquisas')}
                    variant="contained"
                    color="secondary"
                    sx={{ minWidth: '200px', py: 1.5 }}
                >
                    Ver Respostas das Pesquisas
                </Button>
                <Button
                    onClick={() => {
                        setMostrarGraficos3D(!mostrarGraficos3D);
                        if (!mostrarGraficos3D && graficosRef.current) {
                            graficosRef.current.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    }}
                    variant="contained"
                    color={mostrarGraficos3D ? "error" : "success"}
                    sx={{ minWidth: '200px', py: 1.5 }}
                >
                    {mostrarGraficos3D ? "Ocultar Gráficos 3D" : "Ver Gráficos 3D"}
                </Button>
                <Button
                    onClick={() => navigate('/ocorrencias-concluidas')}
                    variant="contained"
                    color="success"
                    sx={{ minWidth: '200px', py: 1.5 }}
                >
                    Ver Ocorrências Concluídas
                </Button>

            </Box>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>Lista de Ocorrências</Typography>
            <Paper elevation={2} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                <List>
                    {ocorrencias.length === 0 && (
                        <ListItem>
                            <ListItemText primary="Nenhuma ocorrência encontrada." sx={{ textAlign: 'center', py: 3 }} />
                        </ListItem>
                    )}
                    {ocorrencias.map((ocorrencia, index) => (
                        <React.Fragment key={ocorrencia.id}>
                            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                                {editandoOcorrencia === ocorrencia.id ? (
                                    <Box sx={{ width: '100%', '& .MuiTextField-root': { mb: 2 } }}>
                                        <TextField
                                            value={descricaoEditada}
                                            onChange={(e) => setdescricaoEditada(e.target.value)}
                                            fullWidth
                                            label="Descrição da Ocorrência"
                                            margin="normal"
                                            variant="outlined"
                                        />
                                        <TextField
                                            value={tarefaEditada}
                                            onChange={(e) => setTarefaEditada(e.target.value)}
                                            fullWidth
                                            label="Tarefa Executada"
                                            margin="normal"
                                            variant="outlined"
                                        />
                                        <TextField
                                            type="datetime-local"
                                            value={dataTarefaEditada}
                                            onChange={(e) => setDataTarefaEditada(e.target.value)}
                                            fullWidth
                                            label="Data da Execução"
                                            margin="normal"
                                            InputLabelProps={{ shrink: true }}
                                            variant="outlined"
                                        />
                                        <TextField
                                            value={statusEditado}
                                            onChange={(e) => setStatusEditado(e.target.value)}
                                            fullWidth
                                            label="Status"
                                            select
                                            margin="normal"
                                            variant="outlined"
                                        >
                                            <MenuItem value="Pendente">Pendente</MenuItem>
                                            <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                                            <MenuItem value="Concluído">Concluído</MenuItem>
                                        </TextField>
                                        <TextField
                                            select
                                            label="Categoria"
                                            value={categoriaEditada}
                                            onChange={(e) => setCategoriaEditada(e.target.value)}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                        >
                                            {CATEGORIAS.map((cat) => (
                                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            select
                                            label="Gravidade"
                                            value={gravidadeEditada}
                                            onChange={(e) => setGravidadeEditada(e.target.value)}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                        >
                                            {GRAVIDADE.map((g) => (
                                                <MenuItem key={g} value={g}>{g}</MenuItem>
                                            ))}
                                        </TextField>
                                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                            <Button
                                                onClick={() => handleSalvarEdicao(ocorrencia.id)}
                                                variant="contained"
                                                color="primary"
                                            >
                                                Salvar
                                            </Button>
                                            <Button
                                                onClick={() => setEditandoOcorrencia(null)}
                                                variant="outlined"
                                                color="secondary"
                                            >
                                                Cancelar
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ width: '100%' }}>
                                        <ListItemText
                                            primary={
                                                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                                                    {ocorrencia.descricao}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                                                        <StatusSpan status={ocorrencia.status}>{ocorrencia.status}</StatusSpan>
                                                        <GravidadeSpan gravidade={ocorrencia.gravidade}>{ocorrencia.gravidade}</GravidadeSpan>
                                                        <Chip label={ocorrencia.categoria} size="small" />
                                                    </Box>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Protocolo:</strong> {ocorrencia.protocolo || 'Não informado'}</Typography>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Enviado por:</strong> {ocorrencia.nomeUsuario}</Typography>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Data da Ocorrência:</strong> {ocorrencia.data || 'Não selecionada'}</Typography>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Endereço:</strong> {ocorrencia.endereco || 'Não selecionada'}</Typography>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Descrição do usuário:</strong> {ocorrencia.observacoes || 'Não selecionada'}</Typography>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Tarefa executada:</strong> {ocorrencia.tarefaEditada || 'Não executada'}</Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <strong>Data da execução:</strong> {' '}
                                                        {ocorrencia.dataTarefaExecutada ?
                                                            new Date(ocorrencia.dataTarefaExecutada).toLocaleString('pt-BR') :
                                                            'Não executada'}
                                                    </Typography>

                                                    {/* Imagens do Usuário */}
                                                    {imagensPorOcorrencia[ocorrencia.id] && imagensPorOcorrencia[ocorrencia.id].length > 0 && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Typography variant='subtitle2' gutterBottom><strong>Imagens do Usuário:</strong></Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {imagensPorOcorrencia[ocorrencia.id].map((img, imgIndex) => (
                                                                    <Box key={imgIndex} sx={{ width: 100, height: 100, overflow: 'hidden', borderRadius: '4px', border: '1px solid #ddd' }}>
                                                                        <img
                                                                            src={img.url}
                                                                            alt={`Imagem Usuário ${imgIndex + 1}`}
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        />
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}

                                                    {/* Imagens em Execução */}
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant='subtitle2' gutterBottom><strong>Imagens em Execução:</strong></Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {imagensExecucaoPorOcorrencia[ocorrencia.id]?.map((img, imgIndex) => (
                                                                <Box key={imgIndex} position="relative" sx={{ width: 100, height: 100, overflow: 'hidden', borderRadius: '4px', border: '1px solid #ddd' }}>
                                                                    <img
                                                                        src={img.url}
                                                                        alt={`Imagem Execução ${imgIndex + 1}`}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                                                                        onClick={() => handleRemoveImagemExecucao(ocorrencia.id, img.id)}
                                                                    >
                                                                        <DeleteIcon fontSize="small" color="error" />
                                                                    </IconButton>
                                                                </Box>
                                                            ))}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleAddImagemExecucao(ocorrencia.id, e)}
                                                                style={{ display: "none" }}
                                                                id={`execucao-upload-${ocorrencia.id}`}
                                                            />
                                                            <label htmlFor={`execucao-upload-${ocorrencia.id}`}>
                                                                <Button
                                                                    variant="outlined"
                                                                    component="span"
                                                                    startIcon={<AddPhotoAlternateIcon />}
                                                                    color="warning"
                                                                    sx={{ width: 100, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
                                                                >
                                                                    Adicionar
                                                                </Button>
                                                            </label>
                                                        </Box>
                                                    </Box>
                                                </>
                                            }
                                        />
                                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                            <Button
                                                onClick={() => {
                                                    setdescricaoEditada(ocorrencia.descricao);
                                                    setTarefaEditada(ocorrencia.tarefaEditada || '');
                                                    setStatusEditado(ocorrencia.status || 'Pendente');
                                                    setEditandoOcorrencia(ocorrencia.id);
                                                    setDataTarefaEditada(ocorrencia.dataTarefaExecutada ?
                                                        new Date(ocorrencia.dataTarefaExecutada).toISOString().slice(0, 16) :
                                                        new Date().toISOString().slice(0, 16));
                                                    setCategoriaEditada(ocorrencia.categoria || 'Outros');
                                                    setGravidadeEditada(ocorrencia.gravidade || '');
                                                }}
                                                variant="contained"
                                                color="info"
                                            >
                                                Editar Ocorrência
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </ListItem>
                            {index < ocorrencias.length - 1 && <Divider component="li" sx={{ my: 2, borderColor: 'grey.300' }} />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default Ocorrencias;