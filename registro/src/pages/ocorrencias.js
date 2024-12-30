import React, { useState, useEffect } from 'react';
import { Container, Typography, Checkbox, Button, TextField, Select, MenuItem, List, ListItem, ListItemText, ListItemSecondaryAction, FormControl, InputLabel, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/system';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Definir cores para cada status
const StatusSpan = styled('span')(({ theme, status }) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
    backgroundColor: status === 'Em análise' 
        ? '#ff9800' 
        : status === 'Pendente' 
        ? '#f44336' 
        : status === 'Concluído' 
        ? '#4caf50' 
        : '#9e9e9e'
}));


  
    
    const Ocorrencias = () => {
        const [ocorrencias, setOcorrencias] = useState([]);
        const [novaOcorrencia, setNovaOcorrencia] = useState('');
        const [descricaoEditada, setDescricaoEditada] = useState('');
        const [statusEditado, setStatusEditado] = useState('');
        const [editandoOcorrencia, setEditandoOcorrencia] = useState(null);
        const [isAdmin, setIsAdmin] = useState(true); // Exemplo: verificar se o usuário é admin
        const [selecionadas, setSelecionadas] = useState([]);
        const [snackbarOpen, setSnackbarOpen] = useState(false);
    
        // Carregar as ocorrências do localStorage
        useEffect(() => {
            const ocorrenciasSalvas = localStorage.getItem('ocorrencias');
            if (ocorrenciasSalvas) {
                setOcorrencias(JSON.parse(ocorrenciasSalvas));
            } else {
                const ocorrenciasPadrao = [
                    { id: 1, descricao: 'Buraco na rua', status: 'Pendente' },
                    { id: 2, descricao: 'Lâmpada queimada', status: 'Pendente' },
                    { id: 3, descricao: 'Alagamento', status: 'Pendente' },
                    { id: 4, descricao: 'Descarte irregular de lixo', status: 'Pendente' },
                    { id: 5, descricao: 'Vazamento de água', status: 'Pendente' },
                ];
                setOcorrencias(ocorrenciasPadrao);
                localStorage.setItem('ocorrencias', JSON.stringify(ocorrenciasPadrao));
            }
        }, []);
    
        // Salvar as ocorrências no localStorage
        useEffect(() => {
            if (ocorrencias.length > 0) {
                localStorage.setItem('ocorrencias', JSON.stringify(ocorrencias));
            }
        }, [ocorrencias]);
    
        // Salvar alterações na ocorrência editada
        const handleSalvarEdicao = (id) => {
            setOcorrencias(ocorrencias.map((ocorrencia) =>
                ocorrencia.id === id
                    ? { ...ocorrencia, descricao: descricaoEditada, status: statusEditado }
                    : ocorrencia
            ));
            setEditandoOcorrencia(null); // Limpar o estado de edição
            setDescricaoEditada(''); // Limpar o campo de descrição
            setStatusEditado(''); // Limpar o campo de status
        };
    
        // Iniciar a edição de uma ocorrência
        const handleIniciarEdicao = (ocorrencia) => {
            setDescricaoEditada(ocorrencia.descricao);
            setStatusEditado(ocorrencia.status);
            setEditandoOcorrencia(ocorrencia.id);
        };
    
        // Remover ocorrência
        const handleRemoverOcorrencia = (id) => {
            const novaLista = ocorrencias.filter((ocorrencia) => ocorrencia.id !== id);
            setOcorrencias(novaLista);
        };
    
        // Adicionar nova ocorrência
        const handleAdicionarOcorrencia = () => {
            if (novaOcorrencia.trim()) {
                const nova = { id: ocorrencias.length + 1, descricao: novaOcorrencia, status: 'Pendente' };
                setOcorrencias((prev) => [...prev, nova]);
                setNovaOcorrencia('');
            } else {
                alert('Por favor, descreva a nova ocorrência.');
            }
        };
    
        // Função para enviar as ocorrências para o órgão público
        const handleSubmit = () => {
            console.log('Ocorrências enviadas:', ocorrencias);
            setSnackbarOpen(true); // Exibe o Snackbar de sucesso
        };
    
        // Função para lidar com mudanças no checkbox
        const handleCheckboxChange = (id) => {
            setSelecionadas((prevSelecionadas) => {
                // Verificar se a ocorrência já está selecionada
                if (prevSelecionadas.includes(id)) {
                    // Se estiver, removemos ela da lista de selecionadas
                    return prevSelecionadas.filter((item) => item !== id);
                } else {
                    // Se não estiver, adicionamos ela à lista de selecionadas
                    return [...prevSelecionadas, id];
                }
            });
        };
    
        // Fechar Snackbar
        const handleCloseSnackbar = () => {
            setSnackbarOpen(false);
        };
    
        return (
            <Container>
                <Typography variant="h4" gutterBottom>Ocorrências Registradas</Typography>
                <Typography variant="body1">Selecione as ocorrências que deseja reportar:</Typography>
    
                <List>
                    {ocorrencias.map((ocorrencia) => (
                        <ListItem key={ocorrencia.id}>
                            {editandoOcorrencia === ocorrencia.id ? (
                                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                                    <TextField
                                        variant="outlined"
                                        value={descricaoEditada}
                                        onChange={(e) => setDescricaoEditada(e.target.value)}
                                        style={{ marginRight: 8 }}
                                    />
                                    <FormControl variant="outlined" style={{ marginRight: 8, minWidth: 120 }}>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={statusEditado}
                                            onChange={(e) => setStatusEditado(e.target.value)}
                                            label="Status"
                                        >
                                            <MenuItem value="Em análise">Em análise</MenuItem>
                                            <MenuItem value="Pendente">Pendente</MenuItem>
                                            <MenuItem value="Concluído">Concluído</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {isAdmin && <Button onClick={() => handleSalvarEdicao(ocorrencia.id)} variant="contained" color="primary">Salvar</Button>}
                                </div>
                            ) : (
                                <ListItemText>
                                    <Checkbox
                                        checked={selecionadas.includes(ocorrencia.id)}
                                        onChange={() => handleCheckboxChange(ocorrencia.id)}
                                    />
                                    {ocorrencia.descricao} -
                                    <StatusSpan status={ocorrencia.status}>
                                        {ocorrencia.status}
                                    </StatusSpan>
                                    {isAdmin && <Button onClick={() => handleIniciarEdicao(ocorrencia)} variant="outlined" color="primary" style={{ marginLeft: 8 }}>Editar</Button>}
                                    {isAdmin && <Button onClick={() => handleRemoverOcorrencia(ocorrencia.id)} variant="outlined" color="secondary" style={{ marginLeft: 8 }}>Remover</Button>}
                                </ListItemText>
                            )}
                        </ListItem>
                    ))}
                </List>
    
                <Button onClick={handleSubmit} variant="contained" color="primary">Enviar Ocorrências para Órgão Público</Button>
    
                {isAdmin && (
                    <div style={{ marginTop: 20 }}>
                        <Typography variant="h6">Adicionar Nova Ocorrência</Typography>
                        <TextField
                            variant="outlined"
                            value={novaOcorrencia}
                            onChange={(e) => setNovaOcorrencia(e.target.value)}
                            placeholder="Descreva a nova ocorrência"
                            fullWidth
                        />
                        <Button onClick={handleAdicionarOcorrencia} variant="contained" color="primary" style={{ marginTop: 10 }}>Adicionar Ocorrência</Button>
                    </div>
                )}
    
                <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                    <Alert onClose={handleCloseSnackbar} severity="success">
                        Ocorrências registradas com sucesso!
                    </Alert>
                </Snackbar>
            </Container>
        );
    }
    
    export default Ocorrencias;