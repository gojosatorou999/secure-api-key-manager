# API Key Management System

A simple Node.js-based system for generating, storing, and validating API keys.

## Features
- **Key Generation**: Uses `nanoid` (cryptographically secure) for generating random, unique API keys.
- **Secure Storage**: API keys are hashed with SHA-256 before being stored in the database. Plain text keys are only shown to the user once upon creation.
- **Permissions Management**: Each key can have a custom list of permissions (e.g., `read`, `write`, `admin`).
- **Expiration Tracking**: Keys are created with an expiration date and automatically become invalid after the specified period.
- **Validation Flow**: A dedicated endpoint for verifying the authenticity and validity of a key.
- **Revocation**: Keys can be manually revoked using an administrative token.

---

## Security Considerations

1.  **Do Not Store Plain Text Keys**: Storing keys as-is is a massive security risk if the database is compromised. We hash them using SHA-256. When a user provides a key, we hash it and compare hashes.
2.  **API Key Prefixing**: The keys generated have a prefix (e.g., `sk_`) to make them easily identifiable and improve debugging.
3.  **One-Time Visibility**: Plain API keys are only returned during creation. They cannot be retrieved again; if lost, a new key must be generated.
4.  **Admin Token Protection**: Key management endpoints (generate/revoke) are protected by a simulated administrative token (`ADMIN_TOKEN`). In a production setting, this would be replaced by full auth logic.
5.  **Database Protection**: SQLite is simple but needs standard file-level protection. Use more robust systems (PostgreSQL, etc.) for high-traffic or highly sensitive applications.

---

## Technical Stack
- **Node.js** with **Express**
- **SQLite** for metadata and hash storage
- **nanoid** for key generation
- **crypto** (built-in) for SHA-256 hashing

---

## How to Test

### Setup
1. `npm install`
2. `node index.js`

### Endpoints

#### 1. Generate an API Key
**Route:** `POST /keys/generate`
**Payload:**
```json
{
  "owner": "user_id_123",
  "permissions": ["read", "write"],
  "expiresInDays": 30,
  "adminToken": "secret_admin_token"
}
```
**Response:**
```json
{
  "message": "API Key generated successfully...",
  "apiKey": "sk_abc123...",
  "owner": "user_id_123",
  "permissions": ["read", "write"],
  "expiresAt": "2026-05-01T00:00:00.000Z"
}
```

#### 2. Verify an API Key
**Route:** `POST /keys/verify`
**Payload:**
```json
{
  "apiKey": "sk_abc123..."
}
```
**Response:**
```json
{
  "valid": true,
  "owner": "user_id_123",
  "permissions": ["read", "write"],
  "expiresAt": "2026-05-01T00:00:00.000Z"
}
```

#### 3. Revoke an API Key
**Route:** `POST /keys/revoke`
**Payload:**
```json
{
  "apiKey": "sk_abc123...",
  "adminToken": "secret_admin_token"
}
```
**Response:**
```json
{
  "message": "API Key revoked successfully"
}
```
