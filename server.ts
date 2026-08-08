import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- HEALTH & CONFIG ENDPOINTS ---
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hospital_name: 'Shree Krishna Multispecialty Hospital',
      timestamp: new Date().toISOString(),
      supabase_configured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)
    });
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
    console.log(`Shree Krishna Multispecialty Hospital Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start hospital server:', err);
});
