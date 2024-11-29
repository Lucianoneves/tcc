// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3001; // Altere conforme necessário

app.post('/enviar-sms', (req, res) => {
    console.log('Corpo da requisição recebido no backend:', req.body);

    const { telefone } = req.body;
    if (!telefone) {
        return res.status(400).json({ error: 'O campo telefone é obrigatório.' });
    }

    // Simulação de envio (substitua pelo serviço SMS que você usa)
    res.status(200).json({ success: `SMS enviado para o número ${telefone}` });
});

// Rota para enviar o e-mail de redefinição de senha
app.post('/enviar-redefinicao-senha', (req, res) => {
    const { email } = req.body;

    const mailOptions = {
        from: 'seu_email@gmail.com',
        to: email,
        subject: 'Redefinição de Senha',
        text: 'Clique aqui para redefinir sua senha: http://localhost:3000/redefinir-senha'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Erro ao enviar o e-mail.');
        }
        res.status(200).send('E-mail de redefinição enviado com sucesso!');
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
