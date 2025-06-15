import React, { useRef, useEffect } from 'react';
import { Container, Typography, Box, IconButton, Button, useTheme } from '@mui/material';
import { WhatsApp, Instagram, Facebook, Email, Phone } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // Para permitir interação do usuário

function Home() {
    const theme = useTheme();
    const navigate = useNavigate();
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Limpa qualquer cena anterior
        while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a); // Fundo escuro para destacar os elementos da cidade

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000); // Campo de visão ajustado
        camera.position.set(0, 15, 30); // Posição da câmera para ver a cidade de cima/frente
        camera.lookAt(0, 0, 0); // Foca no centro da cena

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); // Alpha false para fundo sólido
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);

        // Controles de órbita (opcional, mas bom para demonstração)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 15;
        controls.maxDistance = 60;
        controls.autoRotate = true; // Rotação automática suave
        controls.autoRotateSpeed = 0.5;

        // Luzes
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Mais luz ambiente
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);

        // Chão da cidade
        const planeGeometry = new THREE.PlaneGeometry(50, 50);
        const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2; // Gira para ficar horizontal
        scene.add(plane);

        // Criar edifícios abstratos
        const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, flatShading: true }); // Material para edifícios
        const buildingOutlineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff }); // Azul ciano para contornos/linhas

        const numBuildings = 50; // Quantidade de edifícios
        const buildingGroup = new THREE.Group(); // Grupo para organizar os edifícios

        for (let i = 0; i < numBuildings; i++) {
            const buildingHeight = Math.random() * 15 + 5; // Altura aleatória
            const buildingWidth = Math.random() * 3 + 1; // Largura aleatória
            const buildingDepth = Math.random() * 3 + 1; // Profundidade aleatória

            const geometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
            const building = new THREE.Mesh(geometry, buildingMaterial);

            // Posiciona o edifício aleatoriamente no plano
            building.position.x = (Math.random() - 0.5) * 40;
            building.position.z = (Math.random() - 0.5) * 40;
            building.position.y = buildingHeight / 2; // Coloca na altura correta sobre o chão

            buildingGroup.add(building);

            // Adicionar linhas de contorno (wireframe) ou grades ao edifício
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, buildingOutlineMaterial);
            line.position.copy(building.position); // Copia a posição do edifício
            buildingGroup.add(line);
        }
        scene.add(buildingGroup);

        // Efeito de "grade" ou "rede" no chão
        const gridHelper = new THREE.GridHelper(50, 20, 0x00aaaa, 0x00aaaa); // Tamanho, divisões, cor da grade
        gridHelper.position.y = 0.01; // Levemente acima do chão para evitar z-fighting
        scene.add(gridHelper);

        // Pontos de luz piscantes (simulando "infraestrutura ativa")
        const flashingLights = [];
        const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Magenta brilhante
        for (let i = 0; i < 10; i++) {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), lightMaterial);
            sphere.position.set(
                (Math.random() - 0.5) * 45,
                Math.random() * 3 + 1, // Altura acima do chão
                (Math.random() - 0.5) * 45
            );
            flashingLights.push(sphere);
            scene.add(sphere);
        }


        // Animação principal
        const animate = () => {
            if (!mountRef.current || !mountRef.current.contains(renderer.domElement)) {
                return;
            }
            requestAnimationFrame(animate);

            controls.update(); // Atualiza os controles e a rotação automática

            // Animar luzes piscantes
            flashingLights.forEach((light, index) => {
                light.material.opacity = Math.sin(Date.now() * 0.005 + index) * 0.5 + 0.5; // Efeito de piscar suave
            });

            renderer.render(scene, camera);
        };

        animate();

        // Lidar com o redimensionamento
        const handleResize = () => {
            if (mountRef.current) {
                const newWidth = mountRef.current.clientWidth;
                const newHeight = mountRef.current.clientHeight;
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            }
        };

        window.addEventListener('resize', handleResize);

        // Limpeza
        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            controls.dispose(); // Importante para liberar os controles
        };
    }, []); // Array de dependências vazio para rodar apenas uma vez na montagem

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
                overflow: 'hidden',
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
            {/* Contêiner para a cena Three.js */}
            <Box
                ref={mountRef}
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1,
                    // pointerEvents: 'none', // Comente ou remova esta linha se quiser interação com o mouse
                }}
            />

            <Container
                maxWidth="md"
                sx={{
                    position: 'relative',
                    zIndex: 2,
                    py: 8,
                    backdropFilter: 'blur(3px) brightness(0.6)',
                    borderRadius: 2,
                    p: 4
                }}
            >
                <Typography
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{
                        fontWeight: 'bold',
                        textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)',
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
                        textShadow: '1px 1px 4px rgba(0, 0, 0, 0.7)'
                    }}
                >
                    Transformando regiões, melhorando vidas
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
                    <Box sx={{ my: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Typography variant="h6" component="p" sx={{ fontWeight: 'bold' }}>
                            Por que usar o SMU?
                        </Typography>
                        <Box display="flex" justifyContent="center" flexWrap="wrap" gap={3}>
                            <Box sx={{ textAlign: 'center', maxWidth: '180px' }}>
                                <i className="material-icons" style={{ fontSize: '48px', color: theme.palette.primary.main }}></i>
                                <Typography variant="subtitle1" sx={{ mt: 1 }}>Soluções Rápidas</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Agilidade na resolução de problemas urbanos.</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', maxWidth: '180px' }}>
                                <i className="material-icons" style={{ fontSize: '48px', color: theme.palette.primary.main }}></i>
                                <Typography variant="subtitle1" sx={{ mt: 1 }}>Sua Voz Importa</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Contribua diretamente para a melhoria da sua região.</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', maxWidth: '180px' }}>
                                <i className="material-icons" style={{ fontSize: '48px', color: theme.palette.primary.main }}></i>
                                <Typography variant="subtitle1" sx={{ mt: 1 }}>Acompanhamento Completo</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Monitore o status das suas ocorrências em tempo real.</Typography>
                            </Box>
                        </Box>
                    </Box>
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