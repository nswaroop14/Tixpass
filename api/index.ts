import { app, initialize } from '../server/index.js';

export default async function handler(req: any, res: any) {
  try {
    // Wait for route registration and basic setup
    await initialize();
    
    // Express app is just a function (req, res) => void
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Function Error:", err);
    res.status(500).json({ 
      error: "SERVER_ERROR", 
      message: err.message || "Failed to initialize server" 
    });
  }
}
