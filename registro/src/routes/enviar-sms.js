// arquivo: enviar-sms.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio'); // ou outro serviço SMS

const app = express();
app.use(cors());
app.use(bodyParser.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Usando variável de ambiente


const client = twilio(accountSid, authToken);

app.post('/enviar-sms', async (req, res) => {
    const { telefone } = req.body;

    try {
        const message = await client.messages.create({
            body: JSON.stringify({ telefone: `55${telefone}` }),
          
            to: telefone
        });

        res.status(200).json({ success: 'SMS enviado com sucesso!', message });
    } catch (error) {
        console.error('Erro ao enviar SMS:', error);
        res.status(500).json({ error: 'Erro ao enviar SMS.' });
    }
});

app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});