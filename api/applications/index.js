const db = require('../../db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { name, email, residence, level, wellness_objective, interests, referral_source } = req.body;
  if (!name || !email || !residence || !level) {
    return res.status(400).json({ error: 'Name, email, residence and level are required.' });
  }
  const interestsStr = Array.isArray(interests) ? interests.join(', ') : (interests || '');
  const query = `INSERT INTO applications (name, email, residence, level, wellness_objective, interests, referral_source, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`;
  db.run(query, [name, email, residence, level, wellness_objective, interestsStr, referral_source], function (err) {
    if (err) {
      console.error('DB insert error (applications):', err.message);
      return res.status(500).json({ error: 'Failed to save application.' });
    }
    return res.status(201).json({ message: 'Application submitted.', id: this.lastID });
  });
};
