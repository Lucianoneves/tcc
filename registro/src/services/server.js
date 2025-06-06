 // Esse codigo  implementa um servidor Backend usando  Node.js com o  framework Express.js o codigo tem a função  receber a uma requesição POST com um numero de telefone,
 // Rota para enviar e redefinir a senha  receber  um email POST. configura o email  de redefinição desenha utilizando o Nodemailer // 



// server.js
const express = require('express');
const multer = require("multer");
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




// Criar a pasta "uploads" caso não exista
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuração do Multer para salvar imagens localmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Diretório onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Rota para upload de imagem
app.post("/upload", upload.single("foto"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma imagem enviada" });
  }
  const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ success: "Imagem enviada com sucesso!", imageUrl });
});

// Servir imagens da pasta "uploads"
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});