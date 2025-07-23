// lucianoneves/tcc/tcc-b8fc0d0b4c4e2c6f5bebcd48eed52330a6de6f6f/registro/src/services/server.js (Exemplo Adaptado)

const express = require('express');
const bodyParser = require('body-parser'); 
const admin = require('firebase-admin'); // Certifique-se de ter o Firebase Admin SDK configurado

// Assumindo que firebaseConnection.js inicializa o admin SDK
const firebaseApp = require('../services/firebaseConnection');
const db = admin.firestore();

const app = express();
app.use(bodyParser.json());

// Rota para registrar uma nova ocorrência
app.post('/api/ocorrencias', async (req, res) => {
  try {
    const { descricao, localizacao, fotos, categoria, gravidade } = req.body; // Adicionado categoria e gravidade

    if (!descricao || !localizacao || !categoria || !gravidade) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando: descrição, localização, categoria, gravidade.' });
    }

    const novaOcorrencia = {
      descricao,
      localizacao,
      fotos: fotos || [], // Fotos podem ser opcionais
      dataRegistro: admin.firestore.FieldValue.serverTimestamp(),
      status: 'Registrada',
      categoria, // Salva a categoria
      gravidade  // Salva a gravidade
    };

    const docRef = await db.collection('ocorrencias').add(novaOcorrencia);
    res.status(201).json({ id: docRef.id, message: 'Ocorrência registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar ocorrência:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para obter ocorrências (pode adicionar filtros por categoria e gravidade)
app.get('/api/ocorrencias', async (req, res) => {
  try {
    let query = db.collection('ocorrencias');
    const { categoria, gravidade, status } = req.query; // Filtros opcionais

    if (categoria) {
      query = query.where('categoria', '==', categoria);
    }
    if (gravidade) {
      query = query.where('gravidade', '==', gravidade);
    }
    if (status) {
        query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('dataRegistro', 'desc').get();
    const ocorrencias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(ocorrencias);
  } catch (error) {
    console.error('Erro ao buscar ocorrências:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Outras rotas (PUT, DELETE) também precisariam ser ajustadas se permitirem atualização desses campos.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});