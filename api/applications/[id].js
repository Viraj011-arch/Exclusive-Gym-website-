// api/applications/[id].js
const db = require('../../db');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  if (req.method === 'PATCH') {
    const { status } = req.body;
    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required' });
    }
    const query = 'UPDATE applications SET status = ? WHERE id = ?';
    return new Promise((resolve) => {
      db.run(query, [status, id], function (err) {
        if (err) {
          console.error('Update error (applications):', err.message);
          res.status(500).json({ error: 'Failed to update' });
        } else {
          res.json({ message: 'Application status updated' });
        }
        resolve();
      });
    });
  }

  if (req.method === 'DELETE') {
    const query = 'DELETE FROM applications WHERE id = ?';
    return new Promise((resolve) => {
      db.run(query, [id], function (err) {
        if (err) {
          console.error('Delete error (applications):', err.message);
          res.status(500).json({ error: 'Delete failed' });
        } else {
          res.json({ message: 'Application deleted' });
        }
        resolve();
      });
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
