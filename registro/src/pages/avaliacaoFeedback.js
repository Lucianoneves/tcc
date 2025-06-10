import React, { useState, useEffect, useContext } from 'react';
import {
    Container, Typography, Box, Button, TextField,
    Snackbar, Alert, Rating, List, ListItem, ListItemText,
    Divider, Paper, CircularProgress, Chip, IconButton 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebaseConnection';
import { collection, query, where, getDocs, doc, updateDoc, deleteField  } from 'firebase/firestore';
import { AuthContext } from '../contexts/auth'; // Assumindo que você tem um AuthContext

function AvaliacaoFeedback() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext); // Pega o usuário logado do contexto
    const [ocorrenciasResolvidas, setOcorrenciasResolvidas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [currentRating, setCurrentRating] = useState(0);
    const [currentComment, setCurrentComment] = useState('');
    const [selectedOcorrenciaParaAvaliar, setSelectedOcorrenciaParaAvaliar] = useState(null);

    useEffect(() => {
        // Redireciona para login se não houver usuário autenticado
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchOcorrenciasResolvidas = async () => {
            setLoading(true);
            try {
                const ocorrenciasRef = collection(db, 'ocorrencias');
                // Busca ocorrências do usuário logado que estão com status 'Concluído'
                const q = query(ocorrenciasRef,
                    where('usuarioId', '==', user.uid),
                    where('status', '==', 'Concluído')
                );
                const querySnapshot = await getDocs(q);
                const ocorrenciasList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOcorrenciasResolvidas(ocorrenciasList);
            } catch (error) {
                console.error('Erro ao buscar ocorrências resolvidas:', error);
                setSnackbarMessage('Erro ao carregar ocorrências.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            } finally {
                setLoading(false);
            }
        };

        fetchOcorrenciasResolvidas();
    }, [user, navigate]);

    const handleOpenAvaliacao = (ocorrencia) => {
        setSelectedOcorrenciaParaAvaliar(ocorrencia);
        // Preenche os campos se já houver avaliação e comentário salvos
        setCurrentRating(ocorrencia.avaliacao || 0);
        setCurrentComment(ocorrencia.comentario || '');
    };

    const handleSalvarAvaliacao = async () => {
        if (!selectedOcorrenciaParaAvaliar) return;

        setLoading(true);
        try {
            const ocorrenciaRef = doc(db, 'ocorrencias', selectedOcorrenciaParaAvaliar.id);
            await updateDoc(ocorrenciaRef, {
                avaliacao: currentRating,
                comentario: currentComment,
                dataAvaliacao: new Date().toISOString() // Adiciona data da avaliação
            });

            // Atualiza o estado local das ocorrências
            setOcorrenciasResolvidas(prev =>
                prev.map(oc =>
                    oc.id === selectedOcorrenciaParaAvaliar.id
                        ? { ...oc, avaliacao: currentRating, comentario: currentComment, dataAvaliacao: new Date().toISOString() }
                        : oc
                )
            );

            setSnackbarMessage('Avaliação e comentário salvos com sucesso!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setSelectedOcorrenciaParaAvaliar(null); // Fecha a seção de avaliação
            setCurrentRating(0);
            setCurrentComment('');
        } catch (error) {
            console.error('Erro ao salvar avaliação:', error);
            setSnackbarMessage('Erro ao salvar avaliação.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };



     const handleDeleteAvaliacao = async (ocorrenciaId) => {
        // Confirmação para evitar exclusões acidentais
        const confirmacao = window.confirm("Tem certeza que deseja remover sua avaliação e comentário desta ocorrência?");
        if (!confirmacao) {
            return;
        }

        setLoading(true);
        try {
            const ocorrenciaRef = doc(db, 'ocorrencias', ocorrenciaId);
            await updateDoc(ocorrenciaRef, {
                avaliacao: deleteField(),    // Remove o campo 'avaliacao'
                comentario: deleteField(),   // Remove o campo 'comentario'
                dataAvaliacao: deleteField() // Remove o campo 'dataAvaliacao'
            });

            // Atualiza o estado local para remover a avaliação/comentário
            setOcorrenciasResolvidas(prev =>
                prev.map(oc =>
                    oc.id === ocorrenciaId
                        ? { ...oc, avaliacao: 0, comentario: '', dataAvaliacao: '' } // Define como vazio/0
                        : oc
                )
            );

            setSnackbarMessage('Avaliação e comentário removidos com sucesso!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Erro ao deletar avaliação:', error);
            setSnackbarMessage('Erro ao remover avaliação e comentário.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
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
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" gutterBottom>
                    Avaliação e Feedback
                </Typography>
                <Button variant="contained" onClick={() => navigate('/perfil')}> {/* Corrigido: /perfil para /perfilUsuario */}
                    Voltar ao Perfil
                </Button>
            </Box>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Minhas Ocorrências Concluídas para Avaliar
                </Typography>
                {ocorrenciasResolvidas.length === 0 ? (
                    <Typography variant="body1">Nenhuma ocorrência concluída para avaliar no momento.</Typography>
                ) : (
                    <List>
                        {ocorrenciasResolvidas.map((ocorrencia) => (
                            <React.Fragment key={ocorrencia.id}>
                                <ListItem alignItems="flex-start" sx={{ justifyContent: 'space-between' }}> {/* Adicionado justifyContent */}
                                    <ListItemText
                                        primary={`Ocorrência: ${ocorrencia.descricao}`}
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                                    <Typography component="span" variant="body2" mr={1}>
                                                        Status:
                                                    </Typography>
                                                    <Chip
                                                        label={ocorrencia.status}
                                                        color={ocorrencia.status === 'Concluído' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </Box>
                                                {/* As <br /> e Typography foram corrigidas para ficar dentro do Box */}
                                                <Typography component="span" variant="body2" color="text.secondary" display="block"> {/* Adicionado display="block" */}
                                                    Registrado em: {new Date(ocorrencia.data).toLocaleString()}
                                                </Typography>
                                                {ocorrencia.dataResolucao && (
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block"> {/* Adicionado display="block" */}
                                                        Concluído em: {new Date(ocorrencia.dataResolucao).toLocaleString()}
                                                    </Typography>
                                                )}
                                                {ocorrencia.avaliacao > 0 && (
                                                    <Box display="flex" alignItems="center" mt={1}>
                                                        <Typography variant="body2" mr={1}>Sua Avaliação:</Typography>
                                                        <Rating value={ocorrencia.avaliacao} readOnly />
                                                        <Typography variant="body2" ml={1}>({ocorrencia.avaliacao} estrelas)</Typography>
                                                    </Box>
                                                )}
                                                {ocorrencia.comentario && (
                                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                        "Comentário: {ocorrencia.comentario}"
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleOpenAvaliacao(ocorrencia)}
                                        >
                                            {ocorrencia.avaliacao ? 'Editar Avaliação' : 'Avaliar'}
                                        </Button>
                                        {/* IconButton de exclusão CONDICIONALMENTE renderizado e posicionado corretamente */}
                                        {(ocorrencia.avaliacao > 0 || ocorrencia.comentario) && (
                                            <IconButton
                                                aria-label="deletar avaliação"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteAvaliacao(ocorrencia.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                </ListItem>
                                {/* Bloco de avaliação/edição para a ocorrência selecionada */}
                                {selectedOcorrenciaParaAvaliar?.id === ocorrencia.id && (
                                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: '4px', mt: 1, mb: 2 }}>
                                        <Typography variant="h6" gutterBottom>Avaliar Ocorrência: {ocorrencia.descricao}</Typography>
                                        <Typography component="legend">Sua avaliação (1-5 estrelas)</Typography>
                                        <Rating
                                            name="simple-controlled"
                                            value={currentRating}
                                            onChange={(event, newValue) => {
                                                setCurrentRating(newValue);
                                            }}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            label="Deixe seu comentário (opcional)"
                                            multiline
                                            rows={3}
                                            fullWidth
                                            value={currentComment}
                                            onChange={(e) => setCurrentComment(e.target.value)}
                                            sx={{ mb: 2 }}
                                        />
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleSalvarAvaliacao}
                                            disabled={loading}
                                            sx={{ mr: 1 }}
                                        >
                                            {loading ? <CircularProgress size={24} /> : 'Salvar Avaliação'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            onClick={() => setSelectedOcorrenciaParaAvaliar(null)}
                                        >
                                            Cancelar
                                        </Button>
                                    </Box>
                                )}
                                <Divider component="li" sx={{ my: 2 }} />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Seção de Pesquisas de Satisfação (exemplo simples) */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Pesquisa de Satisfação
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Ajude-nos a melhorar! Responda à nossa pesquisa rápida sobre sua experiência geral.
                </Typography>
                <Button variant="contained" color="secondary" onClick={() => alert('Abrir formulário de pesquisa')}>
                    Participar da Pesquisa
                </Button>
            </Paper>

            {/* Seção de Comentários Públicos (Exemplo: comentários de todas as ocorrências) */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Comentários Recentes (Geral)
                </Typography>
                {ocorrenciasResolvidas.filter(oc => oc.comentario).length === 0 ? (
                    <Typography variant="body1">Nenhum comentário público disponível ainda.</Typography>
                ) : (
                    <List>
                        {ocorrenciasResolvidas.filter(oc => oc.comentario).map(oc => (
                            <ListItem key={oc.id}>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center">
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {oc.nomeUsuario || 'Usuário Anônimo'}
                                            </Typography>
                                            {oc.avaliacao && <Rating value={oc.avaliacao} readOnly size="small" sx={{ ml: 1 }} />}
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" component="span">
                                                Sobre "{oc.descricao}"
                                            </Typography>
                                            <Typography variant="body1" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                                "{oc.comentario}"
                                            </Typography>
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                Em: {new Date(oc.dataAvaliacao || oc.data).toLocaleString()}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Snackbar para mensagens de feedback */}
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container >
    );
}

export default AvaliacaoFeedback;