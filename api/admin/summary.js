// api/admin/summary.js
const db = require('../../db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const summary = {
    stats: {
      totalApplications: 0,
      pendingApplications: 0,
      activeSubscriptions: 0,
      totalRevenue: 0,
      totalConsultations: 0,
    },
    applications: [],
    subscriptions: [],
    consultations: [],
  };

  const apps = new Promise((resolve) => {
    db.all('SELECT * FROM applications ORDER BY created_at DESC', [], (err, rows) => {
      if (!err && rows) {
        summary.applications = rows;
        summary.stats.totalApplications = rows.length;
        summary.stats.pendingApplications = rows.filter(r => r.status === 'Pending').length;
      }
      resolve();
    });
  });

  const subs = new Promise((resolve) => {
    db.all('SELECT * FROM subscriptions ORDER BY created_at DESC', [], (err, rows) => {
      if (!err && rows) {
        summary.subscriptions = rows;
        summary.stats.activeSubscriptions = rows.filter(r => r.status === 'Active').length;
        summary.stats.totalRevenue = rows.reduce((sum, r) => sum + r.cost, 0);
      }
      resolve();
    });
  });

  const cons = new Promise((resolve) => {
    db.all('SELECT * FROM consultations ORDER BY created_at DESC', [], (err, rows) => {
      if (!err && rows) {
        summary.consultations = rows;
        summary.stats.totalConsultations = rows.length;
      }
      resolve();
    });
  });

  Promise.all([apps, subs, cons])
    .then(() => res.json(summary))
    .catch((e) => {
      console.error('Error building summary:', e);
      res.status(500).json({ error: 'Internal server error' });
    });
};
