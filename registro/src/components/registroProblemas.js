import React, { useState, useEffect } from 'react';
import { Button, Checkbox, FormControlLabel, TextField, Typography, Container, Box, List, ListItem, IconButton } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import '../styles/registroProblemas.css';

function RegistroProblemas() {
    const [ocorrencias, setOcorrencias] = useState([
        { id: 1, descricao: 'Buraco na rua' },
        { id: 2, descricao: 'Lâmpada queimada' },
        { id: 3, descricao: 'Alagamento' },
        { id: 4, descricao: 'Descarte irregular de lixo' },
        { id: 5, descricao: 'Vazamento de água' },
    ]);

    const [selecionadas, setSelecionadas] = useState([]);
    const [novaOcorrencia, setNovaOcorrencia] = useState('');
    const [localizacao, setLocalizacao] = useState('');
    const [erroLocalizacao, setErroLocalizacao] = useState(null);
    const [enderecoManual, setEnderecoManual] = useState('');
    const [resultadoEndereco, setResultadoEndereco] = useState('');
    const [melhoria, setMelhoria] = useState('');
    const [imagens, setImagens] = useState([]);

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyC56FmvnlXf3SsSzVwWkIhAkYYxNJCwavQ';

    useEffect(() => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            console.log("Google Maps API carregada.");
        };

        script.onerror = () => {
            setErroLocalizacao("Erro ao carregar o Google Maps.");
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [apiKey]);

    const obterLocalizacao = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    let { latitude, longitude } = position.coords;
                    obterEndereco(latitude, longitude);
                },
                (error) => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            setErroLocalizacao('Usuário negou a solicitação de Geolocalização.');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            setErroLocalizacao('Informação de localização não está disponível.');
                            break;
                        case error.TIMEOUT:
                            setErroLocalizacao('A solicitação para obter a localização expirou.');
                            break;
                        default:
                            setErroLocalizacao('Erro ao obter a localização.');
                    }
                }
            );
        } else {
            setErroLocalizacao('Geolocalização não é suportada pelo navegador.');
        }
    };

    const obterEndereco = (latitude, longitude) => {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (data.status === 'OK' && data.results.length > 0) {
                    const endereco = data.results[0].formatted_address;
                    setLocalizacao(endereco);
                } else {
                    setErroLocalizacao('Não foi possível obter o endereço.');
                }
            })
            .catch((error) => {
                setErroLocalizacao('Erro ao obter o endereço.');
                console.error('Erro ao acessar a Geocoding API:', error);
            });
    };
    
    const abrirMapa = () => {
        if (localizacao) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localizacao)}`;
            window.open(url, '_blank');
        } else {
            setErroLocalizacao('Localização não disponível. Obtenha a localização antes de abrir o mapa.');
        }
    };

    const buscarEnderecoManual = () => {
        if (enderecoManual.trim() === '') {
            setErroLocalizacao('Digite um endereço válido.');
            return;
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(enderecoManual)}&key=${apiKey}`;

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (data.status === 'OK' && data.results.length > 0) {
                    const resultado = data.results[0];
                    setResultadoEndereco(`Endereço: ${resultado.formatted_address}, Coordenadas: ${resultado.geometry.location.lat}, ${resultado.geometry.location.lng}`);
                    setErroLocalizacao('');
                } else {
                    setErroLocalizacao('Endereço não encontrado.');
                }
            })
            .catch((error) => {
                setErroLocalizacao('Erro ao buscar o endereço.');
                console.error(error);
            });
    };

    const handleCheckboxChange = (id) => {
        if (selecionadas.includes(id)) {
            setSelecionadas(selecionadas.filter(item => item !== id));
        } else {
            setSelecionadas([...selecionadas, id]);
        }
    };

    const handleAdicionarOcorrencia = () => {
        if (novaOcorrencia.trim() === '') return;
        const nova = {
            id: ocorrencias.length + 1,
            descricao: novaOcorrencia,
        };
        setOcorrencias([...ocorrencias, nova]);
        setNovaOcorrencia('');
    };

    const handleSubmit = () => {
        const ocorrenciasSelecionadas = ocorrencias.filter(ocorrencia => selecionadas.includes(ocorrencia.id));
        alert(`Ocorrências selecionadas: ${ocorrenciasSelecionadas.map(o => o.descricao).join(', ')}\nSugestão de melhoria: ${melhoria}`);
        setSelecionadas([]);
        setMelhoria('');
        setImagens([]);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const imagesWithPreview = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setImagens((prevImages) => [...prevImages, ...imagesWithPreview]);
    };

    const handleRemoveImage = (index) => {
        setImagens((prevImages) => prevImages.filter((_, i) => i !== index));
    };

    const limparLocalizacaoAtual = () => {
        setLocalizacao('');
        setErroLocalizacao(null);
    };

    const limparEnderecoManual = () => {
        setEnderecoManual('');
        setResultadoEndereco('');
    };

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom>Registrar Ocorrências da sua Região</Typography>
            <Typography>Selecione as ocorrências que deseja reportar:</Typography>

            <List>
                {ocorrencias.map((ocorrencia) => (
                    <ListItem key={ocorrencia.id}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selecionadas.includes(ocorrencia.id)}
                                    onChange={() => handleCheckboxChange(ocorrencia.id)}
                                />
                            }
                            label={ocorrencia.descricao}
                        />
                    </ListItem>
                ))}
            </List>

            <Button variant="contained" color="primary" onClick={handleSubmit}>Registrar Ocorrências Selecionadas</Button>

            <Box mt={4}>
                <Typography variant="h6">Descreva sua Ocorrência</Typography>
                <TextField
                    label="Descreva a nova ocorrência"
                    value={novaOcorrencia}
                    onChange={(e) => setNovaOcorrencia(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <Button variant="contained" color="secondary" onClick={handleAdicionarOcorrencia}>Adicionar Ocorrência</Button>
            </Box>

            <Box mt={4}>
                <Typography variant="h6">Localização do Problema</Typography>
                <Button variant="outlined" onClick={obterLocalizacao}>Obter Localização Atual</Button>
                <Button variant="outlined" onClick={limparLocalizacaoAtual} disabled={!localizacao}>Limpar Localização</Button>
                {localizacao && (
                    <Box mt={2}>
                        <Typography><strong>Endereço:</strong> {localizacao}</Typography>
                        <IconButton onClick={abrirMapa}>
                            <MapIcon color="primary" />
                        </IconButton>
                        <Typography variant="body2">Clique no ícone para abrir o Google Maps.</Typography>
                    </Box>
                )}
                {erroLocalizacao && <Typography color="error">{erroLocalizacao}</Typography>}
            </Box>

            <Box mt={4}>
                <Typography variant="h6">Buscar Localização por Endereço</Typography>
                <TextField
                    label="Digite o endereço"
                    value={enderecoManual}
                    onChange={(e) => setEnderecoManual(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <Button variant="outlined" onClick={buscarEnderecoManual}>Buscar Endereço</Button>
                <Button variant="outlined" onClick={limparEnderecoManual} disabled={!enderecoManual}>Limpar Endereço</Button>
                {resultadoEndereco && <Typography>{resultadoEndereco}</Typography>}
            </Box>

            <Box mt={4}>
                <Typography variant="h6">Adicionar Imagens</Typography>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                />
                <Box mt={2} display="flex" flexWrap="wrap">
                    {imagens.map((imagem, index) => (
                        <Box key={index} position="relative" m={1}>
                            <img
                                src={imagem.preview}
                                alt={`preview-${index}`}
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            />
                            <IconButton
                                onClick={() => handleRemoveImage(index)}
                                style={{ position: 'absolute', top: 0, right: 0 }}
                            >
                                &times;
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box mt={4}>
                <Typography variant="h6">Sugestão de Melhoria</Typography>
                <TextField
                    label="Sugestão de melhoria"
                    value={melhoria}
                    onChange={(e) => setMelhoria(e.target.value)}
                    fullWidth
                    margin="normal"
                />
            </Box>
        </Container>
    );
}

export default RegistroProblemas;
