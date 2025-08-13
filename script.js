// PixelVault - Retro Password Manager
// Client-side encrypted password, note, and file manager

class PixelVault {
    constructor() {
        this.masterPassword = null;
        this.entries = [];
        this.currentEditingId = null;
        this.initializeApp();
    }

    // Initialize the application
    initializeApp() {
        this.setupEventListeners();
        this.checkFirstTimeUser();
    }

    // Check if this is a first-time user
    checkFirstTimeUser() {
        const hashedPassword = localStorage.getItem('vault_master');
        if (!hashedPassword) {
            // First time user - show setup option
            document.getElementById('show-setup').style.display = 'block';
        } else {
            // Existing user - hide setup option
            document.getElementById('show-setup').style.display = 'none';
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Setup form
        document.getElementById('setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSetup();
        });

        // Show/hide setup form
        document.getElementById('show-setup').addEventListener('click', () => {
            this.toggleSetupForm();
        });

        // Navigation buttons
        document.getElementById('add-password').addEventListener('click', () => {
            this.showAddModal('password');
        });

        document.getElementById('add-note').addEventListener('click', () => {
            this.showAddModal('note');
        });

        document.getElementById('add-file').addEventListener('click', () => {
            this.showAddModal('file');
        });

        document.getElementById('logout').addEventListener('click', () => {
            this.logout();
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideModal('add-modal');
        });

        document.getElementById('close-view-modal').addEventListener('click', () => {
            this.hideModal('view-modal');
        });

        document.getElementById('close-media-modal').addEventListener('click', () => {
            this.hideModal('media-modal');
        });

        // Entry forms
        document.getElementById('password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePasswordEntry();
        });

        document.getElementById('note-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNoteEntry();
        });

        document.getElementById('file-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFileEntry();
        });

        // Password generator
        document.getElementById('generate-password').addEventListener('click', () => {
            this.generatePassword();
        });

        // File input preview
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.previewFile(e.target.files[0]);
        });

        // Entry actions
        document.getElementById('edit-entry').addEventListener('click', () => {
            this.editCurrentEntry();
        });

        document.getElementById('delete-entry').addEventListener('click', () => {
            this.deleteCurrentEntry();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    // Toggle setup form visibility
    toggleSetupForm() {
        const setupDiv = document.getElementById('first-time-setup');
        const showButton = document.getElementById('show-setup');
        
        if (setupDiv.classList.contains('hidden')) {
            setupDiv.classList.remove('hidden');
            showButton.textContent = 'HIDE SETUP';
        } else {
            setupDiv.classList.add('hidden');
            showButton.textContent = 'FIRST TIME USER?';
        }
    }

    // Handle user login
    async handleLogin() {
        const password = document.getElementById('master-password').value;
        const storedHash = localStorage.getItem('vault_master');

        if (!storedHash) {
            this.showMessage('No master password set. Please use first time setup.', 'error');
            return;
        }

        // Verify password by comparing hashes
        const passwordHash = CryptoJS.SHA256(password).toString();
        if (passwordHash !== storedHash) {
            this.showMessage('Incorrect master password!', 'error');
            return;
        }

        this.masterPassword = password;
        await this.loadEntries();
        this.showMainScreen();
        this.showMessage('Login successful!', 'success');
    }

    // Handle first-time setup
    async handleSetup() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            this.showMessage('Passwords do not match!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('Password must be at least 6 characters!', 'error');
            return;
        }

        // Hash and store master password
        const passwordHash = CryptoJS.SHA256(newPassword).toString();
        localStorage.setItem('vault_master', passwordHash);

        this.masterPassword = newPassword;
        this.entries = [];
        this.saveEntries();
        
        this.showMainScreen();
        this.showMessage('Vault created successfully!', 'success');
    }

    // Show main screen after successful login
    showMainScreen() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        this.renderEntries();
    }

    // Load entries from localStorage and decrypt them
    async loadEntries() {
        try {
            const encryptedData = localStorage.getItem('vault_entries');
            if (!encryptedData) {
                this.entries = [];
                return;
            }

            // Decrypt the entries using master password
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.masterPassword);
            const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedData) {
                throw new Error('Failed to decrypt data');
            }

            this.entries = JSON.parse(decryptedData);
        } catch (error) {
            console.error('Error loading entries:', error);
            this.showMessage('Error loading data. Password may be incorrect.', 'error');
            this.entries = [];
        }
    }

    // Save entries to localStorage with encryption
    saveEntries() {
        try {
            const dataToEncrypt = JSON.stringify(this.entries);
            const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, this.masterPassword).toString();
            localStorage.setItem('vault_entries', encrypted);
        } catch (error) {
            console.error('Error saving entries:', error);
            this.showMessage('Error saving data!', 'error');
        }
    }

    // Show add entry modal
    showAddModal(type) {
        // Hide all forms first
        document.querySelectorAll('.entry-form').forEach(form => {
            form.classList.add('hidden');
        });

        // Show the correct form
        document.getElementById(`${type}-form`).classList.remove('hidden');
        
        // Update modal title
        const titles = {
            password: 'ADD PASSWORD',
            note: 'ADD NOTE',
            file: 'ADD FILE'
        };
        document.getElementById('modal-title').textContent = titles[type];

        // Reset forms
        this.resetForms();

        // Show modal
        document.getElementById('add-modal').classList.add('active');
    }

    // Reset all forms
    resetForms() {
        document.querySelectorAll('.entry-form').forEach(form => {
            form.reset();
        });
        document.getElementById('file-preview').classList.add('hidden');
        this.currentEditingId = null;
    }

    // Hide modal
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        this.resetForms();
    }

    // Save password entry
    savePasswordEntry() {
        const entry = {
            id: this.currentEditingId || this.generateId(),
            type: 'password',
            serviceName: document.getElementById('service-name').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            url: document.getElementById('url').value,
            createdAt: this.currentEditingId ? this.getEntryById(this.currentEditingId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.saveEntry(entry);
        this.showMessage(`Password ${this.currentEditingId ? 'updated' : 'saved'} successfully!`, 'success');
    }

    // Save note entry
    saveNoteEntry() {
        const entry = {
            id: this.currentEditingId || this.generateId(),
            type: 'note',
            title: document.getElementById('note-title').value,
            content: document.getElementById('note-content').value,
            createdAt: this.currentEditingId ? this.getEntryById(this.currentEditingId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.saveEntry(entry);
        this.showMessage(`Note ${this.currentEditingId ? 'updated' : 'saved'} successfully!`, 'success');
    }

    // Save file entry
    async saveFileEntry() {
        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showMessage('Please select a file!', 'error');
            return;
        }

        try {
            // Convert file to base64
            const base64Data = await this.fileToBase64(file);
            
            const entry = {
                id: this.currentEditingId || this.generateId(),
                type: 'file',
                title: document.getElementById('file-title').value,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileData: base64Data,
                createdAt: this.currentEditingId ? this.getEntryById(this.currentEditingId).createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.saveEntry(entry);
            this.showMessage(`File ${this.currentEditingId ? 'updated' : 'saved'} successfully!`, 'success');
        } catch (error) {
            console.error('Error saving file:', error);
            this.showMessage('Error saving file!', 'error');
        }
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Save or update entry
    saveEntry(entry) {
        if (this.currentEditingId) {
            // Update existing entry
            const index = this.entries.findIndex(e => e.id === this.currentEditingId);
            if (index !== -1) {
                this.entries[index] = entry;
            }
        } else {
            // Add new entry
            this.entries.push(entry);
        }

        this.saveEntries();
        this.renderEntries();
        this.hideModal('add-modal');
        this.hideModal('view-modal');
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Get entry by ID
    getEntryById(id) {
        return this.entries.find(entry => entry.id === id);
    }

    // Generate secure password
    generatePassword() {
        const length = 16;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        let password = "";
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        document.getElementById('password').value = password;
        this.showMessage('Strong password generated!', 'info');
    }

    // Preview uploaded file
    previewFile(file) {
        const preview = document.getElementById('file-preview');
        
        if (!file) {
            preview.classList.add('hidden');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            let previewElement;
            
            if (file.type.startsWith('image/')) {
                previewElement = document.createElement('img');
                previewElement.src = e.target.result;
                previewElement.alt = file.name;
            } else if (file.type.startsWith('video/')) {
                previewElement = document.createElement('video');
                previewElement.src = e.target.result;
                previewElement.controls = true;
            } else {
                previewElement = document.createElement('div');
                previewElement.textContent = `File: ${file.name} (${this.formatFileSize(file.size)})`;
                previewElement.style.padding = '10px';
                previewElement.style.border = '2px solid var(--border-color)';
            }

            preview.innerHTML = '';
            preview.appendChild(previewElement);
            preview.classList.remove('hidden');
        };

        reader.readAsDataURL(file);
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Render entries list
    renderEntries() {
        const entriesList = document.getElementById('entries-list');
        
        if (this.entries.length === 0) {
            entriesList.innerHTML = `
                <div class="empty-state">
                    <p>NO ENTRIES YET</p>
                    <p>USE THE BUTTONS ABOVE TO ADD DATA</p>
                </div>
            `;
            return;
        }

        entriesList.innerHTML = this.entries.map(entry => {
            let preview = '';
            switch (entry.type) {
                case 'password':
                    preview = `Service: ${entry.serviceName}`;
                    break;
                case 'note':
                    preview = entry.content.substring(0, 50) + (entry.content.length > 50 ? '...' : '');
                    break;
                case 'file':
                    preview = `${entry.fileName} (${this.formatFileSize(entry.fileSize)})`;
                    break;
            }

            return `
                <div class="entry-card ${entry.type}" onclick="app.viewEntry('${entry.id}')">
                    <div class="entry-header">
                        <div class="entry-type ${entry.type}">${entry.type.toUpperCase()}</div>
                    </div>
                    <div class="entry-title">${this.getEntryTitle(entry)}</div>
                    <div class="entry-preview">${preview}</div>
                </div>
            `;
        }).join('');
    }

    // Get entry title based on type
    getEntryTitle(entry) {
        switch (entry.type) {
            case 'password':
                return entry.serviceName;
            case 'note':
                return entry.title;
            case 'file':
                return entry.title;
            default:
                return 'Unknown';
        }
    }

    // View entry details
    viewEntry(id) {
        const entry = this.getEntryById(id);
        if (!entry) return;

        this.currentEditingId = id;
        const modalBody = document.getElementById('view-modal-body');
        const modalTitle = document.getElementById('view-modal-title');

        modalTitle.textContent = `VIEW ${entry.type.toUpperCase()}`;

        let detailsHtml = '';
        
        switch (entry.type) {
            case 'password':
                detailsHtml = `
                    <div class="entry-detail">
                        <div class="entry-detail-label">SERVICE:</div>
                        <div class="entry-detail-value">${entry.serviceName}</div>
                    </div>
                    <div class="entry-detail">
                        <div class="entry-detail-label">USERNAME:</div>
                        <div class="entry-detail-value">${entry.username}</div>
                    </div>
                    <div class="entry-detail">
                        <div class="entry-detail-label">PASSWORD:</div>
                        <div class="entry-detail-value password">${entry.password}</div>
                    </div>
                    ${entry.url ? `
                        <div class="entry-detail">
                            <div class="entry-detail-label">URL:</div>
                            <div class="entry-detail-value"><a href="${entry.url}" target="_blank" style="color: var(--primary-color)">${entry.url}</a></div>
                        </div>
                    ` : ''}
                `;
                break;

            case 'note':
                detailsHtml = `
                    <div class="entry-detail">
                        <div class="entry-detail-label">TITLE:</div>
                        <div class="entry-detail-value">${entry.title}</div>
                    </div>
                    <div class="entry-detail">
                        <div class="entry-detail-label">CONTENT:</div>
                        <div class="entry-detail-value">${entry.content}</div>
                    </div>
                `;
                break;

            case 'file':
                const isImage = entry.fileType.startsWith('image/');
                const isVideo = entry.fileType.startsWith('video/');
                
                detailsHtml = `
                    <div class="entry-detail">
                        <div class="entry-detail-label">TITLE:</div>
                        <div class="entry-detail-value">${entry.title}</div>
                    </div>
                    <div class="entry-detail">
                        <div class="entry-detail-label">FILE NAME:</div>
                        <div class="entry-detail-value">${entry.fileName}</div>
                    </div>
                    <div class="entry-detail">
                        <div class="entry-detail-label">FILE SIZE:</div>
                        <div class="entry-detail-value">${this.formatFileSize(entry.fileSize)}</div>
                    </div>
                    <div class="entry-detail">
                        <div class="entry-detail-label">FILE TYPE:</div>
                        <div class="entry-detail-value">${entry.fileType}</div>
                    </div>
                    ${(isImage || isVideo) ? `
                        <div class="entry-detail">
                            <div class="entry-detail-label">PREVIEW:</div>
                            <div class="entry-detail-value">
                                <button class="pixel-button primary" onclick="app.showMediaViewer('${entry.id}')">VIEW MEDIA</button>
                            </div>
                        </div>
                    ` : ''}
                `;
                break;
        }

        detailsHtml += `
            <div class="entry-detail">
                <div class="entry-detail-label">CREATED:</div>
                <div class="entry-detail-value">${new Date(entry.createdAt).toLocaleString()}</div>
            </div>
            <div class="entry-detail">
                <div class="entry-detail-label">UPDATED:</div>
                <div class="entry-detail-value">${new Date(entry.updatedAt).toLocaleString()}</div>
            </div>
        `;

        modalBody.innerHTML = detailsHtml;
        document.getElementById('view-modal').classList.add('active');
    }

    // Show media viewer
    showMediaViewer(id) {
        const entry = this.getEntryById(id);
        if (!entry || entry.type !== 'file') return;

        const mediaContainer = document.getElementById('media-container');
        let mediaElement;

        if (entry.fileType.startsWith('image/')) {
            mediaElement = document.createElement('img');
            mediaElement.src = entry.fileData;
            mediaElement.alt = entry.fileName;
        } else if (entry.fileType.startsWith('video/')) {
            mediaElement = document.createElement('video');
            mediaElement.src = entry.fileData;
            mediaElement.controls = true;
        }

        mediaContainer.innerHTML = '';
        if (mediaElement) {
            mediaContainer.appendChild(mediaElement);
        }

        document.getElementById('media-modal').classList.add('active');
    }

    // Edit current entry
    editCurrentEntry() {
        const entry = this.getEntryById(this.currentEditingId);
        if (!entry) return;

        this.hideModal('view-modal');

        // Hide all forms first
        document.querySelectorAll('.entry-form').forEach(form => {
            form.classList.add('hidden');
        });

        // Show the correct form and populate it
        const form = document.getElementById(`${entry.type}-form`);
        form.classList.remove('hidden');

        // Update modal title
        const titles = {
            password: 'EDIT PASSWORD',
            note: 'EDIT NOTE',
            file: 'EDIT FILE'
        };
        document.getElementById('modal-title').textContent = titles[entry.type];

        // Populate form fields based on entry type
        switch (entry.type) {
            case 'password':
                document.getElementById('service-name').value = entry.serviceName;
                document.getElementById('username').value = entry.username;
                document.getElementById('password').value = entry.password;
                document.getElementById('url').value = entry.url || '';
                break;

            case 'note':
                document.getElementById('note-title').value = entry.title;
                document.getElementById('note-content').value = entry.content;
                break;

            case 'file':
                document.getElementById('file-title').value = entry.title;
                // Note: We can't set file input value for security reasons
                // Show current file info instead
                const preview = document.getElementById('file-preview');
                preview.innerHTML = `
                    <div>Current file: ${entry.fileName} (${this.formatFileSize(entry.fileSize)})</div>
                    <div style="font-size: 8px; color: var(--secondary-color); margin-top: 5px;">
                        Select a new file to replace, or leave empty to keep current file
                    </div>
                `;
                preview.classList.remove('hidden');
                break;
        }

        document.getElementById('add-modal').classList.add('active');
    }

    // Delete current entry
    deleteCurrentEntry() {
        if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            return;
        }

        const index = this.entries.findIndex(e => e.id === this.currentEditingId);
        if (index !== -1) {
            this.entries.splice(index, 1);
            this.saveEntries();
            this.renderEntries();
            this.hideModal('view-modal');
            this.showMessage('Entry deleted successfully!', 'success');
        }
    }

    // Show message to user
    showMessage(text, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        messageContainer.appendChild(message);

        // Auto remove message after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }

    // Logout user
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.masterPassword = null;
            this.entries = [];
            this.currentEditingId = null;
            
            // Reset forms and screens
            document.getElementById('main-screen').classList.remove('active');
            document.getElementById('login-screen').classList.add('active');
            
            // Clear form fields
            document.getElementById('master-password').value = '';
            this.resetForms();
            
            this.showMessage('Logged out successfully!', 'info');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PixelVault();
});

// Handle file editing for file entries - special case where we need to handle optional file replacement
document.addEventListener('DOMContentLoaded', () => {
    const originalSaveFileEntry = PixelVault.prototype.saveFileEntry;
    
    PixelVault.prototype.saveFileEntry = async function() {
        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];
        
        // If editing and no new file selected, keep the existing file
        if (this.currentEditingId && !file) {
            const existingEntry = this.getEntryById(this.currentEditingId);
            const entry = {
                id: this.currentEditingId,
                type: 'file',
                title: document.getElementById('file-title').value,
                fileName: existingEntry.fileName,
                fileType: existingEntry.fileType,
                fileSize: existingEntry.fileSize,
                fileData: existingEntry.fileData,
                createdAt: existingEntry.createdAt,
                updatedAt: new Date().toISOString()
            };

            this.saveEntry(entry);
            this.showMessage('File updated successfully!', 'success');
            return;
        }
        
        // Otherwise, use the original method
        return originalSaveFileEntry.call(this);
    };
});
