import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

function RedefinirSenha() {
    const [email, setEmail] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const auth = getAuth();

    const validarEmail = (email) => /\S+@\S+\.\S+/.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem('');
        setErro('');

        if (!validarEmail(email)) {
            setErro('Por favor, insira um e-mail válido.');
            return;
        }

        setCarregando(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMensagem('Se o e-mail informado estiver cadastrado, você receberá um link de redefinição.');
            setEmail('');
        } catch (error) {
            console.error("Erro ao enviar e-mail de redefinição:", error);
            if (error.code === 'auth/user-not-found') {
                setErro('Usuário não encontrado.');
            } else if (error.code === 'auth/invalid-email') {
                setErro('E-mail inválido.');
            } else {
                setErro('Erro ao enviar o e-mail. Tente novamente.');
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <Container maxWidth="sm" style={{ marginTop: '50px' }}>
            <Box
                sx={{
                    padding: '30px',
                    boxShadow: 3,
                    borderRadius: '8px',
                    backgroundColor: 'white',
                }}
            >
                <Typography variant="h4" gutterBottom align="center">
                    Redefinir Senha
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        required
                        margin="normal"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        fullWidth
                        disabled={carregando}
                        sx={{ marginTop: '15px', padding: '10px 0' }}
                    >
                        {carregando ? <CircularProgress size={24} /> : 'Enviar Link de Redefinição'}
                    </Button>
                </form>
                {mensagem && (
                    <Alert severity="success" sx={{ marginTop: '20px' }}>
                        {mensagem}
                    </Alert>
                )}
                {erro && (
                    <Alert severity="error" sx={{ marginTop: '20px' }}>
                        {erro}
                    </Alert>
                )}
            </Box>
        </Container>
    );
}

export default RedefinirSenha;
