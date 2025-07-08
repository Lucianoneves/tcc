import React, { useState } from 'react';
import { Button, TextField, Typography, Container, Box, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Link, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from "@mui/icons-material"; 
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConnection';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function AdminPage() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState(null);
    const [autenticado, setAutenticado] = useState(false);
    const [mostrarCadastro, setMostrarCadastro] = useState(false);
    const [mostrarRedefinirSenha, setMostrarRedefinirSenha] = useState(false);
    const [emailRedefinicao, setEmailRedefinicao] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [novoAdmin, setNovoAdmin] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: ''
    });
    const [loading, setLoading] = useState(false);
    const [sucessoRedefinicao, setSucessoRedefinicao] = useState(false);
    const navigate = useNavigate();

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleClickShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleLogin = async () => {
        setLoading(true);
        setErro(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const uid = userCredential.user.uid;

            const adminDoc = await getDoc(doc(db, 'administradores', email));
            
            if (!nome.trim()) {
                setErro('O nome é obrigatório');
                return;
            }

            const userDoc = await getDoc(doc(db, 'administradores', email));

            if (userDoc.exists()) {
                setAutenticado(true);
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('adminNome', userDoc.data().nome);
                localStorage.setItem('adminEmail', email);
                localStorage.setItem('adminId', uid);
                navigate('/ocorrencias');
            } else {
                setErro('Acesso permitido apenas para administradores cadastrados');
                await auth.signOut();
            }
        } catch (error) {
            console.error('Erro no login:', error);
            setErro('Email ou senha incorretos');
        } finally {
            setLoading(false);
        }
    };


        const handleCadastrarAdmin = async () => {
            if (!novoAdmin.nome.trim()) {
                setErro('O nome é obrigatório'); // Verifica se o nome foi preenchido
                return;
            }

            if (!novoAdmin.email.includes('@')) { // Verifica se o email é válido
                setErro('Email inválido');
                return;
            }

            if (novoAdmin.senha.length < 6) {
                setErro('A senha deve ter pelo menos 6 caracteres'); // Verifica se a senha tem pelo menos 6 caracteres
                return;
            }

            if (novoAdmin.senha !== novoAdmin.confirmarSenha) {
                setErro('As senhas não coincidem');
                return;
            }

            setLoading(true); // Inicia o carregamento
            setErro(null); // Limpa mensagens de erro anteriores

            try {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    novoAdmin.email, // 
                    novoAdmin.senha, // Cria o usuário no Firebase Auth
                    novoAdmin.nome // Adiciona o nome como um campo no Firestore
                );

                // Obtém o UID gerado pelo Firebase Auth
                const uid = userCredential.user.uid;

                await setDoc(doc(db, 'administradores', novoAdmin.email), {
                    id: uid, // Armazena o UID também como um campo
                    nome: novoAdmin.nome,
                    email: novoAdmin.email,
                    createdAt: new Date()
                });

                setNovoAdmin({
                    nome: '',
                    email: '',
                    senha: '',
                    confirmarSenha: ''
                });

                setMostrarCadastro(false);
                setErro(null);
                alert('Administrador cadastrado com sucesso!');
            } catch (error) {
                console.error('Erro no cadastro:', error);

                if (error.code === 'auth/email-already-in-use') {
                    setErro('Este email já está cadastrado');
                } else if (error.code === 'auth/invalid-email') {
                    setErro('Email inválido');
                } else if (error.code === 'auth/weak-password') {
                    setErro('A senha é muito fraca');
                } else {
                    setErro('Erro ao cadastrar administrador');
                }
            } finally {
                setLoading(false);
            }
        };

        const handleRedefinirSenha = async () => {
            if (!emailRedefinicao.includes('@')) {
                setErro('Por favor, insira um email válido');
                return;
            }

            setLoading(true);
            setErro(null);

            try {
                // Verifica se o email existe na coleção de administradores
                const adminDoc = await getDoc(doc(db, 'administradores', emailRedefinicao, nome));

                if (!adminDoc.exists()) {
                    setErro('Este email não está cadastrado como administrador');
                    return;
                }

                await sendPasswordResetEmail(auth, emailRedefinicao);
                setSucessoRedefinicao(true);
                setEmailRedefinicao('');
            } catch (error) {
                console.error('Erro ao enviar email de redefinição:', error);
                setErro('Ocorreu um erro ao enviar o email de redefinição');
            } finally {
                setLoading(false);
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
                                label="Nome"
                                type="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                fullWidth
                                margin="normal" />
                            <TextField
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                                margin="normal" />
                            <TextField
                                label="Senha"
                                type={showPassword ? "text" : "password"}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                fullWidth
                                margin="normal"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleClickShowPassword}
                                                onMouseDown={handleMouseDownPassword}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }} />

                            <Box textAlign="right" mt={1}>
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => setMostrarRedefinirSenha(true)}
                                >
                                    Esqueci minha senha
                                </Link>
                            </Box>

                            {erro && (
                                <Alert severity="error" sx={{ my: 2 }}>
                                    {erro}
                                </Alert>
                            )}

                            <Box mt={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleLogin}
                                    disabled={loading}
                                    style={{ marginRight: '1rem' }}
                                >
                                    {loading ? 'Carregando...' : 'Entrar'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => setMostrarCadastro(true)}
                                    disabled={loading}
                                >
                                    Cadastrar Novo Admin
                                </Button>
                            </Box>
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
                                onClick={() => {
                                    auth.signOut();
                                    setAutenticado(false);
                                    localStorage.removeItem('isAdmin');
                                } }
                                fullWidth
                            >
                                Sair
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Dialog para cadastrar novo admin */}
                <Dialog open={mostrarCadastro} onClose={() => setMostrarCadastro(false)}>
                    <DialogTitle>Cadastrar Novo Administrador</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Nome Completo"
                            value={novoAdmin.nome}
                            onChange={(e) => setNovoAdmin({ ...novoAdmin, nome: e.target.value })}
                            fullWidth
                            margin="normal"
                            required />
                        <TextField
                            label="Email"
                            type="email"
                            value={novoAdmin.email}
                            onChange={(e) => setNovoAdmin({ ...novoAdmin, email: e.target.value })}
                            fullWidth
                            margin="normal"
                            required />
                        <TextField
                            label="Senha"
                            type={showPassword ? "text" : "password"}
                            value={novoAdmin.senha}
                            onChange={(e) => setNovoAdmin({ ...novoAdmin, senha: e.target.value })}
                            fullWidth
                            margin="normal"
                            required
                            helperText="Mínimo 6 caracteres"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }} />
                        <TextField
                            label="Confirmar Senha"
                               type={showConfirmPassword ? "text" : "password"}
                            value={novoAdmin.confirmarSenha}
                            onChange={(e) => setNovoAdmin({ ...novoAdmin, confirmarSenha: e.target.value })}
                            fullWidth
                            margin="normal"
                            required
                            helperText="Mínimo 6 caracteres"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle confirm password visibility"
                                            onClick={handleClickShowPassword}
                                             onMouseDown={handleClickShowConfirmPassword}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }} />
                        {erro && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {erro}
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setMostrarCadastro(false);
                                setErro(null);
                            } }
                            color="primary"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCadastrarAdmin}
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog para redefinir senha */}
                <Dialog open={mostrarRedefinirSenha} onClose={() => {
                    setMostrarRedefinirSenha(false);
                    setErro(null);
                    setSucessoRedefinicao(false);
                } }>
                    <DialogTitle>Redefinir Senha</DialogTitle>
                    <DialogContent>
                        {sucessoRedefinicao ? (
                            <Alert severity="success" sx={{ my: 2 }}>
                                Email de redefinição enviado com sucesso! Verifique sua caixa de entrada.
                            </Alert>
                        ) : (
                            <>
                                <Typography paragraph>
                                    Insira seu email para receber um link de redefinição de senha.
                                </Typography>
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={emailRedefinicao}
                                    onChange={(e) => setEmailRedefinicao(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    required />
                                {erro && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {erro}
                                    </Alert>
                                )}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setMostrarRedefinirSenha(false);
                                setErro(null);
                                setSucessoRedefinicao(false);
                            } }
                            color="primary"
                        >
                            Fechar
                        </Button>
                        {!sucessoRedefinicao && (
                            <Button
                                onClick={handleRedefinirSenha}
                                color="primary"
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Enviar'}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Container>
        );
    }


export default AdminPage;
