import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';

function RedefinirSenha() {
    const [email, setEmail] = useState('');
    const [mensagem, setMensagem] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Aqui você pode fazer a chamada para o backend para enviar o link de redefinição de senha
        alert(`Um link de redefinição de senha foi enviado para ${email}`);
        setMensagem('Um link de redefinição de senha foi enviado para seu e-mail.');
        setEmail(''); // Limpa o campo de email após o envio
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
                        sx={{ marginTop: '15px', padding: '10px 0' }}
                    >
                        Enviar Link de Redefinição
                    </Button>
                </form>
                {mensagem && (
                    <Alert severity="success" sx={{ marginTop: '20px' }}>
                        {mensagem}
                    </Alert>
                )}
            </Box>
        </Container>
    );
}

export default RedefinirSenha;
