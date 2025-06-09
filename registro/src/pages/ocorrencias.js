import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Checkbox, Button, TextField, Snackbar, List, ListItem, ListItemText, Divider, MenuItem, Box, IconButton } from '@mui/material'; // Importando componentes do Material-UI
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/system';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import { db, storage } from "../services/firebaseConnection";
import { doc, addDoc, collection, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage, deleteObject } from "firebase/storage";
import { getAuth } from "firebase/auth";
import MapaOcorrencias from './MapaOcorrencias';
import { saveImage, getImages, deleteImage } from "./imageDB";

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
    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [ocorrencias, setOcorrencias] = useState([]);
    const [descricaoVisible, setDescricaoVisible] = useState(false);
    const [ocorrenciaExecutada, setOcorrenciaExecutada] = useState('');
    const [dataTarefaEditada, setDataTarefaEditada] = useState('');
    const [descricaoEditada, setdescricaoEditada] = useState('');
    const [tarefaEditada, setTarefaEditada] = useState('');
    const [statusEditado, setStatusEditado] = useState('');
    const [editandoOcorrencia, setEditandoOcorrencia] = useState(null);
    const [selecionadas, setSelecionadas] = useState([]);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const auth = getAuth();
    const user = auth.currentUser;
    const [observacoes, setObservacoes] = useState('');
    const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminNome, setAdminNome] = useState('');
    const [usuarios, setUsuarios] = useState();
    const [userNome, setUserNome] = useState('');
    const [imagensPorOcorrencia, setImagensPorOcorrencia] = useState({}); // Estado para armazenar as imagens por ocorrência    
    const [images, setImages] = useState('');
    const [o, setO] = useState({});
    const [imagem, setImagem] = useState(null);
    const [imagemURL, setImagemURL] = useState(null);
    const { imagens, setImagens } = useState(null);
    const [ocorrencia, setOcorrencia] = useState(null);
    const [img, setImg] = useState(null);
    const [imgURL, setImgURL] = useState(null);
    const [categoria, setCategoria] = useState('');
    const [gravidade, setGravidade] = useState('');
    const [categoriaEditada, setCategoriaEditada] = useState('');
    const [gravidadeEditada, setGravidadeEditada] = useState('');





    const handleNavigateToMap = () => {
        navigate('/MapaOcorrencias');
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

    useEffect(() => {
        const user = getAuth().currentUser;
        if (!user) return;

        const unsubscribe = onSnapshot(collection(db, "ocorrencias"), (snapshot) => {
            const ocorrenciasAtualizadas = snapshot.docs.map((doc) => {
                const ocorrenciaData = doc.data();
                return {
                    id: doc.id,
                    ...ocorrenciaData,
                    nomeUsuario:
                        ocorrenciaData.usuarioId === user.uid
                            ? user.displayName || "Usuário sem nome"
                            : "Usuário desconhecido",
                };
            });
            setOcorrencias(ocorrenciasAtualizadas);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const ocorrenciasSalvas = localStorage.getItem('ocorrencias');
        if (ocorrenciasSalvas && Array.isArray(usuarios) && usuarios.length > 0) {
            const ocorrencias = JSON.parse(ocorrenciasSalvas);
            const ocorrenciasComUsuarios = ocorrencias.map((ocorrencia) => {
                const usuarioEncontrado = usuarios.find((u) => u.id === ocorrencia.usuarioId);
                return {
                    ...ocorrencia,
                    nomeUsuario: ocorrencia.nomeUsuario || "Usuário desconhecido",
                    data: new Date().toISOString(),
                };
            });
            setOcorrencias(ocorrenciasComUsuarios);
        }
    }, [usuarios]);

    useEffect(() => {
        if (ocorrencias.length > 0) {
            localStorage.setItem('ocorrencias', JSON.stringify(ocorrencias));
        }
    }, [ocorrencias]);

    useEffect(() => {
        const loadImages = async () => {
            const loadedImages = {};
            for (const o of ocorrencias) {
                const imgs = await getImages(o.id); // Certifique-se que esta função existe
                loadedImages[o.id] = imgs;
            }
            setImagensPorOcorrencia(loadedImages);
        };

        if (ocorrencias.length > 0) {
            loadImages();
        }
    }, [ocorrencias]);



    const handleSalvarEdicao = async (id) => {
        try {
            await updateDoc(doc(db, "ocorrencias", id), {
                descricao: descricaoEditada,
                status: statusEditado,
                tarefaEditada: tarefaEditada,
                images: images,
                dataTarefaExecutada: new Date().toISOString(),
                categoria: categoriaEditada,
                gravidade: gravidadeEditada
            });

            setOcorrencias(prev => prev.map(ocorrencia =>
                ocorrencia.id === id ? {
                    ...ocorrencia,
                    descricao: descricaoEditada,
                    images: images,
                    status: statusEditado,
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

    const handleExecucao = async () => {
        if (ocorrenciaExecutada.trim()) {
            const nova = {
                descricao: ocorrenciaExecutada,
                dataTarefaExecutada: new Date().toISOString(),
                status: 'Pendente',
                data: new Date().toISOString(),
                usuarioId: user.uid,
                nomeUsuario: user.displayName || "Usuário sem nome",
                localizacao: 'Rua XYZ, Bairro ABC',
                observacoes,
                tarefaEditada: tarefaEditada,
                images: images,
                categoria: categoria,
                gravidade: gravidade
            };

            try {
                const docRef = await addDoc(collection(db, "ocorrencias"), nova);
                setOcorrencias((prev) => [...prev, { id: docRef.id, ...nova }]);
                setOcorrenciaExecutada('');
                setSnackbarMessage('Ocorrência adicionada com sucesso!');
                setSnackbarSeverity('success');
            } catch (error) {
                console.error("Erro ao adicionar ocorrência:", error);
                setSnackbarMessage('Erro ao adicionar a ocorrência.');
                setSnackbarSeverity('error');
            }
            setSnackbarOpen(true);
        } else {
            setSnackbarMessage('Descreva a ocorrência antes de enviar.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "ocorrencias"), (snapshot) => {
            const ocorrenciasAtualizadas = snapshot.docs.map((doc) => ({
                id: doc.id,
                descricao: doc.data().descricao,
                tarefaEditada: doc.data().tarefaEditada,
                dataTarefaExecutada: doc.data().dataTarefaExecutada,
                status: doc.data().status,
                observacoes: doc.data().observacoes,
                data: doc.data().data,
                usuarioId: doc.data().usuarioId,
                nomeUsuario: doc.data().nomeUsuario,
                endereco: doc.data().endereco,
                categoria: doc.data().categoria || 'Outros',
                gravidade: doc.data().gravidade || ''
            }));
            setOcorrencias(ocorrenciasAtualizadas);
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = () => {
        const ocorrenciasComData = ocorrencias.filter((ocorrencia) =>
            selecionadas.includes(ocorrencia.id)
        ).map((ocorrencia) => ({
            ...ocorrencia,
            data: ocorrencia
        }));

        setDescricaoVisible(false);
        setSnackbarMessage('Ocorrências enviadas com sucesso!');
        setSnackbarSeverity('success');
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

    const handleRemoverArquivo = async (id, fileURL) => {
        const fileRef = ref(storage, fileURL);
        try {
            await deleteObject(fileRef);
            setOcorrencias((prev) =>
                prev.map((ocorrencia) =>
                    ocorrencia.id === id
                        ? { ...ocorrencia, media: ocorrencia.media.filter((url) => url !== fileURL) }
                        : ocorrencia
                )
            );
            setSnackbarMessage('Arquivo removido com sucesso!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error("Erro ao remover o arquivo: ", error);
            setSnackbarMessage('Erro ao remover o arquivo.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleAddImage = async (ocorrenciaId, event) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        if (!file.type.match('image.*')) {
            toast.error('Apenas arquivos de imagem são permitidos (JPEG, PNG, etc.)');
            return;
        }

        try {
            const storageRef = ref(storage, `ocorrencias/${ocorrenciaId}/${file.name}`);
            await uploadBytes(storageRef, file);

            const imageURL = await getDownloadURL(storageRef);

            setImagensPorOcorrencia(prev => ({
                ...prev,
                [ocorrenciaId]: [...(prev[ocorrenciaId] || []), { url: imageURL }]
            }));

            toast.success('Imagem enviada com sucesso!');
        } catch (error) {
            console.error("Erro ao enviar imagem:", error);
            toast.error('Falha no upload. Tente novamente.');
        }
    };


    return (
        <Container>
            <Typography variant="h4" gutterBottom>Ocorrências Recebidas pelos Usuários</Typography>

            <Button onClick={handleSelectAll} variant="outlined" color="primary">
                Selecionar Todas
            </Button>
            <Button onClick={handleSair} variant="outlined" color="secondary">
                Sair
            </Button>

            <Typography variant="subtitle1" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Logado como: <strong>{adminNome}</strong>
                <Chip label="Administrador" color="primary" size="small" />
            </Typography>



            <List>
                {ocorrencias.map((ocorrencia) => (
                    <React.Fragment key={ocorrencia.id}>
                        <ListItem>
                            <Checkbox
                                checked={selecionadas.includes(ocorrencia.id)}
                                onChange={() => handleCheckboxChange(ocorrencia.id)}
                            />

                            {editandoOcorrencia === ocorrencia.id ? (
                                <>
                                    <TextField
                                        value={descricaoEditada}
                                        onChange={(e) => setdescricaoEditada(e.target.value)}
                                        fullWidth
                                        label="Descrição"
                                        margin="normal"
                                    />
                                    <TextField
                                        value={tarefaEditada}
                                        onChange={(e) => setTarefaEditada(e.target.value)}
                                        fullWidth
                                        label="Tarefa Executada"
                                        margin="normal"
                                    />
                                    <TextField
                                        type="datetime-local"
                                        value={dataTarefaEditada || new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => setDataTarefaEditada(e.target.value)}
                                    />
                                    <TextField
                                        value={statusEditado}
                                        onChange={(e) => setStatusEditado(e.target.value)}
                                        fullWidth
                                        label="Status"
                                        select
                                        margin="normal"
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
                                    >
                                        {GRAVIDADE.map((g) => (
                                            <MenuItem key={g} value={g}>{g}</MenuItem>
                                        ))}
                                    </TextField>
                                    <Button
                                        onClick={() => handleSalvarEdicao(ocorrencia.id)}
                                        variant="contained"
                                        color="primary"
                                        style={{ marginTop: '16px' }}
                                    >
                                        Salvar
                                    </Button>
                                    <Button
                                        onClick={() => setEditandoOcorrencia(null)}
                                        variant="outlined"
                                        color="secondary"
                                        style={{ marginTop: '16px', marginLeft: '8px' }}
                                    >
                                        Cancelar
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <ListItemText
                                        primary={ocorrencia.descricao}
                                        secondary={
                                            <>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                                                    <StatusSpan status={ocorrencia.status}>{ocorrencia.status}</StatusSpan>
                                                    <GravidadeSpan gravidade={ocorrencia.gravidade}>{ocorrencia.gravidade}</GravidadeSpan>
                                                    <Chip label={ocorrencia.categoria} size="small" />
                                                </Box>
                                                <Typography variant="body2"><strong>Enviado por:</strong> {ocorrencia.nomeUsuario}</Typography>
                                                <Typography variant="body2"><strong>Nome da Ocorrência:</strong> {ocorrencia.descricao}</Typography>
                                                <Typography variant="body2">
                                                    <strong>Data da Ocorrência:</strong> {ocorrencia.data || 'Não selecionada'}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Endereço:</strong> {ocorrencia.endereco || 'Não selecionada'}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Descrição da Ocorrência do usuário:</strong> {ocorrencia.observacoes || 'Não selecionada'}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Tarefa executada:</strong> {ocorrencia.tarefaEditada || 'Não selecionada'}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Data da execução:</strong>
                                                    {ocorrencia.dataTarefaExecutada ?
                                                        new Date(ocorrencia.dataTarefaExecutada).toLocaleString('pt-BR') :
                                                        new Date().toLocaleString('pt-BR')}
                                                </Typography>

                                                <Typography variant='body2'><strong>Imagens:</strong> </Typography>

                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                                    {imagensPorOcorrencia[ocorrencia.id]?.map((img, index) => (
                                                        <Box key={index} sx={{ width: 100, height: 100 }}>
                                                            <img
                                                                src={img.url}
                                                                alt={`Imagem ${index + 1}`}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                                            />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </>
                                        }
                                    />
                                    <Button onClick={() => {
                                        setdescricaoEditada(ocorrencia.descricao);
                                        setTarefaEditada(ocorrencia.tarefaEditada || '');
                                        setStatusEditado(ocorrencia.status || 'Pendente');
                                        setEditandoOcorrencia(ocorrencia.id);
                                        setDataTarefaEditada(ocorrencia.dataTarefaExecutada || '');
                                        setImages(ocorrencia.images || '');
                                        setCategoriaEditada(ocorrencia.categoria || 'Outros');
                                        setGravidadeEditada(ocorrencia.gravidade || '');
                                    }}>
                                        Editar
                                    </Button>
                                </>
                            )}
                        </ListItem>
                        <Divider sx={{ my: 2, borderColor: 'grey.700' }} />
                    </React.Fragment>
                ))}
            </List>

            <Button
                onClick={handleNavigateToMap}
                variant="contained"
                color="primary"
                style={{ margin: '8px' }}
            >
                Ver Mapa de Ocorrências
            </Button>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>

    );
};

export default Ocorrencias; 