import { buildViewsAndUrls } from '../../helpers/generatorUtils.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { appName, parsedModels, viewOptions } = req.body || {};
    if (!appName || !parsedModels) return res.status(400).json({ error: 'appName et parsedModels requis' });

    try {
        const { viewsCode, urlsCode } = buildViewsAndUrls(parsedModels, appName, viewOptions);
        return res.status(200).json({ viewsCode, urlsCode });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Erreur generation views', details: e.message });
    }
}
