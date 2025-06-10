import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, writeBatch, doc } from "firebase/firestore";
import { db } from "../services/firebaseConnection";
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Paper, Typography, Box, CircularProgress, Button, List, ListItem, ListItemText, Chip, Divider } from '@mui/material';

const MapaOcorrencias = () => {
  const navigate = useNavigate();
  const [ocorrencias, setOcorrencias] = useState([]);
  const [enderecosAgrupados, setEnderecosAgrupados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: -15.7801, lng: -47.9292 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState(null);

  const mapContainerStyle = {
    width: '100%',
    height: '500px'
  };

  // Funções auxiliares
  const getColorByFrequency = useCallback((count) => {
    if (count > 20) return 'red';
    if (count > 10) return 'orange';
    if (count > 5) return 'yellow';
    return 'green';
  }, []);

  const geocodificarEndereco = useCallback(async (endereco) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          lat: -15.7801 + (Math.random() * 0.1 - 0.05),
          lng: -47.9292 + (Math.random() * 0.1 - 0.05)
        });
      }, 100);
    });
  }, []);

  const formatarData = useCallback((timestamp) => {
    if (!timestamp) return 'Data não disponível';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    // Formato SI (ISO 8601): YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }, []);



  const salvarEnderecosFrequentes = useCallback(async (enderecosAgrupados) => {
    try {
      const batch = writeBatch(db);
      const enderecosRef = collection(db, "enderecos_frequentes");

      const snapshot = await getDocs(enderecosRef);
      snapshot.forEach((doc) => batch.delete(doc.ref));

      enderecosAgrupados.forEach((endereco) => {
        const docRef = doc(enderecosRef, endereco.id);
        batch.set(docRef, {
          endereco: endereco.enderecoOriginal,
          quantidade: endereco.count,
          coordenadas: endereco.coordenadas,
          ultimaAtualizacao: new Date(),
          ultimaOcorrencia: endereco.ultimaOcorrencia
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Erro ao salvar endereços frequentes:", error);
    }
  }, []);


  const processarEnderecos = useCallback(async (ocorrencias) => {
    const ocorrenciasComEndereco = ocorrencias.filter(o => o.endereco?.trim());
    const agrupamento = {};

    ocorrenciasComEndereco.forEach(ocorrencia => {
      const enderecoNormalizado = ocorrencia.endereco.toLowerCase().trim();
      if (!agrupamento[enderecoNormalizado]) {
        agrupamento[enderecoNormalizado] = {
          enderecoOriginal: ocorrencia.endereco,
          count: 0,
          ocorrencias: [],
          ultimaOcorrencia: null
        };
      }

      // Adiciona TODOS os dados da ocorrência ao grupo
      agrupamento[enderecoNormalizado].ocorrencias.push({
        ...ocorrencia, // Mantém todos os campos originais
        timestamp: ocorrencia.timestamp || ocorrencia.data || ocorrencia.createdAt,
      });

      agrupamento[enderecoNormalizado].count++;

      // Atualiza a última ocorrência
      const dataOcorrencia = ocorrencia.timestamp || ocorrencia.data || ocorrencia.createdAt;
      if (dataOcorrencia) {
        if (!agrupamento[enderecoNormalizado].ultimaOcorrencia ||
          dataOcorrencia > agrupamento[enderecoNormalizado].ultimaOcorrencia) {
          agrupamento[enderecoNormalizado].ultimaOcorrencia = dataOcorrencia;
        }
      }
    });



    const enderecosAgrupadosArray = Object.values(agrupamento).sort((a, b) => b.count - a.count);

    const enderecosComCoordenadas = await Promise.all(
      enderecosAgrupadosArray.map(async (grupo) => {
        try {
          const coordenadas = await geocodificarEndereco(grupo.enderecoOriginal);
          return {
            ...grupo,
            coordenadas,
            id: grupo.enderecoOriginal.replace(/\s+/g, '_').substring(0, 50)
          };
        } catch (error) {
          console.error(`Erro ao geocodificar ${grupo.enderecoOriginal}:`, error);
          return null;
        }
      })
    );




    return enderecosComCoordenadas.filter(Boolean);
  }, [geocodificarEndereco]);

  const fetchOcorrencias = useCallback(async () => {
    try {
      setLoading(true);
      setErroLocalizacao(null);

      const ocorrenciasRef = collection(db, "ocorrencias");
      const q = query(ocorrenciasRef, where("endereco", "!=", ""));
      const querySnapshot = await getDocs(q);
      const ocorrenciasList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Garante que temos um campo de data/timestamp
        timestamp: doc.data().timestamp || doc.data().data || doc.data().createdAt || null
      }));

      const enderecosProcessados = await processarEnderecos(ocorrenciasList);
      await salvarEnderecosFrequentes(enderecosProcessados);

      setEnderecosAgrupados(enderecosProcessados);
      setOcorrencias(ocorrenciasList);

      if (enderecosProcessados.length > 0) {
        const topLocations = enderecosProcessados.slice(0, 5);
        const soma = topLocations.reduce((acc, loc) => ({
          lat: acc.lat + loc.coordenadas.lat,
          lng: acc.lng + loc.coordenadas.lng
        }), { lat: 0, lng: 0 });

        setMapCenter({
          lat: soma.lat / topLocations.length,
          lng: soma.lng / topLocations.length
        });
      }
    } catch (error) {
      console.error("Erro ao buscar ocorrências:", error);
      setErroLocalizacao("Erro ao carregar dados. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  }, [processarEnderecos, salvarEnderecosFrequentes]);

  useEffect(() => {
    fetchOcorrencias();
  }, [fetchOcorrencias]);

  if (loading) {


    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Carregando ocorrências...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" gutterBottom>
          Mapa de Ocorrências por Endereço
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate('/ocorrencias')}
          sx={{ mb: 2 }}
        >
          Voltar para Ocorrências
        </Button>
      </Box>

      {erroLocalizacao && <Typography color="error" sx={{ mb: 2 }}>{erroLocalizacao}</Typography>}

      <Typography variant="body1" gutterBottom>
        Locais com maior número de ocorrências registradas. O tamanho e cor dos marcadores
        indicam a quantidade de ocorrências em cada local.
      </Typography>

      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        onLoad={() => setIsMapLoaded(true)}
      >
        {isMapLoaded && (
          <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={12}>
            {enderecosAgrupados.map((endereco) => (
              <Marker
                key={endereco.id}
                position={endereco.coordenadas}
                onClick={() => setSelectedOcorrencia(endereco)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: getColorByFrequency(endereco.count),
                  fillOpacity: 0.8,
                  strokeWeight: 0,
                  scale: Math.min(10 + endereco.count * 2, 30)
                }}
              />
            ))}

            {selectedOcorrencia && (
              <InfoWindow
                position={selectedOcorrencia.coordenadas}
                onCloseClick={() => setSelectedOcorrencia(null)}
              >
                <div style={{ maxWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedOcorrencia.enderecoOriginal}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Chip
                      label={`${selectedOcorrencia.count} ocorrências`}
                      color="primary"
                      size="small"
                    />
                    <Typography variant="body2">
                      Última: {formatarData(selectedOcorrencia.ultimaOcorrencia)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <List dense sx={{ py: 0 }}>
                    {selectedOcorrencia.ocorrencias
                      .sort((a, b) => (b.timestamp?.seconds || b.timestamp) - (a.timestamp?.seconds || a.timestamp))
                      .map((ocorrencia, index) => (
                        <ListItem
                          key={index}
                          divider={index < selectedOcorrencia.ocorrencias.length - 1}
                          sx={{ py: 1, px: 0 }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight="bold">
                                {formatarData(ocorrencia.timestamp)}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" component="span" display="block">
                                  {ocorrencia.descricao || "Sem descrição"}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                  {ocorrencia.tipo && (
                                    <Chip
                                      label={ocorrencia.tipo}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {ocorrencia.status && (
                                    <Chip
                                      label={ocorrencia.status}
                                      size="small"
                                      color={
                                        ocorrencia.status.toLowerCase() === 'resolvido' ? 'success' :
                                          ocorrencia.status.toLowerCase() === 'pendente' ? 'warning' : 'default'
                                      }
                                    />
                                  )}
                                </Box>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </div>
              </InfoWindow>
            )}




          </GoogleMap>
        )}
      </LoadScript>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Endereços com Mais Ocorrências</Typography>

        {enderecosAgrupados.length === 0 ? (
          <Typography>Nenhuma ocorrência com endereço encontrada.</Typography>
        ) : (
          <List>
            {enderecosAgrupados.slice(0, 10).map((endereco, index) => (
              <ListItem key={endereco.id} divider sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                <ListItemText
                  primary={`${index + 1}. ${endereco.enderecoOriginal}`}
                  secondary={
                    <>
                      <span>{endereco.count} ocorrência(s)</span>
                      <br />
                      <span>Última ocorrência: {formatarData(endereco.ultimaOcorrencia)}</span>
                    </>
                  }
                />
                <Chip
                  label={endereco.count}
                  color={endereco.count > 20 ? 'error' : endereco.count > 10 ? 'warning' : 'primary'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default MapaOcorrencias;