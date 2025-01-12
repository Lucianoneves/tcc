import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Checkbox, Button, TextField, Snackbar, List, ListItem, ListItemText, MenuItem
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/system';
import { db, storage } from "../services/firebaseConnection";  // Importando storage
import { doc, addDoc, collection, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage, deleteObject } from "firebase/storage";
import { getAuth } from "firebase/auth";

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

const Ocorrencias = () => {
    const navigate = useNavigate();
    const [ocorrencias, setOcorrencias] = useState([]);
    const [novaOcorrencia, setNovaOcorrencia] = useState('');
    const [descricaoEditada, setdescricaoEditada] = useState('');
    const [statusEditado, setStatusEditado] = useState('');
    const [editandoOcorrencia, setEditandoOcorrencia] = useState(null);
    const [selecionadas, setSelecionadas] = useState([]);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null); // Estado para o arquivo selecionado
    const auth = getAuth();
    const user = auth.currentUser;  // Obtém o usuário logado
    const [observacoes, setObservacoes] = useState('');
    const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(null);



    useEffect(() => {
        const usuarioAdmin = localStorage.getItem('isAdmin');
        if (usuarioAdmin !== 'true') {
            navigate('/login');  // Redirecionar para login se não for admin
        }
    }, [navigate]);

    useEffect(() => {
        const ocorrenciasSalvas = localStorage.getItem('ocorrencias');
        if (ocorrenciasSalvas) {
            setOcorrencias(JSON.parse(ocorrenciasSalvas));
        } else {
            const ocorrenciasPadrao = [
                { id: 1, descricao: 'Buraco na rua', status: 'Pendente' },
                { id: 2, descricao: 'Lâmpada queimada', status: 'Pendente' },
            ];
            setOcorrencias(ocorrenciasPadrao);
            localStorage.setItem('ocorrencias', JSON.stringify(ocorrenciasPadrao));
        }
    }, []);

    useEffect(() => {
        if (ocorrencias.length > 0) {
            localStorage.setItem('ocorrencias', JSON.stringify(ocorrencias));
        }
    }, [ocorrencias]);





    const handleSalvarEdicao = async (id) => {
        if (descricaoEditada.trim() && statusEditado) {
            try {
                // Referência para o documento a ser atualizado no Firestore
                const docRef = doc(db, "ocorrencias", id); // Usando o id correto

                // Atualizando o documento no Firestore
                await updateDoc(docRef, {
                    descricao: descricaoEditada,
                    status: statusEditado,
                });

                // Atualizar o estado local após a edição
                setOcorrencias((prev) =>
                    prev.map((ocorrencia) =>
                        ocorrencia.id === id
                            ? { ...ocorrencia, descricao: descricaoEditada, status: statusEditado }
                            : ocorrencia
                    )
                );

                // Fechar a edição e mostrar mensagem de sucesso
                setEditandoOcorrencia(null);
                setSnackbarMessage('Ocorrência editada com sucesso!');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
            } catch (error) {
                console.error("Erro ao editar ocorrência: ", error);
                setSnackbarMessage('Erro ao editar a ocorrência.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        } else {
            setSnackbarMessage('Preencha todos os campos para salvar.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };



    const handleAdicionarOcorrencia = async () => {
        if (novaOcorrencia.trim()) {
            const usuarioId = user.uid; // Supondo que 'user' já seja o objeto do usuário autenticado
            const nomeUsuario = user.nome; // Supondo que 'user' tenha o nome
            const localizacao = 'Rua XYZ, Bairro ABC'; // Exemplo de localizacao, você pode obter isso de um input ou estado
            const imagens = []; // Inicialmente vazio, você pode adicionar URLs das imagens carregadas aqui

            const nova = {
                descricao: novaOcorrencia,
                status: '',
                data: new Date(),
                usuarioId,  // Adicionando o ID do usuário
                nomeUsuario, // Adicionando o nome do usuário
                localizacao, // Adicionando a localização
                imagens,     // Adicionando imagens (a lista de URLs das imagens)
                observacoes
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
                    await updateDoc(docRef, { imagens: [...nova.imagens, fileURL] });
                    console.log("Arquivo enviado e URL registrada no Firestore.");
                }

                // Adicionar no estado para atualizar a UI
                setOcorrencias((prev) => [
                    ...prev,
                    { id: docRef.id, ...nova },
                ]);
                setNovaOcorrencia('');  // Limpar o campo de entrada
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





    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "ocorrencias"), (snapshot) => {
            const ocorrenciasAtualizadas = snapshot.docs.map((doc) => ({
                id: doc.id,
                descricao: doc.data().descricao,
                status: doc.data().status,
                observacoes: doc.data().observacoes,
                data: doc.data().data,
                usuarioId: doc.data().usuarioId, // Incluindo usuarioId
                nomeUsuario: doc.data().nomeUsuario, // Incluindo nomeUsuario
                localizacao: doc.data().localizacao, // Incluindo localizacao
                imagens: doc.data().imagens || [] // Incluindo imagens            
            }));
            setOcorrencias(ocorrenciasAtualizadas);
        });

        return () => unsubscribe(); // Desinscrever ao desmontar o componente
    }, []);




    const handleRemoverOcorrencia = async (id) => {
        try {
            // Remover no Firestore
            const docRef = doc(db, "ocorrencias", id);
            await deleteDoc(docRef);

            // Atualizar o estado local após a remoção
            setOcorrencias((prev) => prev.filter((ocorrencia) => ocorrencia.id !== id));

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






    const handleSubmit = () => {
        console.log('Ocorrências enviadas:', ocorrencias.filter((ocorrencia) =>
            selecionadas.includes(ocorrencia.id)
        ));
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
        navigate('/login'); // Redireciona para a página de login
    };





    // Adicionar fotos e videos
    const handleFileUpload = async (event, id) => {
        const file = event.target.files[0]; // Pega o arquivo selecionado
        if (!file) return;

        const fileRef = ref(storage, `ocorrencias/${id}/${file.name}`);
        try {
            // Fazer o upload do arquivo para o Firebase Storage
            await uploadBytes(fileRef, file);
            const fileURL = await getDownloadURL(fileRef);

            // Atualizar a ocorrência com o URL do arquivo carregado
            setOcorrencias((prev) =>
                prev.map((ocorrencia) =>
                    ocorrencia.id === id
                        ? { ...ocorrencia, media: [...(ocorrencia.media || []), fileURL] }
                        : ocorrencia
                )
            );
            setSnackbarMessage('Arquivo carregado com sucesso!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error("Erro ao carregar o arquivo: ", error);
            setSnackbarMessage('Erro ao carregar o arquivo.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleRemoverArquivo = async (id, fileURL) => {
        const fileRef = ref(storage, fileURL);
        try {
            // Remover o arquivo do Firebase Storage
            await deleteObject(fileRef);

            // Atualizar a lista de ocorrências removendo o arquivo da URL
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





    return (
        <Container>
            <Typography variant="h4" gutterBottom>Ocorrências</Typography>
            <Button onClick={handleSelectAll} variant="outlined" color="primary">
                Selecionar Todas
            </Button>
            <Button onClick={handleSair} variant="outlined" color="secondary">
                Sair
            </Button>
            <List>
    {ocorrencias.map((ocorrencia) => (
        <ListItem key={ocorrencia.id}>
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
                    />
                    <TextField
                        value={statusEditado}
                        onChange={(e) => setStatusEditado(e.target.value)}
                        fullWidth
                        label="Status"
                        select
                    >
                        <MenuItem value="Pendente">Pendente</MenuItem>
                        <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                        <MenuItem value="Concluído">Concluído</MenuItem>
                    </TextField>
                    <Button onClick={() => handleSalvarEdicao(ocorrencia.id)} variant="contained" color="primary">
                        Salvar
                    </Button>
                    <Button onClick={() => setEditandoOcorrencia(null)} variant="outlined" color="secondary">
                        Cancelar
                    </Button>
                </>
            ) : (
                <>
                    <ListItemText
                        primary={ocorrencia.descricao}
                        secondary={
                            <Typography component="div">
                                <StatusSpan status={ocorrencia.status}>{ocorrencia.status}</StatusSpan>
                            </Typography>
                        }
                    />
                    <Button onClick={() => {
                        setdescricaoEditada(ocorrencia.descricao);
                        setStatusEditado(ocorrencia.status);
                        setEditandoOcorrencia(ocorrencia.id);
                    }}>Editar</Button>
                    <Button onClick={() => handleRemoverOcorrencia(ocorrencia.id)} color="error">
                        Remover
                    </Button>
                </>
            )}
        </ListItem>
    ))}
</List>



            {ocorrencias.map((ocorrencia) => (
                ocorrencia.media && ocorrencia.media.map((mediaURL, index) => (
                    <div key={index}>
                        {mediaURL.endsWith('.mp4') ? (
                            <video width="200" controls>
                                <source src={mediaURL} type="video/mp4" />
                                Seu navegador não suporta o elemento de vídeo.
                            </video>
                        ) : (
                            <img src={mediaURL} alt="Ocorrência" width="200" />
                        )}
                        <Button onClick={() => handleRemoverArquivo(ocorrencia.id, mediaURL)} color="error">
                            Remover Arquivo
                        </Button>
                    </div>
                ))
            ))}





            <TextField
                value={novaOcorrencia}
                onChange={(e) => setNovaOcorrencia(e.target.value)}
                fullWidth
                label="Descrição da nova ocorrência"
            />
            <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <Button onClick={handleAdicionarOcorrencia} variant="contained" color="primary">
                Adicionar Ocorrência
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
                Enviar Ocorrências
            </Button>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>

    );
}

export default Ocorrencias;
