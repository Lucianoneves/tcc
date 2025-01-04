import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Checkbox, Button, TextField, Snackbar, List, ListItem, ListItemText, MenuItem
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/system';
import {db } from "../services/firebaseConnection";
import { addDoc, collection }from "firebase/firestore";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StatusSpan = styled('span')(({ status }) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
    backgroundColor:
        status === 'Em análise' ? '#ff9800' :
        status === 'Pendente' ? '#f44336' :
        status === 'Concluído' ? '#4caf50' : '#9e9e9e'
}));

const Ocorrencias = () => {
    const navigate = useNavigate();
    const [ocorrencias, setOcorrencias] = useState([]);
    const [novaOcorrencia, setNovaOcorrencia] = useState('');
    const [descricaoEditada, setDescricaoEditada] = useState('');
    const [statusEditado, setStatusEditado] = useState('');
    const [editandoOcorrencia, setEditandoOcorrencia] = useState(null);
    const [selecionadas, setSelecionadas] = useState([]);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

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

    const handleSalvarEdicao = (id) => {
        if (descricaoEditada.trim() && statusEditado) {
            setOcorrencias((prev) =>
                prev.map((ocorrencia) =>
                    ocorrencia.id === id
                        ? { ...ocorrencia, descricao: descricaoEditada, status: statusEditado }
                        : ocorrencia
                )
            );
            setEditandoOcorrencia(null);
            setSnackbarMessage('Ocorrência editada com sucesso!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } else {
            setSnackbarMessage('Preencha todos os campos para salvar.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleRemoverOcorrencia = (id) => {
        setOcorrencias((prev) => prev.filter((ocorrencia) => ocorrencia.id !== id));
        setSnackbarMessage('Ocorrência removida com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    const handleAdicionarOcorrencia = async () => {
        if (novaOcorrencia.trim()) {
            const nova = {
                descricao: novaOcorrencia,
                status: 'Pendente',
                data: new Date(),
            };
    
            try {
                // Adicionar no Firestore
                const docRef = await addDoc(collection(db, "ocorrencias"), nova);
                console.log("Ocorrência registrada com ID:", docRef.id);
    
                // Adicionar no estado para atualizar a UI
                setOcorrencias((prev) => [
                    ...prev,
                    { id: docRef.id, ...nova },
                ]);
                setNovaOcorrencia('');  // Limpar o campo de entrada
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
                                    onChange={(e) => setDescricaoEditada(e.target.value)}
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
                                    <MenuItem value="Em análise">Em análise</MenuItem>
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
                                    secondary={<StatusSpan status={ocorrencia.status}>{ocorrencia.status}</StatusSpan>}
                                />
                                <Button onClick={() => {
                                    setDescricaoEditada(ocorrencia.descricao);
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
            <TextField
                value={novaOcorrencia}
                onChange={(e) => setNovaOcorrencia(e.target.value)}
                fullWidth
                label="Descrição da nova ocorrência"
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
};

export default Ocorrencias;
