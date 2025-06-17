import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button,
    Snackbar, Alert, Rating, List, ListItem, ListItemText,
    Divider, Paper, CircularProgress, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebaseConnection';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore'; // Adicionado 'where'

function AdminAvaliacaoFeedback() {
    const navigate = useNavigate();
    const [feedbacksExibidos, setFeedbacksExibidos] = useState([]); // Mudado o nome para evitar confusão
    const [loading, setLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('error');

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            navigate('/adminPage');
            return;
        }

        const fetchAllFeedbacks = async () => {
            setLoading(true);
            try {
                const avaliacoesRef = collection(db, 'avaliacoesFeedback');
                // Consulta para buscar TODAS as avaliações e comentários
                // que contenham pelo menos um campo 'avaliacao' ou 'comentario'.
                // O orderBy('dataAvaliacao', 'desc') ajuda a trazer os mais recentes primeiro.
                const q = query(
                    avaliacoesRef,
                    orderBy('dataAvaliacao', 'desc')
                    // Não podemos usar 'where' para 'OR' diretamente em Firestore para avaliacao OU comentario.
                    // A filtragem será feita em memória.
                );
                const querySnapshot = await getDocs(q);
                const feedbacksList = [];
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    // Filtra em memória se a avaliação ou o comentário existe e não está vazio/0
                    if ((data.avaliacao && data.avaliacao > 0) || (data.comentario && data.comentario.trim() !== '')) {
                        feedbacksList.push({
                            id: doc.id, // O ID do documento de avaliação é o ID da ocorrência (como definimos no setDoc)
                            ...data
                        });
                    }
                });

                setFeedbacksExibidos(feedbacksList);
            } catch (error) {
                console.error('Erro ao buscar feedbacks:', error);
                setSnackbarMessage('Erro ao carregar avaliações e feedbacks.');
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
                {feedbacksExibidos.length === 0 ? (
                    <Typography variant="body1">Nenhuma avaliação ou feedback encontrado.</Typography>
                ) : (
                    <List>
                        {feedbacksExibidos.map((feedback) => (
                            <React.Fragment key={feedback.id}>
                                <ListItem alignItems="flex-start" sx={{ mb: 2 }}>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="h6" component="span">
                                                    Ocorrência: {feedback.descricaoOcorrencia || 'Sem descrição'} {/* Alterado para descricaoOcorrencia */}
                                                </Typography>
                                                {/* O status da ocorrência original não está no documento de feedback.
                                                    Se você quiser exibi-lo, precisaria buscar a ocorrência original ou
                                                    salvar o status da ocorrência no documento de feedback.
                                                    Por enquanto, vamos remover ou adaptar.
                                                */}
                                                {/* {feedback.status && (
                                                    <Chip
                                                        label={feedback.status}
                                                        color={
                                                            feedback.status.toLowerCase() === 'concluído' ? 'success' :
                                                            feedback.status.toLowerCase() === 'em andamento' ? 'warning' : 'default'
                                                        }
                                                        size="small"
                                                    />
                                                )} */}
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    Usuário: {feedback.nomeUsuario || 'Usuário Desconhecido'}
                                                </Typography>
                                                <br />
                                                
                                                {/* As datas originais da ocorrência (data e dataResolucao) não estão no documento de feedback.
                                                    Você precisaria buscá-las da coleção 'ocorrencias' ou salvá-las no documento de feedback.
                                                */}
                                                {/*
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
                                                */}

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