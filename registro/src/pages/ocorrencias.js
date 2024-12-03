import React, { useState } from 'react';
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

function Ocorrencias() {
    const [isAdmin, setIsAdmin] = useState(true); // Controla se o usuário é admin
    const [ocorrencias, setOcorrencias] = useState([
        { id: 1, descricao: 'Buraco na rua', status: 'Em análise' },
        { id: 2, descricao: 'Lâmpada queimada', status: 'Pendente' },
        { id: 3, descricao: 'Alagamento', status: 'Concluído' },
        { id: 4, descricao: 'Descarte irregular de lixo', status: 'Em análise' },
        { id: 5, descricao: 'Vazamento de água', status: 'Pendente' },
    ]);

    const [selecionadas, setSelecionadas] = useState([]);
    const [novaOcorrencia, setNovaOcorrencia] = useState('');
    const [historico, setHistorico] = useState([]);
    const [editandoOcorrencia, setEditandoOcorrencia] = useState(null);
    const [descricaoEditada, setDescricaoEditada] = useState('');
    const [statusEditado, setStatusEditado] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // Alternar seleção de ocorrências
    const handleCheckboxChange = (id) => {
        if (selecionadas.includes(id)) {
            setSelecionadas(selecionadas.filter(item => item !== id));
        } else {
            setSelecionadas([...selecionadas, id]);
        }
    };

    // Adicionar nova ocorrência
    const handleAdicionarOcorrencia = () => {
        if (novaOcorrencia.trim() === '') return;
        const nova = {
            id: ocorrencias.length + 1,
            descricao: novaOcorrencia,
            status: 'Em análise', // Status padrão
        };
        setOcorrencias([...ocorrencias, nova]);
        setNovaOcorrencia('');
        setHistorico([...historico, nova]);
    };

    // Registrar ocorrências selecionadas
    const handleSubmit = () => {
        const ocorrenciasSelecionadas = ocorrencias.filter(ocorrencia => selecionadas.includes(ocorrencia.id));
        setHistorico([...historico, ...ocorrenciasSelecionadas]);
        setSelecionadas([]);
        setSnackbarOpen(true); // Abre Snackbar
    };

    // Editar ocorrência
    const handleEditarOcorrencia = (id) => {
        if (!isAdmin) return;
        const ocorrencia = ocorrencias.find(item => item.id === id);
        setEditandoOcorrencia(id);
        setDescricaoEditada(ocorrencia.descricao);
        setStatusEditado(ocorrencia.status);
    };

    // Salvar alterações na ocorrência
    const handleSalvarEdicao = (id) => {
        setOcorrencias(
            ocorrencias.map(ocorrencia =>
                ocorrencia.id === id
                    ? { ...ocorrencia, descricao: descricaoEditada, status: statusEditado }
                    : ocorrencia
            )
        );
        setEditandoOcorrencia(null);
    };

    // Remover ocorrência
    const handleRemoverOcorrencia = (id) => {
        if (!isAdmin) return;
        setOcorrencias(ocorrencias.filter(ocorrencia => ocorrencia.id !== id));
        setHistorico(historico.filter(ocorrencia => ocorrencia.id !== id));
    };

    // Fechar Snackbar
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Ocorrências Registrada</Typography>
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
                                {isAdmin && <Button onClick={() => handleEditarOcorrencia(ocorrencia.id)} variant="outlined" color="primary" style={{ marginLeft: 8 }}>Editar</Button>}
                                {isAdmin && <Button onClick={() => handleRemoverOcorrencia(ocorrencia.id)} variant="outlined" color="secondary" style={{ marginLeft: 8 }}>Remover</Button>}
                            </ListItemText>
                        )}
                    </ListItem>
                ))}
            </List>
            
            <Button onClick={handleSubmit} variant="contained" color="primary">Enviar Ocorrências para Orgão Público</Button>

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
