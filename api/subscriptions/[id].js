// api/subscriptions/[id].js
const db = require('../../db');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = 'DELETE FROM subscriptions WHERE id = ?';
  return new Promise((resolve) => {
    db.run(query, [id], function (err) {
      if (err) {
        console.error('Delete error (subscriptions):', err.message);
        res.status(500).json({ error: 'Delete failed' });
      } else {
        res.json({ message: 'Subscription deleted' });
      }
      resolve();
    });
  });
};
