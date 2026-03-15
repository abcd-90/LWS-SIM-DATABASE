import { kv } from '@vercel/kv';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const CONFIG_KEY = 'lws_sim_db_app_config';

  if (req.method === 'GET') {
    try {
      const config = await kv.get(CONFIG_KEY);
      return res.status(200).json(config || {});
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch config' });
    }
  }

  if (req.method === 'POST') {
    try {
      const newConfig = req.body;
      await kv.set(CONFIG_KEY, newConfig);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save config' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
