import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY tidak ditemukan di file .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const { conversation } = req.body;
    
    if (!Array.isArray(conversation)) {
      return res.status(400).json({ error: 'Conversation harus berupa array' });
    }

    const contents = conversation.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const systemPrompt = `
Kamu adalah NEXTUS Travel Assistant, Asisten profesional yang membantu pengguna dalam hal perjalanan dan wisata.

TUGAS UTAMA:
- Merekomendasikan destinasi wisata sesuai budget & minat pengguna
- Memberikan tips packing, transportasi, dan akomodasi
- Membantu membuat itinerary perjalanan harian yang efisien
- Menyarankan kuliner khas & tempat wisata hidden gems
- Memberikan info visa, cuaca, dan budaya lokal destinasi
- Membantu estimasi budget perjalanan (transport, makan, penginapan)
- Menjawab pertanyaan seputar travel safety & etika berwisata

GAYA BICARA:
- Ceria, antusias, dan inspiratif seperti teman traveling
- Singkat, padat, dan mudah dipahami
- Menggunakan Bahasa Indonesia yang santai namun informatif
- Sertakan emoji 🗺️🎒🍜✈️ untuk membuat respons lebih hidup
- Selalu tawarkan opsi atau follow-up question agar percakapan mengalir

BATASAN:
- Jangan memberikan info yang belum terverifikasi (cek fakta dulu)
- Jika tidak yakin, akui dan sarankan pengguna cek sumber resmi
- Fokus pada rekomendasi praktis, bukan opini pribadi

Selalu akhiri respons dengan pertanyaan lanjutan atau ajakan untuk eksplor lebih jauh!
`.trim();

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        temperature: 0.9,
        topP: 0.9,
        topK: 40,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      }
    });

    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt wajib diisi' });
    
    const response = await ai.models.generateContent({ 
      model: GEMINI_MODEL, 
      contents: prompt 
    });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const parts = [{ text: prompt || 'Deskripsikan gambar ini' }];
    
    if (req.file) {
      parts.push({
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      });
    }
    
    const response = await ai.models.generateContent({ 
      model: GEMINI_MODEL, 
      contents: parts 
    });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const parts = [{ text: prompt || 'Ringkas dokumen ini' }];
    
    if (req.file) {
      parts.push({
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      });
    }
    
    const response = await ai.models.generateContent({ 
      model: GEMINI_MODEL, 
      contents: parts 
    });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const parts = [{ text: prompt || 'Transkrip audio ini' }];
    
    if (req.file) {
      parts.push({
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      });
    }
    
    const response = await ai.models.generateContent({ 
      model: GEMINI_MODEL, 
      contents: parts 
    });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ 
    status: '✅ NEXTUS Server Running', 
    model: GEMINI_MODEL,
    persona: 'Career Assistant',
    endpoints: [
      '/api/chat (POST) - Chatbot dengan konteks karir',
      '/generate-text (POST) - Generate teks',
      '/generate-from-image (POST) - Analisis gambar',
      '/generate-from-document (POST) - Analisis dokumen',
      '/generate-from-audio (POST) - Transkrip audio'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 NEXTUS Career Assistant: http://localhost:${PORT}`);
});