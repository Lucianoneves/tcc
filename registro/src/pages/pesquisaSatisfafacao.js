import React, { useState, useContext, useEffect } from 'react';
import {
    Container, Typography, Box, Button, TextField,
    Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
    Snackbar, Alert, CircularProgress, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebaseConnection'; // Importe a conexão com o Firebase
import { collection, addDoc } from 'firebase/firestore'; // Para adicionar documentos
import { AuthContext } from '../contexts/auth'; // Para pegar o usuário logado

function PesquisaSatisfacao() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext); // Pega o usuário logado
    const [satisfacaoGeral, setSatisfacaoGeral] = useState(''); // Estado para a primeira pergunta
    const [facilidadeUso, setFacilidadeUso] = useState(''); // Estado para a segunda pergunta
    const [comentarioAdicional, setComentarioAdicional] = useState(''); // Estado para o campo de texto
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(() => {
        // Redireciona para login se não houver usuário autenticado
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault(); // Previne o recarregamento da página

        if (!satisfacaoGeral || !facilidadeUso) {
            setSnackbarMessage('Por favor, responda a todas as perguntas obrigatórias.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        setLoading(true);

        const respostaPesquisaSistema = {
            usuarioId: user.uid,
            nomeUsuario: user.nome || 'Usuário Desconhecido', // Pega o nome do user context
            dataEnvio: new Date().toISOString(),
            satisfacaoGeral: satisfacaoGeral,
            facilidadeUso: facilidadeUso,
            comentarioAdicional: comentarioAdicional,
        };

        try {
            await addDoc(collection(db, 'respostasPesquisa'), respostaPesquisaSistema); // Salva na nova coleção 'respostasPesquisa'

            setSnackbarMessage('Pesquisa enviada com sucesso! Obrigado pelo seu feedback.');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);

            // Limpa o formulário após o envio
            setSatisfacaoGeral('');
            setFacilidadeUso('');
            setComentarioAdicional('');

            // Opcional: redirecionar para uma página de sucesso ou de perfil após um tempo
            setTimeout(() => {
                navigate('/perfil'); // Ou para a página de perfil
            }, 3000);

        } catch (error) {
            console.error('Erro ao enviar pesquisa:', error);
            setSnackbarMessage('Erro ao enviar pesquisa. Tente novamente.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" gutterBottom>
                    Pesquisa de Satisfação
                </Typography>
                <Button variant="contained" onClick={() => navigate('/avaliacaoFeedback')}>
                    Voltar ao Feedback
                </Button>
            </Box>

            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Sua opinião é muito importante para nós!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Por favor, reserve um momento para responder algumas perguntas sobre sua experiência.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                        <FormLabel component="legend">1. Qual o seu nível de satisfação geral com o sistema?</FormLabel>
                        <RadioGroup
                            row
                            name="satisfacaoGeral"
                            value={satisfacaoGeral}
                            onChange={(e) => setSatisfacaoGeral(e.target.value)}
                        >
                            <FormControlLabel value="Muito Insatisfeito" control={<Radio />} label="Muito Insatisfeito" />
                            <FormControlLabel value="Insatisfeito" control={<Radio />} label="Insatisfeito" />
                            <FormControlLabel value="Neutro" control={<Radio />} label="Neutro" />
                            <FormControlLabel value="Satisfeito" control={<Radio />} label="Satisfeito" />
                            <FormControlLabel value="Muito Satisfeito" control={<Radio />} label="Muito Satisfeito" />
                        </RadioGroup>
                    </FormControl>

                    <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                        <FormLabel component="legend">2. Quão fácil você achou o uso do sistema?</FormLabel>
                        <RadioGroup
                            row
                            name="facilidadeUso"
                            value={facilidadeUso}
                            onChange={(e) => setFacilidadeUso(e.target.value)}
                        >
                            <FormControlLabel value="Muito Difícil" control={<Radio />} label="Muito Difícil" />
                            <FormControlLabel value="Difícil" control={<Radio />} label="Difícil" />
                            <FormControlLabel value="Neutro" control={<Radio />} label="Neutro" />
                            <FormControlLabel value="Fácil" control={<Radio />} label="Fácil" />
                            <FormControlLabel value="Muito Fácil" control={<Radio />} label="Muito Fácil" />
                        </RadioGroup>
                    </FormControl>

                    <TextField
                        label="3. Você tem algum comentário ou sugestão adicional?"
                        multiline
                        rows={4}
                        fullWidth
                        value={comentarioAdicional}
                        onChange={(e) => setComentarioAdicional(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Enviar Pesquisa'}
                    </Button>
                </form>
            </Paper>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default PesquisaSatisfacao;