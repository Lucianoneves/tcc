import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button,
    Snackbar, Alert, Rating, List, ListItem, ListItemText,
    Divider, Paper, CircularProgress, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebaseConnection';
// eslint-disable-next-line no-unused-vars
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore'; // Adicionado orderBy e limit

function AdminAvaliacaoFeedback() {
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState([]);
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

        const fetchAllFeedbacks = async () => {
            setLoading(true);
            try {
                const ocorrenciasRef = collection(db, 'ocorrencias');
                // Busca todas as ocorrências que possuem avaliação ou comentário
                // Ordena pela data da avaliação mais recente ou pela data da ocorrência
                const q = query(
                    ocorrenciasRef,
                    orderBy('dataAvaliacao', 'desc'), // Tenta ordenar pela data da avaliação
                    // Adicionar orderBy('data', 'desc') como secundário se 'dataAvaliacao' não existir em todos
                );
                const querySnapshot = await getDocs(q);
                const feedbacksList = [];
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.avaliacao || data.comentario) { // Só adiciona se tiver avaliação ou comentário
                        feedbacksList.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });

                // Se a ordenação por dataAvaliacao não for eficaz (alguns docs não têm),
                // podemos fazer uma ordenação secundária em memória.
                feedbacksList.sort((a, b) => {
                    const dateA = new Date(a.dataAvaliacao || a.data);
                    const dateB = new Date(b.dataAvaliacao || b.data);
                    return dateB.getTime() - dateA.getTime();
                });


                setFeedbacks(feedbacksList);
            } catch (error) {
                console.error('Erro ao buscar feedbacks:', error);
                setSnackbarMessage('Erro ao carregar feedbacks.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAllFeedbacks();
    }, [navigate]);

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ ml: 2 }}>Carregando avaliações e feedbacks...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" gutterBottom>
                    Avaliações e Feedbacks dos Usuários
                </Typography>
                <Button variant="contained" onClick={() => navigate('/ocorrencias')}>
                    Voltar para Gerenciar Ocorrências
                </Button>
            </Box>

            <Paper elevation={3} sx={{ p: 3 }}>
                {feedbacks.length === 0 ? (
                    <Typography variant="body1">Nenhuma avaliação ou feedback encontrado.</Typography>
                ) : (
                    <List>
                        {feedbacks.map((feedback) => (
                            <React.Fragment key={feedback.id}>
                                <ListItem alignItems="flex-start" sx={{ mb: 2 }}>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="h6" component="span">
                                                    Ocorrência: {feedback.descricao || 'Sem descrição'}
                                                </Typography>
                                                {feedback.status && (
                                                    <Chip
                                                        label={feedback.status}
                                                        color={
                                                            feedback.status.toLowerCase() === 'concluído' ? 'success' :
                                                                feedback.status.toLowerCase() === 'em andamento' ? 'warning' : 'default'
                                                        }
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    Usuário: {feedback.nomeUsuario || 'Usuário Desconhecido'}
                                                </Typography>
                                                <br />
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    Registrado em: {new Date(feedback.data).toLocaleString()}
                                                </Typography>
                                                {feedback.dataResolucao && (
                                                    <>
                                                        <br />
                                                        <Typography component="span" variant="body2" color="text.secondary">
                                                            Concluído em: {new Date(feedback.dataResolucao).toLocaleString()}
                                                        </Typography>
                                                    </>
                                                )}
                                                {feedback.avaliacao > 0 && (
                                                    <Box display="flex" alignItems="center" mt={1}>
                                                        <Typography variant="body2" mr={1}>Avaliação:</Typography>
                                                        <Rating value={feedback.avaliacao} readOnly />
                                                        <Typography variant="body2" ml={1}>({feedback.avaliacao} estrelas)</Typography>
                                                    </Box>
                                                )}
                                                {feedback.comentario && (
                                                    <Typography variant="body1" sx={{ mt: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
                                                        Comentário: "{feedback.comentario}"
                                                    </Typography>
                                                )}
                                                {feedback.dataAvaliacao && (
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                                        Feedback enviado em: {new Date(feedback.dataAvaliacao).toLocaleString()}
                                                    </Typography>
                                                )}
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

export default AdminAvaliacaoFeedback;