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

// 🔹 Endpoint Chatbot (Sesi 3)
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
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        systemInstruction: {
          parts: [{ text: 'Kamu adalah asisten AI yang ramah, membantu, dan menjawab dalam Bahasa Indonesia. Jawablah dengan singkat namun informatif.' }]
        }
      }
    });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Endpoint 1: Teks
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt wajib diisi' });
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Endpoint 2: Gambar ✅ FIX: data: ADA
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const parts = [{ text: prompt || 'Deskripsikan gambar ini' }];
    if (req.file) {
      parts.push({
        inlineData: {
          data: req.file.buffer.toString('base64'),  // ← ✅ KEY "data:" WAJIB
          mimeType: req.file.mimetype
        }
      });
    }
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: parts });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Endpoint 3: Dokumen ✅ FIX: data: ADA
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const parts = [{ text: prompt || 'Ringkas dokumen ini' }];
    if (req.file) {
      parts.push({
        inlineData: {
          data: req.file.buffer.toString('base64'),  // ← ✅ KEY "data:" WAJIB
          mimeType: req.file.mimetype
        }
      });
    }
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: parts });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Endpoint 4: Audio ✅ FIX: data: ADA
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const parts = [{ text: prompt || 'Transkrip audio ini' }];
    if (req.file) {
      parts.push({
        inlineData: {
          data: req.file.buffer.toString('base64'),  // ← ✅ KEY "data:" WAJIB
          mimeType: req.file.mimetype
        }
      });
    }
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: parts });
    res.json({ result: response.text });
  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Health Check
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Server Running', 
    model: GEMINI_MODEL,
    endpoints: ['/api/chat', '/generate-text', '/generate-from-image', '/generate-from-document', '/generate-from-audio']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server aktif: http://localhost:${PORT}`);
});