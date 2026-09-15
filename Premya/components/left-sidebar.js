// Left Sidebar Component

class LeftSidebar {
    constructor() {
        this.uploadBtn = document.getElementById('upload-btn');
        this.pdfInput = document.getElementById('pdf-input');
        this.dropZone = document.getElementById('drop-zone');
        this.recentDocsContainer = document.getElementById('recent-docs');
        this.recentActivityContainer = document.getElementById('recent-activity');
        this.clearDocsBtn = document.getElementById('clear-docs-btn');
        this.clearActivityBtn = document.getElementById('clear-activity-btn');
        this.init();
    }

    init() {
        // Button click to trigger file input
        this.uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pdfInput.click();
        });

        // Drop zone click
        this.dropZone.addEventListener('click', () => {
            this.pdfInput.click();
        });

        // File input change
        this.pdfInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                this.handleFileUpload(file);
            } else {
                this.showError('Please select a valid PDF file');
            }
        });

        // Drag and drop handlers
        this.setupDragAndDrop();

        // Clear buttons
        this.clearDocsBtn.addEventListener('click', () => {
            if (confirm('Clear all recent documents?')) {
                this.clearRecentDocs();
            }
        });

        this.clearActivityBtn.addEventListener('click', () => {
            if (confirm('Clear all activity?')) {
                this.clearRecentActivity();
            }
        });

        this.loadRecentDocs();
        this.loadRecentActivity();
    }

    setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('border-gray-500', 'bg-gray-200');
                this.dropZone.classList.remove('border-gray-300', 'bg-gray-50');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('border-gray-500', 'bg-gray-200');
                this.dropZone.classList.add('border-gray-300', 'bg-gray-50');
            }, false);
        });

        // Handle dropped files
        this.dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'application/pdf') {
                    this.handleFileUpload(file);
                } else {
                    this.showError('Please drop a valid PDF file');
                }
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileUpload(file) {
        // Update UI
        this.updateUploadStatus('processing');
        this.addActivity('upload', `Uploading ${file.name}...`);

        try {
            // Emit custom event for app.js to handle
            const event = new CustomEvent('pdfUploaded', { detail: { file } });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Failed to process PDF: ' + error.message);
            this.updateUploadStatus('error');
            this.addActivity('error', `Failed to upload ${file.name}`);
        }
    }

    updateUploadStatus(status) {
        const dropZoneContent = this.dropZone.querySelector('div');
        
        if (status === 'processing') {
            this.uploadBtn.disabled = true;
            this.uploadBtn.textContent = 'Processing...';
            this.dropZone.classList.add('opacity-50', 'pointer-events-none');
        } else if (status === 'complete') {
            this.uploadBtn.disabled = false;
            this.uploadBtn.textContent = 'Choose File';
            this.dropZone.classList.remove('opacity-50', 'pointer-events-none');
        } else if (status === 'error') {
            this.uploadBtn.disabled = false;
            this.uploadBtn.textContent = 'Choose File';
            this.dropZone.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    addToRecentDocs(fileName, fileSize = null) {
        let recentDocs = this.getRecentDocs();
        
        // Remove if already exists
        recentDocs = recentDocs.filter(doc => doc.name !== fileName);
        
        // Add to beginning
        recentDocs.unshift({
            name: fileName,
            timestamp: Date.now(),
            size: fileSize
        });
        
        // Keep only last 10
        recentDocs = recentDocs.slice(0, 10);
        
        localStorage.setItem(CONFIG.STORAGE_KEY_RECENT_DOCS, JSON.stringify(recentDocs));
        this.loadRecentDocs();
    }

    getRecentDocs() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY_RECENT_DOCS);
        return stored ? JSON.parse(stored) : [];
    }

    loadRecentDocs() {
        const recentDocs = this.getRecentDocs();
        this.recentDocsContainer.innerHTML = '';

        if (recentDocs.length === 0) {
            this.recentDocsContainer.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">No recent documents</p>';
            return;
        }

        recentDocs.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.className = 'group flex items-center gap-2.5 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200';
            docElement.innerHTML = `
                <div class="flex-shrink-0 w-7 h-7 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                    <svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z"/>
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-900 truncate">${doc.name}</p>
                    <p class="text-xs text-gray-500 mt-0.5">${this.formatDate(doc.timestamp)}</p>
                </div>
                <button class="remove-doc-btn opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded" data-filename="${doc.name}" title="Remove">
                    <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            
            // Add click handler to load document (if we implement document loading)
            docElement.addEventListener('click', () => {
                // Could implement document loading here
                console.log('Load document:', doc.name);
            });
            
            // Add remove button handler
            const removeBtn = docElement.querySelector('.remove-doc-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeDocument(removeBtn.dataset.filename);
                });
            }
            
            this.recentDocsContainer.appendChild(docElement);
        });
    }

    removeDocument(fileName) {
        let recentDocs = this.getRecentDocs();
        recentDocs = recentDocs.filter(doc => doc.name !== fileName);
        localStorage.setItem(CONFIG.STORAGE_KEY_RECENT_DOCS, JSON.stringify(recentDocs));
        this.loadRecentDocs();
    }

    clearRecentDocs() {
        localStorage.removeItem(CONFIG.STORAGE_KEY_RECENT_DOCS);
        this.loadRecentDocs();
    }

    // Recent Activity Methods
    addActivity(type, message, details = null) {
        let activities = this.getRecentActivity();
        
        const activity = {
            type: type, // 'upload', 'generate', 'error', 'query'
            message: message,
            details: details,
            timestamp: Date.now()
        };
        
        // Add messageId if provided
        if (details && details.messageId) {
            activity.messageId = details.messageId;
        }
        
        activities.unshift(activity);
        
        // Keep only last 20 activities
        activities = activities.slice(0, 20);
        
        localStorage.setItem('campusEase_recent_activity', JSON.stringify(activities));
        this.loadRecentActivity();
    }

    getRecentActivity() {
        const stored = localStorage.getItem('campusEase_recent_activity');
        return stored ? JSON.parse(stored) : [];
    }

    loadRecentActivity() {
        const activities = this.getRecentActivity();
        this.recentActivityContainer.innerHTML = '';

        if (activities.length === 0) {
            this.recentActivityContainer.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">No recent activity</p>';
            return;
        }

        activities.slice(0, 5).forEach(activity => {
            const activityElement = document.createElement('div');
            
            // Make clickable if it has a messageId
            if (activity.messageId) {
                activityElement.className = 'flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200';
                activityElement.addEventListener('click', () => {
                    // Emit event to scroll to message
                    const event = new CustomEvent('scrollToMessage', { detail: { messageId: activity.messageId } });
                    document.dispatchEvent(event);
                });
            } else {
                activityElement.className = 'flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200';
            }
            
            const icon = this.getActivityIcon(activity.type);
            
            activityElement.innerHTML = `
                <div class="flex-shrink-0 w-6 h-6 bg-gray-100 rounded flex items-center justify-center mt-0.5 border border-gray-200">
                    ${icon}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-900">${activity.message}</p>
                    <p class="text-xs text-gray-500 mt-0.5">${this.formatTime(activity.timestamp)}</p>
                </div>
                ${activity.messageId ? '<svg class="w-3 h-3 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>' : ''}
            `;
            
            this.recentActivityContainer.appendChild(activityElement);
        });
    }

    getActivityIcon(type) {
        const icons = {
            upload: '<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>',
            generate: '<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            query: '<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>',
            error: '<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        };
        return icons[type] || icons.upload;
    }

    clearRecentActivity() {
        localStorage.removeItem('campusEase_recent_activity');
        this.loadRecentActivity();
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showError(message) {
        // Simple error notification (could be enhanced with a toast)
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-white border border-gray-300 text-gray-900 px-4 py-3 rounded-md shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm">${message}</span>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}
