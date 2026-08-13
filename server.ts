import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // --- HEALTH & CONFIG ENDPOINTS ---
  app.get('/001_hospital_production_schema.sql', (_req, res) => {
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', '001_hospital_production_schema.sql');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="001_hospital_production_schema.sql"');
    res.sendFile(filePath);
  });

  app.get('/api/schema/download', (_req, res) => {
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', '001_hospital_production_schema.sql');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="001_hospital_production_schema.sql"');
    res.sendFile(filePath);
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hospital_name: 'Shree Krishna Multispeciality Hospital',
      timestamp: new Date().toISOString(),
      supabase_configured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
      gemini_configured: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // --- GEMINI CLINICAL AI ASSISTANT ENDPOINT ---
  app.post('/api/gemini/clinical-assistant', async (req, res) => {
    const { prompt, image, doctorName, department } = req.body;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY not set',
          useFallback: true
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are a clinical decision support assistant for Dr. ${doctorName || 'Doctor'} at Shree Krishna Multispeciality Hospital (${department || 'General Practice'}).
Provide accurate, structured, medical recommendations regarding disease diagnosis, standard drug regimens, generic and brand names, dosages (adult and pediatric), contraindications, drug interactions, and medical image interpretation.
Formatting: Use bold headers, bullet points, and clear structured sections for readability.`;

      const contents: any[] = [];

      if (image && typeof image === 'string') {
        const matches = image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          contents.push({
            inlineData: {
              mimeType,
              data: base64Data
            }
          });
        }
      }

      contents.push(prompt || 'Analyze clinical presentation and suggest standard treatment protocol.');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });

      res.json({
        success: true,
        reply: response.text
      });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.status(500).json({ error: err?.message || 'Gemini processing failed', useFallback: true });
    }
  });

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/login', (req, res) => {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = {
      id: `usr-${Date.now()}`,
      email,
      full_name: email.split('@')[0].toUpperCase(),
      role: role || 'patient',
      phone: '+91 98765 43210',
      created_at: new Date().toISOString()
    };
    res.json({ success: true, user });
  });

  app.post('/api/auth/signup', (req, res) => {
    const { email, full_name, role, phone, gender, age, blood_group } = req.body;
    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email and full name are required' });
    }
    const user = {
      id: `usr-${Date.now()}`,
      email,
      full_name,
      role: role || 'patient',
      phone: phone || '+91 98765 43210',
      gender: gender || 'Male',
      age: age || 30,
      blood_group: blood_group || 'O+',
      created_at: new Date().toISOString()
    };
    res.json({ success: true, user });
  });

  // --- VITE MIDDLEWARE OR STATIC FALLBACK ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shree Krishna Multispeciality Hospital Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start hospital server:', err);
});
