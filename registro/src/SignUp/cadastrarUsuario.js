import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/auth';
import { Box, Button, TextField, Typography, Avatar } from '@mui/material';
import { toast } from 'react-toastify';
import { storage } from "../services/firebaseConnection";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 

function CadastrarUsuario() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const navigate = useNavigate();
  const { cadastrarUsuario, loadingAuth } = useContext(AuthContext); 

  const handleSubmit = async (e) => {
    e.preventDefault();    


    // Validações
    if (nome.length < 3 || nome.length > 25) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      toast.error('O CPF deve conter exatamente 11 dígitos numéricos.');
      return;
    }

    if (endereco.length < 10 || endereco.length > 200) {
      alert('As senhas não coincidem.');
      return;
    }

    if (telefone.replace(/\D/g, '').length < 10 || telefone.replace(/\D/g, '').length > 13) {
      toast.error('O telefone deve conter entre 10 e 13 dígitos.');
      return;
    }
    
    if (email.length < 5 || email.length > 50 || email !== confirmarEmail) {
      toast.error('Os e-mails devem coincidir e ter entre 5 e 50 caracteres.');
      return;
    }

    if (senha.length < 6 || senha.length > 20 || senha !== confirmarSenha) {
      toast.error('As senhas devem coincidir e ter entre 6 e 20 caracteres.');
      return;
    }

    try {
      // Passa a URL da foto para a função de cadastro
      await cadastrarUsuario(nome, senha, email, cpf, endereco, telefone);
  
      resetForm();
      navigate('/perfil');
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      toast.error("Erro ao fazer o cadastro");
    }
  };

  const resetForm = () => {
    setNome('');
    setCpf('');
    setEndereco('');
    setTelefone('');     
    setEmail('');
    setConfirmarEmail('');
    setSenha('');
    setConfirmarSenha('');
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
        value={nome}
        onChange={(e) => setNome(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
        inputProps={{ minLength: 3, maxLength: 100, autoComplete: 'new-name' }}
        helperText="O nome deve ter entre 10 e 50 caracteres."
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="CPF"
        value={cpf}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
          const formattedValue = value
            .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona o primeiro ponto
            .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona o segundo ponto
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Adiciona o hífen
          setCpf(formattedValue);
        }}
        inputProps={{
          maxLength: 14, // Máximo de caracteres para o formato XXX.XXX.XXX-XX
          autoComplete: 'off',
        }}
        helperText=""
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
        inputProps={{ minLength: 10, maxLength: 200, autoComplete: 'off' }}
        helperText="O endereço deve ter entre 10 e 200 caracteres."
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Número de Telefone WhatsApp"
        value={telefone}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
          const formattedValue = value
            .replace(/^(\d{2})(\d)/, '($1) $2') // Adiciona parênteses para o DDD
            .replace(/(\d{4,5})(\d{4})$/, '$1-$2'); // Adiciona o traço para o número
          setTelefone(formattedValue); // Atualiza o estado com o número formatado
        }}
        inputProps={{
          maxLength: 17, // Máximo de caracteres para o formato (XX) XXXXX-XXXX
          autoComplete: 'off',
        }}
        helperText=""
        required
      />

     
    
      <TextField
        fullWidth
        margin="normal"
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        inputProps={{ minLength: 5, maxLength: 50, autoComplete: 'new-email' }}
        helperText="O e-mail deve ter entre 5 e 50 caracteres."
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Confirmar E-mail"
        type="email"
        value={confirmarEmail}
        onChange={(e) => setConfirmarEmail(e.target.value)}
        inputProps={{ minLength: 5, maxLength: 50, autoComplete: 'new-email-confirm' }}
        helperText="O e-mail deve ter entre 5 e 50 caracteres."
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        inputProps={{ minLength: 6, maxLength: 20, autoComplete: 'new-password' }}
        helperText="A senha deve ter entre 6 e 20 caracteres."
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Confirmar Senha"
        type="password"
        value={confirmarSenha}
        onChange={(e) => setConfirmarSenha(e.target.value)}
        inputProps={{ minLength: 6, maxLength: 20, autoComplete: 'new-password-confirm' }}
        helperText="A senha deve ter entre 6 e 20 caracteres."
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