const express = require('express');
const { setupDatabase } = require('./database');
const ApiKeyManager = require('./apiKeyManager');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let db;
let apiKeyManager;

// Admin token for managing keys (simulated)
const ADMIN_TOKEN = 'secret_admin_token';

// Setup DB and start server
setupDatabase().then((database) => {
    db = database;
    apiKeyManager = new ApiKeyManager(db);
    console.log('Database connected.');

    app.listen(port, () => {
        console.log(`API Key Management System running at http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Create a new API key
app.post('/keys/generate', async (req, res) => {
    const { owner, permissions, expiresInDays, adminToken } = req.body;

    if (adminToken !== ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Unauthorized: Admin token required' });
    }

    if (!owner || !permissions) {
        return res.status(400).json({ error: 'Missing owner or permissions' });
    }

    try {
        const result = await apiKeyManager.createKey(owner, permissions, expiresInDays);
        res.status(201).json({
            message: 'API Key generated successfully. Save this key somewhere safe; it will not be shown again.',
            apiKey: result.plainKey,
            owner: result.owner,
            permissions: result.permissions,
            expiresAt: result.expiresAt
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error while generating key' });
    }
});

// Verify an API key
app.post('/keys/verify', async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'Missing API Key' });
    }

    try {
        const result = await apiKeyManager.validateKey(apiKey);
        if (result.valid) {
            res.status(200).json({
                valid: true,
                owner: result.owner,
                permissions: result.permissions,
                expiresAt: result.expiresAt
            });
        } else {
            res.status(401).json({ valid: false, error: result.error });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error while verifying key' });
    }
});

// Revoke an API key
app.post('/keys/revoke', async (req, res) => {
    const { apiKey, adminToken } = req.body;

    if (adminToken !== ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Unauthorized: Admin token required' });
    }

    if (!apiKey) {
        return res.status(400).json({ error: 'Missing API Key' });
    }

    try {
        const success = await apiKeyManager.revokeKey(apiKey);
        if (success) {
            res.status(200).json({ message: 'API Key revoked successfully' });
        } else {
            res.status(404).json({ error: 'API Key not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error while revoking key' });
    }
});
