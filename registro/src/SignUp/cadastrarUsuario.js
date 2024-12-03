import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/auth';
import { Box, Button, TextField, Typography, Avatar } from '@mui/material';

function CadastrarUsuario() {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [email, setEmail] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const navigate = useNavigate();
  const { cadastrarUsuario, loadingAuth } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!nomeCompleto || !email || !senha || !cpf || !endereco || !telefone) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    if (email !== confirmarEmail) {
      alert('Os e-mails não coincidem.');
      return;
    }

    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem.');
      return;
    }

    try {
      await cadastrarUsuario(nomeCompleto, senha, email, cpf, endereco, telefone);

      // Resetando o formulário
      resetForm();
      navigate('/perfil'); // Opcional: redirecionar para login após cadastro
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      alert('Erro ao cadastrar usuário. Tente novamente mais tarde.');
    }
  };

  const resetForm = () => {
    setNomeCompleto('');
    setCpf('');
    setEndereco('');
    setTelefone('');
    setFotoPerfil(null);
    setFotoPreview(null);
    setEmail('');
    setConfirmarEmail('');
    setSenha('');
    setConfirmarSenha('');
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoPerfil(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      autoComplete="off" // Evita preenchimento automático no formulário
      sx={{
        maxWidth: 600,
        margin: 'auto',
        padding: 4,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Cadastro de Usuário
      </Typography>
      <TextField
        fullWidth
        margin="normal"
        label="Nome Completo"
        value={nomeCompleto}
        onChange={(e) => setNomeCompleto(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
        inputProps={{ autoComplete: 'new-name' }} // Evita histórico
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="CPF"
        value={cpf}
        onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
        inputProps={{ maxLength: 11, autoComplete: 'off' }}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Endereço"
        multiline
        rows={3}
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
        inputProps={{ autoComplete: 'off' }}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Número de Telefone WhatsApp"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
        inputProps={{ maxLength: 13, autoComplete: 'off' }}
        required
      />
      <Button
        variant="outlined"
        component="label"
        fullWidth
        sx={{ marginY: 2 }}
      >
        Upload Foto de Perfil
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleFotoChange}
        />
      </Button>
      {fotoPreview && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 2,
          }}
        >
          <Avatar src={fotoPreview} sx={{ width: 150, height: 150 }} />
        </Box>
      )}
      <TextField
        fullWidth
        margin="normal"
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        inputProps={{ autoComplete: 'new-email' }} // Evita histórico
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Confirmar E-mail"
        type="email"
        value={confirmarEmail}
        onChange={(e) => setConfirmarEmail(e.target.value)}
        inputProps={{ autoComplete: 'new-email-confirm' }} // Evita histórico
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        inputProps={{ autoComplete: 'new-password' }} // Evita preenchimento automático
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Confirmar Senha"
        type="password"
        value={confirmarSenha}
        onChange={(e) => setConfirmarSenha(e.target.value)}
        inputProps={{ autoComplete: 'new-password-confirm' }} // Evita preenchimento automático
        required
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ marginTop: 2 }}
      >
        {loadingAuth ? 'Carregando...' : 'Cadastrar'}
      </Button>
    </Box>
  );
}

export default CadastrarUsuario;
