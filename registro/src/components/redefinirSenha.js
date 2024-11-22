import React, { useState } from 'react';

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
        <div className="redefinir-senha-container">
            <h2>Redefinir Senha</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Enviar Link de Redefinição</button>
            </form>
            {mensagem && <p>{mensagem}</p>}
        </div>
    );
}

export default RedefinirSenha;
