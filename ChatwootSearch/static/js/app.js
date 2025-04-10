// Chatwoot Contact Search Application
// Main JavaScript file

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const configWarning = document.getElementById('configWarning');
    const resultsSection = document.getElementById('resultsSection');
    const resultsTable = document.getElementById('resultsTable');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    // Form elements
    const apiUrlInput = document.getElementById('apiUrl');
    const accountIdInput = document.getElementById('accountId');
    const apiTokenInput = document.getElementById('apiToken');
    
    // Bootstrap modals
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
    
    // Configuration key in local storage
    const CONFIG_STORAGE_KEY = 'chatwootConfig';
    
    // Initialize application
    initApp();
    
    /**
     * Initialize the application
     */
    function initApp() {
        // Load configuration from local storage
        loadConfig();
        
        // Check if configuration exists
        checkConfigurationStatus();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    /**
     * Set up event listeners for the application
     */
    function setupEventListeners() {
        // Save settings button
        saveSettingsBtn.addEventListener('click', saveSettings);
        
        // Search button
        searchBtn.addEventListener('click', performSearch);
        
        // Enter key in search input
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    /**
     * Load configuration from local storage
     */
    function loadConfig() {
        try {
            const config = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
            if (config) {
                apiUrlInput.value = config.apiUrl || '';
                accountIdInput.value = config.accountId || '';
                apiTokenInput.value = config.apiToken || '';
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    }
    
    /**
     * Check if the configuration exists and show warning if not
     */
    function checkConfigurationStatus() {
        const config = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
        
        if (!config || !config.apiUrl || !config.accountId || !config.apiToken) {
            configWarning.classList.remove('d-none');
            searchBtn.disabled = true;
            searchInput.disabled = true;
        } else {
            configWarning.classList.add('d-none');
            searchBtn.disabled = false;
            searchInput.disabled = false;
        }
    }
    
    /**
     * Save settings to local storage
     */
    function saveSettings() {
        // Validate form
        if (!apiUrlInput.value || !accountIdInput.value || !apiTokenInput.value) {
            showError('All fields are required in the settings form.');
            return;
        }
        
        const config = {
            apiUrl: apiUrlInput.value.trim(),
            accountId: accountIdInput.value.trim(),
            apiToken: apiTokenInput.value.trim()
        };
        
        try {
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
            settingsModal.hide();
            checkConfigurationStatus();
            showToast('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Error saving configuration:', error);
            showError('Falha ao salvar configurações. Por favor, tente novamente.');
        }
    }
    
    /**
     * Perform the contact search
     */
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            showError('Por favor, insira um termo de busca');
            return;
        }
        
        // Get config from local storage
        const config = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
        
        if (!config) {
            showError('Configuração não encontrada. Configure as configurações primeiro.');
            configWarning.classList.remove('d-none');
            return;
        }
        
        // Show loading spinner
        loadingSpinner.classList.remove('d-none');
        
        // Hide previous results and errors
        resultsSection.classList.add('d-none');
        noResultsMessage.classList.add('d-none');
        errorAlert.classList.add('d-none');
        
        // Use local server as proxy for the API request
        fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiUrl: config.apiUrl,
                accountId: config.accountId,
                apiToken: config.apiToken,
                searchTerm: searchTerm
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Requisição falhou com status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading spinner
            loadingSpinner.classList.add('d-none');
            
            // Check if there's an error in the response
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Display results
            displayResults(data);
        })
        .catch(error => {
            // Hide loading spinner
            loadingSpinner.classList.add('d-none');
            
            console.error('Error fetching contacts:', error);
            showError(`Falha ao buscar contatos: ${error.message}`);
        });
    }
    
    /**
     * Display search results
     * @param {Object} data - The response data from the API
     */
    function displayResults(data) {
        // Clear previous results
        resultsTable.innerHTML = '';
        
        if (!data || !data.payload || data.payload.length === 0) {
            noResultsMessage.classList.remove('d-none');
            return;
        }
        
        // Show results section
        resultsSection.classList.remove('d-none');
        
        // Add each contact to the results table
        data.payload.forEach(contact => {
            const row = document.createElement('tr');
            
            // Format the last activity date
            const lastActivity = contact.last_activity_at 
                ? new Date(contact.last_activity_at).toLocaleString() 
                : 'N/A';
            
            row.innerHTML = `
                <td data-label="Nome">${contact.name || 'N/A'}</td>
                <td data-label="Email">${contact.email || 'N/A'}</td>
                <td data-label="Telefone">${contact.phone_number || 'N/A'}</td>
                <td data-label="Última Atividade">${lastActivity}</td>
                <td data-label="Ações">
                    <button class="btn btn-sm btn-info view-details" data-contact-id="${contact.id}">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            `;
            
            resultsTable.appendChild(row);
        });
        
        // Add event listeners to view details buttons
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', function() {
                const contactId = this.getAttribute('data-contact-id');
                viewContactDetails(contactId);
            });
        });
    }
    
    /**
     * View contact details
     * @param {string} contactId - The ID of the contact to view
     */
    function viewContactDetails(contactId) {
        // Get config from local storage
        const config = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
        
        if (!config) {
            showError('Configuração não encontrada. Configure as configurações primeiro.');
            return;
        }
        
        // Show loading in the modal
        const detailsContent = document.getElementById('contactDetailsContent');
        detailsContent.innerHTML = `
            <div class="text-center my-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2">Carregando detalhes do contato...</p>
            </div>
        `;
        
        // Show the modal
        const contactDetailsModal = new bootstrap.Modal(document.getElementById('contactDetailsModal'));
        contactDetailsModal.show();
        
        // Use local server as proxy for the API request
        fetch(`/api/contact/${contactId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiUrl: config.apiUrl,
                accountId: config.accountId,
                apiToken: config.apiToken
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Requisição falhou com status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Check if there's an error in the response
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Display contact details in the modal
            displayContactDetails(data.payload);
        })
        .catch(error => {
            console.error('Error fetching contact details:', error);
            detailsContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Falha ao buscar detalhes do contato: ${error.message}
                </div>
            `;
        });
    }
    
    /**
     * Display contact details in the modal
     * @param {Object} contact - The contact data
     */
    function displayContactDetails(contact) {
        const detailsContent = document.getElementById('contactDetailsContent');
        
        // Format created at and updated at dates
        const createdAt = contact.created_at ? new Date(contact.created_at).toLocaleString() : 'N/A';
        const updatedAt = contact.updated_at ? new Date(contact.updated_at).toLocaleString() : 'N/A';
        
        // Build custom attributes HTML
        let customAttributesHtml = '<p>Nenhum</p>';
        if (contact.custom_attributes && Object.keys(contact.custom_attributes).length > 0) {
            customAttributesHtml = '<ul class="list-group">';
            for (const [key, value] of Object.entries(contact.custom_attributes)) {
                customAttributesHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${key}</span>
                        <span class="badge bg-primary">${value}</span>
                    </li>
                `;
            }
            customAttributesHtml += '</ul>';
        }
        
        detailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <span class="contact-detail-label">Nome:</span>
                        <div class="contact-detail-value">${contact.name || 'N/A'}</div>
                    </div>
                    
                    <div class="mb-3">
                        <span class="contact-detail-label">Email:</span>
                        <div class="contact-detail-value">${contact.email || 'N/A'}</div>
                    </div>
                    
                    <div class="mb-3">
                        <span class="contact-detail-label">Telefone:</span>
                        <div class="contact-detail-value">${contact.phone_number || 'N/A'}</div>
                    </div>
                    
                    <div class="mb-3">
                        <span class="contact-detail-label">Identificador:</span>
                        <div class="contact-detail-value">${contact.identifier || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="mb-3">
                        <span class="contact-detail-label">Criado em:</span>
                        <div class="contact-detail-value">${createdAt}</div>
                    </div>
                    
                    <div class="mb-3">
                        <span class="contact-detail-label">Atualizado em:</span>
                        <div class="contact-detail-value">${updatedAt}</div>
                    </div>
                    
                    <div class="mb-3">
                        <span class="contact-detail-label">Visto por último em:</span>
                        <div class="contact-detail-value">
                            ${contact.last_seen_at ? new Date(contact.last_seen_at).toLocaleString() : 'N/A'}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <span class="contact-detail-label">Informações adicionais:</span>
                        <div class="contact-detail-value">${contact.additional_attributes?.description || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <h5 class="mb-3">Atributos Personalizados</h5>
                    ${customAttributesHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * Show an error message
     * @param {string} message - The error message to display
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        
        // Hide the error after 5 seconds
        setTimeout(() => {
            errorAlert.classList.add('d-none');
        }, 5000);
    }
    
    /**
     * Show a toast notification (using alert for simplicity)
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, error, etc.)
     */
    function showToast(message, type = 'info') {
        // Create a toast-like alert
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3`;
        toast.style.zIndex = '1050';
        toast.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${message}</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        document.body.appendChild(toast);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
});
