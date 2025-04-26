import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, writeBatch, doc } from "firebase/firestore";
import { db } from "../services/firebaseConnection";
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Paper, Typography, Box, CircularProgress, Button, List, ListItem, ListItemText, Chip } from '@mui/material';

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
          ultimaAtualizacao: new Date()
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
          ocorrencias: []
        };
      }
      agrupamento[enderecoNormalizado].count++;
      agrupamento[enderecoNormalizado].ocorrencias.push(ocorrencia);
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
      const ocorrenciasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
              <InfoWindow position={selectedOcorrencia.coordenadas} onCloseClick={() => setSelectedOcorrencia(null)}>
                <div>
                  <h3>Detalhes do Local</h3>
                  <p><strong>Endereço:</strong> {selectedOcorrencia.enderecoOriginal}</p>
                  <p><strong>Ocorrências:</strong> {selectedOcorrencia.count}</p>
                  <p><strong>Últimas ocorrências:</strong></p>
                  <ul>
                    {selectedOcorrencia.ocorrencias.slice(0, 3).map((oc, i) => (
                      <li key={i}>{oc.descricao || 'Sem descrição'}</li>
                    ))}
                    {selectedOcorrencia.ocorrencias.length > 3 && (
                      <li>... e mais {selectedOcorrencia.ocorrencias.length - 3}</li>
                    )}
                  </ul>
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
                  secondary={`${endereco.count} ocorrência(s)`}
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