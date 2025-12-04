import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// 1. Setup path for importing API handlers (adjust this if your directory structure changes)
const __dirname = dirname(fileURLToPath(import.meta.url));
const apiPath = join(__dirname, 'src', 'pages', 'api');

// 2. Import your existing API handlers
import modelsHandler from './src/pages/api/models.js';
import viewsHandler from './src/pages/api/views.js';

const app = express();
const PORT = 5000;

// Middlewares
// Enable CORS for development, allowing your frontend (e.g., localhost:5173) to connect
app.use(cors({
    origin: '*', // For development, you can use '*' or specify your frontend URL
}));
app.use(express.json()); // Parses incoming JSON requests

// --- API Routes ---

/**
 * Route to generate Django models from a prompt (calls logic in models.js)
 * Endpoint: POST /api/models
 */
app.post('/api/models', (req, res) => {
    // Execute the imported handler function
    return modelsHandler(req, res);
});

/**
 * Route to generate Django views and URLs (calls logic in views.js)
 * Endpoint: POST /api/views
 */
app.post('/api/views', (req, res) => {
    // Execute the imported handler function
    return viewsHandler(req, res);
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Backend API running at http://localhost:${PORT}`);
});