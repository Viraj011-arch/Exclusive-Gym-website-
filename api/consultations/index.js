const db = require('../../db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, type } = req.body;

  if (!name || !email || !phone || !type) {
    return res.status(400).json({ error: 'Name, email, phone, and type are required' });
  }

  const query = `
    INSERT INTO consultations (
      name,
      email,
      phone,
      type
    ) VALUES (?,?,?,?)
  `;

  return new Promise((resolve) => {
    db.run(query, [name, email, phone, type], function (err) {
      if (err) {
        console.error('DB insert error (consultations):', err.message);
        res.status(500).json({ error: 'Failed to save consultation' });
      } else {
        res.status(201).json({ message: 'Consultation booked', id: this.lastID });
      }
      resolve();
    });
  });
};
