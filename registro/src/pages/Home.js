import React from 'react';
import { Container, Typography, Box, IconButton, Button, useTheme } from '@mui/material';
import { WhatsApp, Instagram, Facebook, Email, Phone } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';





function Home() {
    const theme = useTheme();
    const navigate = useNavigate();
    
    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundImage: `url(${process.env.PUBLIC_URL}/img/a.webp)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: theme.palette.common.white,
                textAlign: 'center',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 0,
                }
            }}
        >
            <Container 
                maxWidth="md" 
                sx={{ 
                    position: 'relative', 
                    zIndex: 1,
                    py: 8,
                    backdropFilter: 'blur(2px)',
                    borderRadius: 2
                }}
            >
                <Typography 
                    variant="h2" 
                    component="h1" 
                    gutterBottom 
                    sx={{
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                        mb: 4
                    }}
                >
                    SMU - Sistema de Melhoria Urbana
                </Typography>
                
                <Typography 
                    variant="h5" 
                    component="p" 
                    sx={{
                        mb: 6,
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    Transformando cidades, melhorando vidas
                </Typography>

                {/* Botões de Login e Cadastro */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 6 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        onClick={() => navigate('/login')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontWeight: 'bold',
                            boxShadow: 3,
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 6
                            }
                        }}
                    >
                        Login
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        size="large"
                        onClick={() => navigate('/cadastrarUsuario')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontWeight: 'bold',
                            borderWidth: 2,
                            '&:hover': {
                                borderWidth: 2,
                                transform: 'translateY(-2px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        Cadastre-se
                    </Button>
                </Box>

                <Box 
                    sx={{ 
                        mt: 6,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        py: 3,
                        px: 4,
                        borderRadius: 2
                    }}
                >
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                        Siga-nos ou entre em contato:
                    </Typography>
                    
                    <Box 
                        display="flex" 
                        justifyContent="center"
                        flexWrap="wrap"
                        gap={2}
                    >
                        <IconButton 
                            aria-label="WhatsApp" 
                            href="https://wa.me/5541987762657" 
                            target="_blank"
                            sx={{ 
                                backgroundColor: 'rgba(37, 211, 102, 0.2)',
                                '&:hover': { backgroundColor: 'rgba(37, 211, 102, 0.4)' }
                            }}
                        >
                            <WhatsApp fontSize="large" sx={{ color: '#25D366' }} />
                        </IconButton>
                        
                        <IconButton 
                            aria-label="Instagram" 
                            href="https://instagram.com" 
                            target="_blank"
                            sx={{ 
                                backgroundColor: 'rgba(225, 48, 108, 0.2)',
                                '&:hover': { backgroundColor: 'rgba(225, 48, 108, 0.4)' }
                            }}
                        >
                            <Instagram fontSize="large" sx={{ color: '#E1306C' }} />
                        </IconButton>
                        
                        <IconButton 
                            aria-label="Facebook" 
                            href="https://facebook.com" 
                            target="_blank"
                            sx={{ 
                                backgroundColor: 'rgba(24, 119, 242, 0.2)',
                                '&:hover': { backgroundColor: 'rgba(24, 119, 242, 0.4)' }
                            }}
                        >
                            <Facebook fontSize="large" sx={{ color: '#1877F2' }} />
                        </IconButton>
                        
                        <IconButton 
                            aria-label="Email" 
                            href="mailto:contato@smu.com.br"
                            sx={{ 
                                backgroundColor: 'rgba(219, 68, 55, 0.2)',
                                '&:hover': { backgroundColor: 'rgba(219, 68, 55, 0.4)' }
                            }}
                        >
                            <Email fontSize="large" sx={{ color: '#DB4437' }} />
                        </IconButton>
                        
                        <IconButton 
                            aria-label="Telefone" 
                            href="tel:+5541987762657"
                            sx={{ 
                                backgroundColor: 'rgba(0, 150, 136, 0.2)',
                                '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.4)' }
                            }}
                        >
                            <Phone fontSize="large" sx={{ color: '#009688' }} />
                        </IconButton>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

export default Home;