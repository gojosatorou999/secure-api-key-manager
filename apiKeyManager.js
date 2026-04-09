const crypto = require('crypto');
const { nanoid } = require('nanoid');

class ApiKeyManager {
    constructor(db) {
        this.db = db;
    }

    // Generate a secure random key
    generateKey(prefix = 'sk_') {
        return `${prefix}${nanoid(32)}`;
    }

    // Hash the key for storage
    hashKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    /**
     * Create a new API key record
     * @param {string} owner - owner of the key
     * @param {string[]} permissions - list of permissions
     * @param {number} expiresInDays - number of days until expiration
     */
    async createKey(owner, permissions, expiresInDays = 30) {
        const plainKey = this.generateKey();
        const keyHash = this.hashKey(plainKey);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        await this.db.run(
            'INSERT INTO api_keys (key_hash, owner, permissions, expires_at) VALUES (?, ?, ?, ?)',
            [keyHash, owner, JSON.stringify(permissions), expiresAt.toISOString()]
        );

        return {
            owner,
            plainKey, // Return to user only once
            permissions,
            expiresAt,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Validate an API key
     * @param {string} plainKey - the plain text key provided by the user
     */
    async validateKey(plainKey) {
        const keyHash = this.hashKey(plainKey);
        const record = await this.db.get('SELECT * FROM api_keys WHERE key_hash = ?', [keyHash]);

        if (!record) {
            return { valid: false, error: 'Invalid API key' };
        }

        const now = new Date();
        const expiresAt = new Date(record.expires_at);

        if (now > expiresAt) {
            return { valid: false, error: 'API key has expired' };
        }

        return {
            valid: true,
            owner: record.owner,
            permissions: JSON.parse(record.permissions),
            expiresAt: record.expires_at,
            createdAt: record.created_at
        };
    }

    async revokeKey(plainKey) {
        const keyHash = this.hashKey(plainKey);
        const result = await this.db.run('DELETE FROM api_keys WHERE key_hash = ?', [keyHash]);
        return result.changes > 0;
    }
}

module.exports = ApiKeyManager;
