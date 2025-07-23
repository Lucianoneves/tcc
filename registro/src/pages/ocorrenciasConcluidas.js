// src/pages/OcorrenciasConcluidas.js
import React, { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, List, ListItem, ListItemText, Divider, Box, Paper, Chip } from '@mui/material';
import { db } from "../services/firebaseConnection";
import { collection, onSnapshot } from "firebase/firestore";
import { getImages } from "../pages/imageDB";
import { useNavigate } from 'react-router-dom';


const OcorrenciasConcluidas = () => {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagensPorOcorrencia, setImagensPorOcorrencia] = useState({});
  const [imagensExecucaoPorOcorrencia, setImagensExecucaoPorOcorrencia] = useState({});
  const navigate = useNavigate();


  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ocorrencias"), async (snapshot) => {
      const concluidas = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(oc => oc.status === "Concluído");

      // Carregar imagens normais e de execução
      const imagensNormais = {};
      const imagensExecucao = {};

      for (const oc of concluidas) {
        imagensNormais[oc.id] = await getImages(oc.id);
        imagensExecucao[oc.id] = await getImages(`execucao_${oc.id}`);
      }

      setOcorrencias(concluidas);
      setImagensPorOcorrencia(imagensNormais);
      setImagensExecucaoPorOcorrencia(imagensExecucao);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Ocorrências Concluídas</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
  <button
    onClick={() => navigate('/ocorrencias')} // ajuste para a rota correta do seu projeto
    style={{
      padding: '8px 16px',
      backgroundColor: '#1976d2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    Voltar para Ocorrências
  </button>
</Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : ocorrencias.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 2 }}>Nenhuma ocorrência concluída encontrada.</Typography>
      ) : (
        <List>
          {ocorrencias.map((oc, index) => (
            <React.Fragment key={oc.id}>
              <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={<Typography variant="h6">{oc.descricao}</Typography>}
                    secondary={
                      <>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Chip label={oc.status} color="success" />
                          <Chip label={oc.gravidade} color="warning" />
                          <Chip label={oc.categoria} color="primary" />
                        </Box>
                        <Typography variant="body2"><strong>Protocolo:</strong> {oc.protocolo || 'Não informado'}</Typography>
                        <Typography variant="body2"><strong>Enviado por:</strong> {oc.nomeUsuario || 'Não identificado'}</Typography>
                        <Typography variant="body2"><strong>Data da Ocorrência:</strong> {oc.data || 'Não informada'}</Typography>
                        <Typography variant="body2"><strong>Endereço:</strong> {oc.endereco || 'Não informado'}</Typography>
                        <Typography variant="body2"><strong>Descrição do Usuário:</strong> {oc.observacoes || 'Nenhuma'}</Typography>
                        <Typography variant="body2"><strong>Tarefa Executada:</strong> {oc.tarefaEditada || 'Não registrada'}</Typography>
                        <Typography variant="body2"><strong>Data da Execução:</strong> {oc.dataTarefaExecutada ? new Date(oc.dataTarefaExecutada).toLocaleString('pt-BR') : 'Não informada'}</Typography>

                        {/* Imagens do usuário */}
                        {imagensPorOcorrencia[oc.id] && imagensPorOcorrencia[oc.id].length > 0 && (
                          <Box mt={2}>
                            <Typography variant="subtitle2" gutterBottom><strong>Imagens do Usuário:</strong></Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {imagensPorOcorrencia[oc.id].map((img, idx) => (
                                <Box key={idx} sx={{ width: 100, height: 100, overflow: 'hidden', borderRadius: 2, border: '1px solid #ccc' }}>
                                  <img src={img.url} alt={`Imagem ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Imagens de execução */}
                        {imagensExecucaoPorOcorrencia[oc.id] && imagensExecucaoPorOcorrencia[oc.id].length > 0 && (
                          <Box mt={2}>
                            <Typography variant="subtitle2" gutterBottom><strong>Imagens da Execução:</strong></Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {imagensExecucaoPorOcorrencia[oc.id].map((img, idx) => (
                                <Box key={idx} sx={{ width: 100, height: 100, overflow: 'hidden', borderRadius: 2, border: '1px solid #ccc' }}>
                                  <img src={img.url} alt={`Execução ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                              ))}
                            </Box>
                          </Box>
                          
                        )}                   


                      </>
                    }
                    
                  />
                
                </ListItem>
              </Paper>
              {index < ocorrencias.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Container>
  );
};

export default OcorrenciasConcluidas;
