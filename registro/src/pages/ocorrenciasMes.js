import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseConnection';
import { Container, Box, Typography, List, ListItem, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Adicionamos onAuthStateChanged

function OcorrenciasMes() {
  const navigate = useNavigate();
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    // Usamos onAuthStateChanged para garantir que temos o usuário
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Consulta modificada para verificar o campo correto
          const ocorrenciasRef = collection(db, 'ocorrencias');
          
          // Tente estas variações de campo (ajuste conforme sua estrutura)
          const q = query(
            ocorrenciasRef, 
            where('usuarioId', '==', user.uid) // ou 'userID', 'uid', 'user.uid' etc.
            // Adicione filtro por mês se necessário
          );
          
          const querySnapshot = await getDocs(q);
          
          const ocorrenciasList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setOcorrencias(ocorrenciasList);
        } catch (error) {
          console.error('Erro ao buscar ocorrências:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        console.log('Usuário não autenticado');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]); // Adicionei navigate às dependências

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography>Carregando suas ocorrências...</Typography>
        </Box>
      </Container>
    );
  }


  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/registroProblemas')}
          sx={{ mb: 3 }}
        >
          Voltar para Registro
        </Button>

        <Typography variant="h4" gutterBottom>
          Minhas Ocorrências
        </Typography>
        
        {ocorrencias.length === 0 ? (
          <Typography variant="body1">Nenhuma ocorrência encontrada.</Typography>
        ) : (
          <List>
            {ocorrencias.map((ocorrencia) => (
              <ListItem key={ocorrencia.id}>
                <Paper sx={{ p: 2, width: '100%' }}>
                  {ocorrencia.nomeUsuario && (
                    <Typography variant="body1">
                      <strong>Usuário:</strong> {ocorrencia.nomeUsuario}
                    </Typography>
                  )}
                  <Typography variant="body1">
                    <strong>Descrição:</strong> {ocorrencia.descricao}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Endereço:</strong> {ocorrencia.endereco}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Data e Horário da Ocorrência:</strong> {ocorrencia.data}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Status:</strong> {ocorrencia.status || 'Pendente'}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
}

export default OcorrenciasMes;