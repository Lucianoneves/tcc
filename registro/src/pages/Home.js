import React from 'react';
import { Container, Typography, Box, IconButton } from '@mui/material';
import { WhatsApp, Instagram, Facebook, Email, Phone } from '@mui/icons-material';
import '../styles/Home.css';

function Home() {
    return (
        <Box
            sx={{
                height: '100vh', // altura total da tela
                backgroundImage: `url(${process.env.PUBLIC_URL}/img/a.webp)`, // Referência à imagem local
                backgroundSize: 'cover', // Faz a imagem cobrir todo o fundo
                backgroundPosition: 'center', // Centraliza a imagem
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fff', // Cor branca para o texto
                textAlign: 'center',
            }}
        >
            <Container maxWidth="sm" className="home-container" style={{ textAlign: 'center', marginTop: '50px' }}>
                <Typography variant="h3" component="h1" gutterBottom className="home-title">
                   SMU 
                   Sistema Melhoria Urbana
                </Typography>
                <Typography variant="body1" className="home-description" gutterBottom>
                    
                </Typography>

                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>Siga-nos ou entre em contato:</Typography>
                    <Box display="flex" justifyContent="center">
                        <IconButton aria-label="WhatsApp" href="https://wa.me/seuNumero" target="_blank" color="primary">
                            <WhatsApp fontSize="large" sx={{ color: '#25D366' }} />
                        </IconButton>
                        <IconButton aria-label="Instagram" href="https://instagram.com/seuPerfil" target="_blank" color="secondary">
                            <Instagram fontSize="large" />
                        </IconButton>
                        <IconButton aria-label="Facebook" href="https://facebook.com/seuPerfil" target="_blank" color="primary">
                            <Facebook fontSize="large" />
                        </IconButton>
                        <IconButton aria-label="Email" href="mailto:seuEmail@example.com" color="error">
                            <Email fontSize="large" />
                        </IconButton>
                        <IconButton aria-label="Telefone" href="tel:+5541987762657" color="success">
                            <Phone fontSize="large" sx={{ color: '#25D366' }} />
                        </IconButton>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

export default Home;
