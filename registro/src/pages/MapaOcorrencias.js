import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, limit, writeBatch, doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebaseConnection";
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Paper, Typography, Box, CircularProgress, Button } from '@mui/material';

const MapaOcorrencias = () => {
  // ============== ESTADOS ==============
  const navigate = useNavigate(); 
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: -15.7801, lng: -47.9292 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // ============== CONSTANTES ==============
  const mapContainerStyle = {
    width: '100%',
    height: '500px'
  };

  // ============== FUNÇÕES AUXILIARES ==============
  const getColorByFrequency = (index) => {
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    return colors[Math.min(index, colors.length - 1)];
  };

  const gerarIdDoEndereco = (endereco) => {
    if (!endereco) return 'sem_endereco';
    return endereco
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .substring(0, 50);
  };

  const extrairCoordenadas = (endereco) => {
    if (endereco.includes('70000')) {
      return { 
        lat: -15.7801 + (Math.random() * 0.02 - 0.01), 
        lng: -47.9292 + (Math.random() * 0.02 - 0.01) 
      };
    } else if (endereco.includes('80000')) {
      return { 
        lat: -25.4284 + (Math.random() * 0.02 - 0.01), 
        lng: -49.2733 + (Math.random() * 0.02 - 0.01) 
      };
    }
    return null;
  };

  const processarLocalizacoesFrequentes = (ocorrencias) => {
    const contagem = {};
    
    const ocorrenciasValidas = ocorrencias.filter(oc => oc.endereco && oc.endereco.trim() !== '');
    
    ocorrenciasValidas.forEach(ocorrencia => {
      contagem[ocorrencia.endereco] = (contagem[ocorrencia.endereco] || 0) + 1;
    });
    
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([endereco, count]) => ({
        endereco,
        count,
        coordenadas: extrairCoordenadas(endereco) || mapCenter
      }));
  };

  // ============== FUNÇÕES DO FIREBASE ==============
  const salvarLocalizacoesFrequentes = async (localizacoes) => {
    try {
      const batch = writeBatch(db);
      const locFrequentesRef = collection(db, "localizacoes_frequentes");
      
      const q = query(locFrequentesRef);
      const querySnapshot = await getDocs(q);
      
      const enderecosAtuais = new Set(localizacoes.map(l => l.endereco));
      const docsParaRemover = [];
      
      querySnapshot.forEach((doc) => {
        if (!enderecosAtuais.has(doc.data().endereco)) {
          docsParaRemover.push(doc.ref);
        }
      });
      
      docsParaRemover.forEach(ref => batch.delete(ref));
      
      for (const localizacaoItem of localizacoes) {
        const docRef = doc(db, "localizacoes_frequentes", gerarIdDoEndereco(localizacaoItem.endereco));
        batch.set(docRef, {
          endereco: localizacaoItem.endereco,
          count: localizacaoItem.count,
          coordenadas: localizacaoItem.coordenadas,
          ultimaAtualizacao: new Date()
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error("Erro ao sincronizar localizações:", error);
      throw error;
    }
  };

  // ============== EFFECTS ==============
  useEffect(() => {
    const fetchAndProcessOcorrencias = async () => {
      try {
        const ocorrenciasRef = collection(db, "ocorrencias");
        const q = query(ocorrenciasRef);
        const querySnapshot = await getDocs(q);
  
        const ocorrenciasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const localizacoesFrequentes = processarLocalizacoesFrequentes(ocorrenciasList);
        
        setOcorrencias(localizacoesFrequentes);
        await salvarLocalizacoesFrequentes(localizacoesFrequentes);
  
        if (localizacoesFrequentes.length > 0) {
          const primeiraLocalizacao = extrairCoordenadas(localizacoesFrequentes[0].endereco);
          if (primeiraLocalizacao) setMapCenter(primeiraLocalizacao);
        }
  
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar ocorrências:", error);
        setLoading(false);
      }
    };
  
    const atualizarLocalizacoesFrequentes = async () => {
      try {
        const ocorrenciasRef = collection(db, "ocorrencias");
        const q = query(ocorrenciasRef);
        const querySnapshot = await getDocs(q);
  
        const ocorrenciasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const localizacoesFrequentes = processarLocalizacoesFrequentes(ocorrenciasList);
        
        await salvarLocalizacoesFrequentes(localizacoesFrequentes);
      } catch (error) {
        console.error("Erro ao atualizar localizações frequentes:", error);
      }
    };
  
    const fetchData = async () => {
      try {
        const locFrequentesRef = collection(db, "localizacoes_frequentes");
        const q = query(locFrequentesRef, orderBy("count", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const locsSalvas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOcorrencias(locsSalvas);
          setLoading(false);
          atualizarLocalizacoesFrequentes();
        } else {
          await fetchAndProcessOcorrencias();
        }
      } catch (error) {
        console.error("Erro ao buscar localizações frequentes:", error);
        await fetchAndProcessOcorrencias();
      }
    };
  
    fetchData();
    
    const unsubscribe = onSnapshot(collection(db, "ocorrencias"), fetchData);
    return () => unsubscribe();
  }, []);

  // ============== RENDERIZAÇÃO ==============
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" gutterBottom>
          Mapa das Ocorrências Mais Frequentes
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

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Mapa das Ocorrências Mais Frequentes
        </Typography>
        
        <Typography variant="body1" gutterBottom>
          Este mapa mostra os locais com maior número de ocorrências registradas.
        </Typography>

        <LoadScript 
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          onLoad={() => setIsMapLoaded(true)}
        >
          {isMapLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={12}
            >
              {ocorrencias.map((ocorrencia, index) => (
                <Marker
                  key={index}
                  position={ocorrencia.coordenadas}
                  onClick={() => setSelectedOcorrencia(ocorrencia)}
                  icon={{
                    url: `https://maps.google.com/mapfiles/ms/icons/${getColorByFrequency(index)}-dot.png`,
                    scaledSize: new window.google.maps.Size(30, 30)
                  }}
                />
              ))}

              {selectedOcorrencia && (
                <InfoWindow
                  position={selectedOcorrencia.coordenadas}
                  onCloseClick={() => setSelectedOcorrencia(null)}
                >
                  <div>
                    <h3>Ocorrências Registradas</h3>
                    <p><strong>Endereço:</strong> {selectedOcorrencia.endereco}</p>
                    <p><strong>Número de ocorrências:</strong> {selectedOcorrencia.count}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </LoadScript>

        <Box mt={2}>
          <Typography variant="h6">Locais com Mais Ocorrências</Typography>
          <ul>
            {ocorrencias.map((ocorrencia, index) => (
              <li key={index}>
                {index + 1}. {ocorrencia.endereco} - {ocorrencia.count} ocorrência(s)
              </li>
            ))}
          </ul>
        </Box>
      </Paper>
    </Paper>
  );
};

export default MapaOcorrencias;