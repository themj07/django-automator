import { askOpenAIForModels, buildModelsCode } from '../../components/helpers/generatorUtils';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { appName, prompt } = req.body || {};
    if (!appName || !prompt) return res.status(400).json({ error: 'appName et prompt requis' });

    try {
        const parsed = await askOpenAIForModels(prompt);
        const modelsCode = buildModelsCode(parsed.models);
        return res.status(200).json({ parsedModels: parsed.models, modelsCode });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Erreur generation modèles', details: e.message });
    }
}
