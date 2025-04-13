import React, { useState } from 'react';
import { Button, TextField, Typography, Container, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState(false);
    const [autenticado, setAutenticado] = useState(false);
    const navigate = useNavigate();

    const senhaCorreta = 'admin123'; // Defina a senha correta aqui

    // AdminPage.js
    const handleLogin = () => {
        if (senha === senhaCorreta) {
            localStorage.setItem('isAdmin', 'true');
            navigate('/ocorrencias'); // Garanta que esta rota existe
        } else {
            setErro(true);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box mt={5} textAlign="center">
                <Typography variant="h4" gutterBottom>
                    Página de Administração
                </Typography>

                {!autenticado ? (
                    <>
                        <TextField
                            label="Senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        {erro && (
                            <Typography color="error" gutterBottom>
                                Senha incorreta. Tente novamente.
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleLogin}
                        >
                            Entrar
                        </Button>
                    </>
                ) : (
                    <Box mt={4}>
                        <Typography variant="h6" gutterBottom>
                            Bem-vindo, Admin!
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => navigate('/ocorrencias')}
                            fullWidth
                            style={{ marginBottom: '1rem' }}
                        >
                            Gerenciar Ocorrências
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setAutenticado(false)}
                            fullWidth
                        >
                            Sair
                        </Button>
                    </Box>
                )}
            </Box>
        </Container>
    );
}

export default AdminPage;
