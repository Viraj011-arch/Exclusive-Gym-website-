// api/subscriptions/index.js
const db = require('../../db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, plan_name, cost } = req.body;

  if (!name || !email || !phone || !plan_name || cost === undefined) {
    return res.status(400).json({ error: 'Name, email, phone, plan name, and cost are required.' });
  }

  const query = `
    INSERT INTO subscriptions (
      name,
      email,
      phone,
      plan_name,
      cost,
      status
    ) VALUES (?,?,?,?,?, 'Active')
  `;

  return new Promise((resolve) => {
    db.run(query, [name, email, phone, plan_name, cost], function (err) {
      if (err) {
        console.error('DB insert error (subscriptions):', err.message);
        res.status(500).json({ error: 'Failed to save subscription' });
      } else {
        res.status(201).json({ message: 'Subscription registered', id: this.lastID });
      }
      resolve();
    });
  });
};
