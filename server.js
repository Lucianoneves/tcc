const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 5001;

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage }).array("image", 10); // Múltiplos arquivos permitidos

// Rota para upload de múltiplas imagens
app.post("/upload", upload, (req, res) => {
  if (!req.files) {
    return res.status(400).json({ error: "Nenhuma imagem enviada" });
  }

  const imageUrls = req.files.map((file) => `http://localhost:${PORT}/uploads/${file.filename}`);
  res.json({ imageUrls });
});

// Servir arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

