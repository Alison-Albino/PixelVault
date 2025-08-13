// API Client for PixelVault
class PixelVaultAPI {
    constructor() {
        this.baseURL = '';
    }

    // Helper method for making API requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include', // Include cookies for session
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(username, email, password, masterPassword) {
        return this.request('/auth/register', {
            method: 'POST',
            body: { username, email, password, masterPassword }
        });
    }

    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { username, password }
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    async verifyMasterPassword(masterPassword) {
        return this.request('/auth/verify-master', {
            method: 'POST',
            body: { masterPassword }
        });
    }

    async checkSession() {
        return this.request('/auth/session');
    }

    // User management endpoints
    async getUserProfile() {
        return this.request('/users/profile');
    }

    async updateProfile(username, email) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: { username, email }
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/users/change-password', {
            method: 'PUT',
            body: { currentPassword, newPassword }
        });
    }

    async changeMasterPassword(currentMasterPassword, newMasterPassword) {
        return this.request('/users/change-master-password', {
            method: 'PUT',
            body: { currentMasterPassword, newMasterPassword }
        });
    }

    async deleteAccount(password) {
        return this.request('/users/account', {
            method: 'DELETE',
            body: { password }
        });
    }

    // Vault entries endpoints
    async getEntries() {
        return this.request('/entries');
    }

    async getEntry(id) {
        return this.request(`/entries/${id}`);
    }

    async createEntry(type, encryptedData) {
        return this.request('/entries', {
            method: 'POST',
            body: { type, encryptedData }
        });
    }

    async updateEntry(id, encryptedData) {
        return this.request(`/entries/${id}`, {
            method: 'PUT',
            body: { encryptedData }
        });
    }

    async deleteEntry(id) {
        return this.request(`/entries/${id}`, {
            method: 'DELETE'
        });
    }

    async deleteAllEntries() {
        return this.request('/entries', {
            method: 'DELETE'
        });
    }

    async getStats() {
        return this.request('/entries/stats/summary');
    }
}