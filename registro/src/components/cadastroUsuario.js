import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/cadastroUsuario.css';

function CadastroUsuario() {
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

   const handleSubmit = async (e) => {
    e.preventDefault();

    if (email !== confirmarEmail) {
        alert('Os e-mails não coincidem!');
        return;
    }

    if (senha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }

    alert('Cadastro realizado com sucesso!');

    // Enviar telefone para o backend
    try {
        const response = await fetch('http://localhost:3001/enviar-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefone: `55${telefone}`}),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.success); // Mensagem de sucesso do backend
        } else {
            alert(result.error); // Mensagem de erro do backend
        }
    } catch (error) {
        console.error('Erro ao enviar SMS:', error);
        alert('Erro ao enviar SMS.');
    }

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

    navigate('/registroProblemas');
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

    const handleNomeChange = (e) => {
        const apenasLetras = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
        setNomeCompleto(apenasLetras);
    };

    const handleCpfChange = (e) => {
        const apenasNumeros = e.target.value.replace(/\D/g, '');
        setCpf(apenasNumeros);
    };

    const handleTelefoneChange = (e) => {
        const apenasNumeros = e.target.value.replace(/\D/g, '');
        setTelefone(apenasNumeros);
    };

    const handleEsqueciSenha = () => {
        navigate('/redefinir-senha');
    };

    return (
        <div className="cadastro-usuario-container">
            <h1>Cadastro de Usuário</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nome Completo</label>
                    <input
                        type="text"
                        value={nomeCompleto}
                        onChange={handleNomeChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>CPF</label>
                    <input
                        type="text"
                        value={cpf}
                        onChange={handleCpfChange}
                        maxLength={11} // Limita a 11 caracteres
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Endereço</label>
                    <textarea
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>Número de Telefone WhatsApp</label>
                    <input
                        type="text"
                        value={telefone}
                        onChange={handleTelefoneChange}
                        maxLength={13} // Limita a 11 caracteres
                        placeholder="Ex.: 11987654321"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Foto de Perfil</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                    />
                </div>

                {fotoPreview && (
                    <div className="foto-preview">
                        <p>Pré-visualização da Foto:</p>
                        <img
                            src={fotoPreview}
                            alt="Foto de Perfil"
                            style={{ width: '150px', height: '150px', borderRadius: '50%' }}
                        />
                    </div>
                )}

                <div className="form-group">
                    <label>E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Confirmar E-mail</label>
                    <input
                        type="email"
                        value={confirmarEmail}
                        onChange={(e) => setConfirmarEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Senha</label>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Confirmar Senha</label>
                    <input
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">Cadastrar</button>
            </form>

            <div className="esqueci-senha">
                <p>Esqueceu sua senha?</p>
                <button onClick={handleEsqueciSenha}>Esqueci minha senha</button>
            </div>
        </div>
    );
}

export default CadastroUsuario;
