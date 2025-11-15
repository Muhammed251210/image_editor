require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const upload = multer();
const app = express();
const PORT = 3000;

// Resim düzenleme endpoint'i: /api/image-edit
app.post('/api/image-edit', upload.fields([{ name: 'image' }, { name: 'mask' }]), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const n = req.body.n || 1;
    const size = req.body.size || "512x512";
    const apiUrl = "https://api.openai.com/v1/images/edits";

    // FormData nesnesi oluştur
    const formData = new FormData();
    formData.append('image', req.files['image'][0].buffer, 'image.png');
    formData.append('mask', req.files['mask'][0].buffer, 'mask.png');
    formData.append('prompt', prompt);
    formData.append('n', n);
    formData.append('size', size);

    // OpenAI API isteğini yap
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      }
    });

    res.json(response.data); // Sonucu frontend'e döndür
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Backend OpenAI proxy listening: http://localhost:${PORT}/api/image-edit`);
});
