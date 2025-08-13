// PixelVault Main Application
class PixelVault {
    constructor() {
        this.api = new PixelVaultAPI();
        this.currentUser = null;
        this.vaultAccess = false;
        this.entries = [];
        this.currentFilter = 'all';
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.currentEditingId = null;
        this.masterPassword = null; // For client-side encryption

        this.init();
    }

    async init() {
        this.initializeTheme();
        this.bindEvents();
        await this.checkAuth();
    }

    initializeTheme() {
        document.body.className = this.currentTheme;
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = this.currentTheme === 'dark' ? '☀' : '🌙';
        }
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

        // Auth forms
        document.getElementById('account-login-form')?.addEventListener('submit', (e) => this.handleAccountLogin(e));
        document.getElementById('account-register-form')?.addEventListener('submit', (e) => this.handleAccountRegister(e));
        document.getElementById('master-password-form')?.addEventListener('submit', (e) => this.handleMasterPassword(e));

        // Auth switch buttons
        document.getElementById('show-register')?.addEventListener('click', () => this.showRegisterForm());
        document.getElementById('show-login')?.addEventListener('click', () => this.showLoginForm());
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());

        // Main app events
        document.getElementById('add-password-btn')?.addEventListener('click', () => this.showAddEntryModal('password'));
        document.getElementById('add-note-btn')?.addEventListener('click', () => this.showAddEntryModal('note'));
        document.getElementById('add-file-btn')?.addEventListener('click', () => this.showAddEntryModal('file'));

        // Filter buttons
        document.getElementById('filter-all')?.addEventListener('click', () => this.setFilter('all'));
        document.getElementById('filter-passwords')?.addEventListener('click', () => this.setFilter('password'));
        document.getElementById('filter-notes')?.addEventListener('click', () => this.setFilter('note'));
        document.getElementById('filter-files')?.addEventListener('click', () => this.setFilter('file'));

        // Modal events
        document.getElementById('password-form')?.addEventListener('submit', (e) => this.savePasswordEntry(e));
        document.getElementById('note-form')?.addEventListener('submit', (e) => this.saveNoteEntry(e));
        document.getElementById('file-form')?.addEventListener('submit', (e) => this.saveFileEntry(e));

        // Close modal buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Generate password button
        document.getElementById('generate-password-btn')?.addEventListener('click', () => this.generatePassword());

        // File preview
        document.getElementById('file-input')?.addEventListener('change', (e) => this.previewFile(e));
    }

    async checkAuth() {
        try {
            const session = await this.api.checkSession();
            
            if (session.loggedIn) {
                this.currentUser = session.user;
                
                if (session.vaultAccess) {
                    this.vaultAccess = true;
                    this.showMainScreen();
                    await this.loadEntries();
                } else {
                    this.showMasterPasswordScreen();
                }
            } else {
                this.showAccountLoginScreen();
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.showAccountLoginScreen();
        }
    }

    // Auth methods
    async handleAccountLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await this.api.login(username, password);
            this.currentUser = response.user;
            this.showMessage('Login realizado com sucesso!', 'success');
            this.showMasterPasswordScreen();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async handleAccountRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const masterPassword = document.getElementById('register-master-password').value;

        try {
            const response = await this.api.register(username, email, password, masterPassword);
            this.currentUser = response.user;
            this.showMessage('Conta criada com sucesso!', 'success');
            this.showMasterPasswordScreen();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async handleMasterPassword(e) {
        e.preventDefault();
        const masterPassword = document.getElementById('master-password').value;

        try {
            await this.api.verifyMasterPassword(masterPassword);
            this.masterPassword = masterPassword; // Store for client-side encryption
            this.vaultAccess = true;
            this.showMessage('Acesso ao cofre liberado!', 'success');
            this.showMainScreen();
            await this.loadEntries();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async logout() {
        try {
            await this.api.logout();
            this.currentUser = null;
            this.vaultAccess = false;
            this.entries = [];
            this.masterPassword = null;
            this.showMessage('Logout realizado com sucesso!', 'info');
            this.showAccountLoginScreen();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // Screen management
    showAccountLoginScreen() {
        this.hideAllScreens();
        document.getElementById('account-login-screen')?.classList.add('active');
        document.getElementById('header-user-info').style.display = 'none';
    }

    showMasterPasswordScreen() {
        this.hideAllScreens();
        document.getElementById('master-password-screen')?.classList.add('active');
        document.getElementById('header-user-info').style.display = 'flex';
        document.getElementById('username-display').textContent = this.currentUser?.username || '';
    }

    showMainScreen() {
        this.hideAllScreens();
        document.getElementById('main-screen')?.classList.add('active');
        document.getElementById('header-user-info').style.display = 'flex';
        document.getElementById('username-display').textContent = this.currentUser?.username || '';
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    showRegisterForm() {
        document.getElementById('account-login-form').classList.add('hidden');
        document.getElementById('account-register-form').classList.remove('hidden');
        document.getElementById('auth-title').textContent = 'CRIAR CONTA';
        document.getElementById('show-register').classList.add('hidden');
        document.getElementById('show-login').classList.remove('hidden');
    }

    showLoginForm() {
        document.getElementById('account-register-form').classList.add('hidden');
        document.getElementById('account-login-form').classList.remove('hidden');
        document.getElementById('auth-title').textContent = 'FAZER LOGIN';
        document.getElementById('show-login').classList.add('hidden');
        document.getElementById('show-register').classList.remove('hidden');
    }

    // Vault management
    async loadEntries() {
        try {
            const response = await this.api.getEntries();
            this.entries = response.entries.map(entry => {
                try {
                    // Decrypt entry data
                    const decryptedData = CryptoJS.AES.decrypt(entry.encrypted_data, this.masterPassword).toString(CryptoJS.enc.Utf8);
                    const parsedData = JSON.parse(decryptedData);
                    
                    return {
                        id: entry.id,
                        type: entry.type,
                        createdAt: entry.created_at,
                        updatedAt: entry.updated_at,
                        ...parsedData
                    };
                } catch (error) {
                    console.error('Erro ao descriptografar entrada:', error);
                    return null;
                }
            }).filter(entry => entry !== null);

            this.renderEntries();
        } catch (error) {
            this.showMessage('Erro ao carregar entradas: ' + error.message, 'error');
        }
    }

    encryptEntry(entryData) {
        const dataToEncrypt = JSON.stringify(entryData);
        return CryptoJS.AES.encrypt(dataToEncrypt, this.masterPassword).toString();
    }

    async savePasswordEntry(e) {
        e.preventDefault();
        
        const entryData = {
            serviceName: document.getElementById('service-name').value,
            category: document.getElementById('password-category').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            url: document.getElementById('url').value
        };

        const encryptedData = this.encryptEntry(entryData);

        try {
            if (this.currentEditingId) {
                await this.api.updateEntry(this.currentEditingId, encryptedData);
                this.showMessage('Senha atualizada com sucesso!', 'success');
            } else {
                await this.api.createEntry('password', encryptedData);
                this.showMessage('Senha salva com sucesso!', 'success');
            }
            
            this.closeModals();
            await this.loadEntries();
        } catch (error) {
            this.showMessage('Erro ao salvar senha: ' + error.message, 'error');
        }
    }

    async saveNoteEntry(e) {
        e.preventDefault();
        
        const entryData = {
            title: document.getElementById('note-title').value,
            category: document.getElementById('note-category').value,
            content: document.getElementById('note-content').value
        };

        const encryptedData = this.encryptEntry(entryData);

        try {
            if (this.currentEditingId) {
                await this.api.updateEntry(this.currentEditingId, encryptedData);
                this.showMessage('Nota atualizada com sucesso!', 'success');
            } else {
                await this.api.createEntry('note', encryptedData);
                this.showMessage('Nota salva com sucesso!', 'success');
            }
            
            this.closeModals();
            await this.loadEntries();
        } catch (error) {
            this.showMessage('Erro ao salvar nota: ' + error.message, 'error');
        }
    }

    async saveFileEntry(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];
        
        if (!file && !this.currentEditingId) {
            this.showMessage('Por favor, selecione um arquivo!', 'error');
            return;
        }

        try {
            let entryData;
            
            if (file) {
                // Read file as base64
                const fileData = await this.readFileAsBase64(file);
                entryData = {
                    title: document.getElementById('file-title').value,
                    category: document.getElementById('file-category').value,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    fileData: fileData
                };
            } else {
                // Editing without changing file
                const existingEntry = this.entries.find(e => e.id === this.currentEditingId);
                entryData = {
                    ...existingEntry,
                    title: document.getElementById('file-title').value,
                    category: document.getElementById('file-category').value
                };
                delete entryData.id;
                delete entryData.type;
                delete entryData.createdAt;
                delete entryData.updatedAt;
            }

            const encryptedData = this.encryptEntry(entryData);

            if (this.currentEditingId) {
                await this.api.updateEntry(this.currentEditingId, encryptedData);
                this.showMessage('Arquivo atualizado com sucesso!', 'success');
            } else {
                await this.api.createEntry('file', encryptedData);
                this.showMessage('Arquivo salvo com sucesso!', 'success');
            }
            
            this.closeModals();
            await this.loadEntries();
        } catch (error) {
            this.showMessage('Erro ao salvar arquivo: ' + error.message, 'error');
        }
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // UI methods
    renderEntries() {
        const entriesList = document.getElementById('entries-list');
        if (!entriesList) return;

        let filteredEntries = this.entries;
        if (this.currentFilter !== 'all') {
            filteredEntries = this.entries.filter(entry => entry.type === this.currentFilter);
        }

        if (filteredEntries.length === 0) {
            entriesList.innerHTML = `
                <div class="empty-state">
                    <p>${this.currentFilter !== 'all' ? 'NENHUMA ENTRADA NESTA CATEGORIA' : 'NENHUMA ENTRADA AINDA'}</p>
                    <p>USE OS BOTÕES ACIMA PARA ADICIONAR DADOS</p>
                </div>
            `;
            return;
        }

        entriesList.innerHTML = filteredEntries.map(entry => {
            const icon = this.getEntryIcon(entry.type);
            const title = this.getEntryTitle(entry);
            const subtitle = this.getEntrySubtitle(entry);

            return `
                <div class="entry-item" onclick="app.viewEntry('${entry.id}')">
                    <div class="entry-icon">${icon}</div>
                    <div class="entry-content">
                        <div class="entry-title">${title}</div>
                        <div class="entry-subtitle">${subtitle}</div>
                    </div>
                    <div class="entry-actions">
                        <button class="pixel-button secondary" onclick="event.stopPropagation(); app.editEntry('${entry.id}')">✎</button>
                        <button class="pixel-button danger" onclick="event.stopPropagation(); app.deleteEntry('${entry.id}')">🗑</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getEntryIcon(type) {
        const icons = {
            password: '🔐',
            note: '📝',
            file: '📁'
        };
        return icons[type] || '📄';
    }

    getEntryTitle(entry) {
        switch (entry.type) {
            case 'password':
                return entry.serviceName || 'Senha sem título';
            case 'note':
                return entry.title || 'Nota sem título';
            case 'file':
                return entry.title || entry.fileName || 'Arquivo sem título';
            default:
                return 'Entrada sem título';
        }
    }

    getEntrySubtitle(entry) {
        switch (entry.type) {
            case 'password':
                return entry.username || 'Usuário não informado';
            case 'note':
                return entry.content?.substring(0, 50) + (entry.content?.length > 50 ? '...' : '');
            case 'file':
                return `${entry.fileName} (${this.formatFileSize(entry.fileSize)})`;
            default:
                return '';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`filter-${filter === 'all' ? 'all' : filter + 's'}`).classList.add('active');
        
        this.renderEntries();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.className = this.currentTheme;
        localStorage.setItem('theme', this.currentTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.textContent = this.currentTheme === 'dark' ? '☀' : '🌙';
        
        this.showMessage(`Tema ${this.currentTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'info');
    }

    showMessage(text, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        messageContainer.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }

    generatePassword() {
        const length = 16;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        document.getElementById('password').value = password;
        this.showMessage('Senha forte gerada!', 'info');
    }

    // Modal methods will be implemented in next part...
    showAddEntryModal(type) {
        this.currentEditingId = null;
        document.getElementById('add-modal')?.classList.add('active');
        
        // Hide all forms
        document.querySelectorAll('.entry-form').forEach(form => {
            form.classList.add('hidden');
        });
        
        // Show specific form
        document.getElementById(`${type}-form`)?.classList.remove('hidden');
        
        // Update modal title
        const titles = {
            password: 'ADICIONAR SENHA',
            note: 'ADICIONAR NOTA',
            file: 'ADICIONAR ARQUIVO'
        };
        document.getElementById('modal-title').textContent = titles[type];
        
        // Reset forms
        document.getElementById(`${type}-form`)?.reset();
        document.getElementById('file-preview')?.classList.add('hidden');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.currentEditingId = null;
    }

    async deleteEntry(id) {
        if (!confirm('Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            await this.api.deleteEntry(id);
            this.showMessage('Entrada excluída com sucesso!', 'success');
            await this.loadEntries();
        } catch (error) {
            this.showMessage('Erro ao excluir entrada: ' + error.message, 'error');
        }
    }

    // Additional methods for view/edit will be added...
    viewEntry(id) {
        // Implementation for viewing entries
        console.log('View entry:', id);
    }

    editEntry(id) {
        // Implementation for editing entries
        console.log('Edit entry:', id);
    }

    previewFile(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('file-preview');
        
        if (!file) {
            preview.classList.add('hidden');
            return;
        }

        preview.innerHTML = `
            <div>Arquivo selecionado: ${file.name}</div>
            <div>Tamanho: ${this.formatFileSize(file.size)}</div>
            <div>Tipo: ${file.type}</div>
        `;
        preview.classList.remove('hidden');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PixelVault();
});