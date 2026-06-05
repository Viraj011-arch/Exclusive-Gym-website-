const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html as fallback for route queries if requested, but static takes care of it
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * API: POST /api/applications
 * Create a new membership application
 */
app.post('/api/applications', (req, res) => {
    const { name, email, residence, level, wellness_objective, interests, referral_source } = req.body;

    if (!name || !email || !residence || !level) {
        return res.status(400).json({ error: 'Name, email, primary residence, and fitness goal are required.' });
    }

    const interestsStr = Array.isArray(interests) ? interests.join(', ') : (interests || '');

    const query = `
        INSERT INTO applications (name, email, residence, level, wellness_objective, interests, referral_source, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `;

    db.run(query, [name, email, residence, level, wellness_objective, interestsStr, referral_source], function(err) {
        if (err) {
            console.error('Database insertion error (applications):', err.message);
            return res.status(500).json({ error: 'Failed to save application.' });
        }
        res.status(201).json({ 
            message: 'Application submitted successfully.', 
            id: this.lastID 
        });
    });
});

/**
 * API: POST /api/subscriptions
 * Register a membership plan subscription
 */
app.post('/api/subscriptions', (req, res) => {
    const { name, email, phone, plan_name, cost } = req.body;

    if (!name || !email || !phone || !plan_name || cost === undefined) {
        return res.status(400).json({ error: 'Name, email, phone, plan name, and cost are required.' });
    }

    const query = `
        INSERT INTO subscriptions (name, email, phone, plan_name, cost, status)
        VALUES (?, ?, ?, ?, ?, 'Active')
    `;

    db.run(query, [name, email, phone, plan_name, cost], function(err) {
        if (err) {
            console.error('Database insertion error (subscriptions):', err.message);
            return res.status(500).json({ error: 'Failed to save subscription.' });
        }
        res.status(201).json({ 
            message: 'Subscription registered successfully.', 
            id: this.lastID 
        });
    });
});

/**
 * API: POST /api/consultations
 * Book a tour or service consultation
 */
app.post('/api/consultations', (req, res) => {
    const { name, email, phone, type } = req.body;

    if (!name || !email || !phone || !type) {
        return res.status(400).json({ error: 'Name, email, phone, and type of booking are required.' });
    }

    const query = `
        INSERT INTO consultations (name, email, phone, type)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(`
        INSERT INTO consultations (name, email, phone, type)
        VALUES (?, ?, ?, ?)
    `, [name, email, phone, type], function(err) {
        if (err) {
            console.error('Database insertion error (consultations):', err.message);
            return res.status(500).json({ error: 'Failed to save booking.' });
        }
        res.status(201).json({ 
            message: 'Consultation booking saved successfully.', 
            id: this.lastID 
        });
    });
});

/**
 * API: GET /api/admin/summary
 * Retrieve aggregated statistics and lists for the dashboard
 */
app.get('/api/admin/summary', (req, res) => {
    // We run multiple queries to construct dashboard data
    const summary = {
        stats: {
            totalApplications: 0,
            pendingApplications: 0,
            activeSubscriptions: 0,
            totalRevenue: 0,
            totalConsultations: 0
        },
        applications: [],
        subscriptions: [],
        consultations: []
    };

    // Helper functions wrapped in promises
    const getApps = new Promise((resolve) => {
        db.all('SELECT * FROM applications ORDER BY created_at DESC', [], (err, rows) => {
            if (!err && rows) {
                summary.applications = rows;
                summary.stats.totalApplications = rows.length;
                summary.stats.pendingApplications = rows.filter(r => r.status === 'Pending').length;
            }
            resolve();
        });
    });

    const getSubs = new Promise((resolve) => {
        db.all('SELECT * FROM subscriptions ORDER BY created_at DESC', [], (err, rows) => {
            if (!err && rows) {
                summary.subscriptions = rows;
                summary.stats.activeSubscriptions = rows.filter(r => r.status === 'Active').length;
                summary.stats.totalRevenue = rows.reduce((sum, r) => sum + r.cost, 0);
            }
            resolve();
        });
    });

    const getConsults = new Promise((resolve) => {
        db.all('SELECT * FROM consultations ORDER BY created_at DESC', [], (err, rows) => {
            if (!err && rows) {
                summary.consultations = rows;
                summary.stats.totalConsultations = rows.length;
            }
            resolve();
        });
    });

    Promise.all([getApps, getSubs, getConsults]).then(() => {
        res.json(summary);
    }).catch(err => {
        console.error('Error fetching dashboard summary:', err);
        res.status(500).json({ error: 'Internal server error.' });
    });
});

/**
 * API: PATCH /api/applications/:id
 * Update status of an application (Approve/Reject)
 */
app.patch('/api/applications/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (Pending, Approved, Rejected) is required.' });
    }

    db.run('UPDATE applications SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
            console.error('Error updating application status:', err.message);
            return res.status(500).json({ error: 'Failed to update application status.' });
        }
        res.json({ message: 'Application status updated successfully.' });
    });
});

/**
 * API: DELETE /api/applications/:id
 */
app.delete('/api/applications/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM applications WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: 'Delete failed' });
        res.json({ message: 'Application deleted.' });
    });
});

/**
 * API: DELETE /api/subscriptions/:id
 */
app.delete('/api/subscriptions/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM subscriptions WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: 'Delete failed' });
        res.json({ message: 'Subscription deleted.' });
    });
});

/**
 * API: DELETE /api/consultations/:id
 */
app.delete('/api/consultations/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM consultations WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: 'Delete failed' });
        res.json({ message: 'Booking deleted.' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Muscle House Server listening on http://localhost:${PORT}`);
});
