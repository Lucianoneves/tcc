import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button,
    Snackbar, Alert, List, ListItem, ListItemText,
    Divider, Paper, CircularProgress, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebaseConnection';
import { collection, query, getDocs, orderBy } from 'firebase/firestore'; // Importe orderBy para ordenar

function AdminPesquisas() {
    const navigate = useNavigate();
    const [respostasPesquisa, setRespostasPesquisa] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('error');

    useEffect(() => {
        // Verifica se o usuário logado é um administrador
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            navigate('/adminPage'); // Redireciona se não for administrador
            return;
        }

        const fetchRespostasPesquisa = async () => {
            setLoading(true);
            try {
                const respostasRef = collection(db, 'respostasPesquisa');
                // Busca todas as respostas da pesquisa, ordenadas pela data de envio mais recente
                const q = query(
                    respostasRef,
                    orderBy('dataEnvio', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const respostasList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setRespostasPesquisa(respostasList);
            } catch (error) {
                console.error('Erro ao buscar respostas da pesquisa:', error);
                setSnackbarMessage('Erro ao carregar respostas da pesquisa.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            } finally {
                setLoading(false);
            }
        };

        fetchRespostasPesquisa();
    }, [navigate]);

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ ml: 2 }}>Carregando respostas da pesquisa...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" gutterBottom>
                    Respostas das Pesquisas de Satisfação
                </Typography>
                <Button variant="contained" onClick={() => navigate('/ocorrencias')}>
                    Voltar para Gerenciar Ocorrências
                </Button>
            </Box>

            <Paper elevation={3} sx={{ p: 3 }}>
                {respostasPesquisa.length === 0 ? (
                    <Typography variant="body1">Nenhuma resposta de pesquisa encontrada.</Typography>
                ) : (
                    <List>
                        {respostasPesquisa.map((resposta) => (
                            <React.Fragment key={resposta.id}>
                                <ListItem alignItems="flex-start" sx={{ mb: 2 }}>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="h6" component="span">
                                                    Resposta de: {resposta.nomeUsuario || 'Usuário Desconhecido'}
                                                </Typography>
                                                <Chip
                                                    label={new Date(resposta.dataEnvio).toLocaleDateString()}
                                                    color="info" // Cor para a data
                                                    size="small"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Typography component="span" variant="body2" color="text.primary" display="block">
                                                    1. Satisfação Geral: <Chip label={resposta.satisfacaoGeral} size="small" variant="outlined" color={
                                                        resposta.satisfacaoGeral.includes('Satisfeito') ? 'success' :
                                                            resposta.satisfacaoGeral.includes('Insatisfeito') ? 'error' : 'default'
                                                    } />
                                                </Typography>
                                                <Typography component="span" variant="body2" color="text.primary" display="block">
                                                    2. Facilidade de Uso: <Chip label={resposta.facilidadeUso} size="small" variant="outlined" color={
                                                        resposta.facilidadeUso.includes('Fácil') ? 'success' :
                                                            resposta.facilidadeUso.includes('Difícil') ? 'error' : 'default'
                                                    } />
                                                </Typography>
                                                {resposta.comentarioAdicional && (
                                                    <Typography variant="body1" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                        3. Comentário Adicional: "{resposta.comentarioAdicional}"
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                                    Enviado em: {new Date(resposta.dataEnvio).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                <Divider component="li" sx={{ my: 2 }} />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default AdminPesquisas;