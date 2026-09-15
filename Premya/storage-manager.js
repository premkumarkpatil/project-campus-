// Storage Manager for saving and loading generated content

class StorageManager {
    constructor() {
        this.storagePrefix = 'campusEase_';
    }

    // Get storage key for a PDF
    getPDFKey(fileName) {
        return `${this.storagePrefix}pdf_${this.sanitizeFileName(fileName)}`;
    }

    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-zA-Z0-9]/g, '_');
    }

    // Save PDF data with all generated content
    savePDFData(fileName, pdfData) {
        const key = this.getPDFKey(fileName);
        const data = {
            ...pdfData,
            timestamp: Date.now(),
            fileName: fileName
        };
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Load PDF data
    loadPDFData(fileName) {
        const key = this.getPDFKey(fileName);
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    }

    // Save specific generated content
    saveGeneratedContent(fileName, contentType, content) {
        const pdfData = this.loadPDFData(fileName) || {};
        pdfData[contentType] = content;
        pdfData[`${contentType}_timestamp`] = Date.now();
        this.savePDFData(fileName, pdfData);
    }

    // Get generated content
    getGeneratedContent(fileName, contentType) {
        const pdfData = this.loadPDFData(fileName);
        if (!pdfData) return null;
        return pdfData[contentType] || null;
    }

    // Check if content exists and is recent (within 24 hours)
    hasRecentContent(fileName, contentType) {
        const pdfData = this.loadPDFData(fileName);
        if (!pdfData || !pdfData[contentType]) return false;
        
        const timestamp = pdfData[`${contentType}_timestamp`] || pdfData.timestamp;
        const age = Date.now() - timestamp;
        const oneDay = 24 * 60 * 60 * 1000;
        
        return age < oneDay;
    }

    // Get all saved PDFs
    getAllSavedPDFs() {
        const pdfs = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.storagePrefix + 'pdf_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    pdfs.push({
                        fileName: data.fileName || key.replace(this.storagePrefix + 'pdf_', ''),
                        timestamp: data.timestamp || 0,
                        hasText: !!data.text,
                        hasSummary: !!data.summary,
                        hasFlashcards: !!data.flashcards,
                        hasMnemonics: !!data.mnemonics,
                        hasMindmap: !!data.mindmap,
                        hasResources: !!data.resources
                    });
                } catch (e) {
                    console.error('Error parsing stored PDF data:', e);
                }
            }
        }
        return pdfs.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Delete PDF data
    deletePDFData(fileName) {
        const key = this.getPDFKey(fileName);
        localStorage.removeItem(key);
    }

    // Export PDF data as JSON file
    exportPDFData(fileName) {
        const data = this.loadPDFData(fileName);
        if (!data) return null;

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.sanitizeFileName(fileName)}_data.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Import PDF data from JSON file
    async importPDFData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.fileName) {
                        this.savePDFData(data.fileName, data);
                        resolve(data);
                    } else {
                        reject(new Error('Invalid JSON file format'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Save chat messages for a PDF
    saveChatMessages(fileName, messages) {
        const pdfData = this.loadPDFData(fileName) || {};
        pdfData.chatMessages = messages;
        pdfData.chatLastUpdated = Date.now();
        this.savePDFData(fileName, pdfData);
    }

    // Load chat messages for a PDF
    loadChatMessages(fileName) {
        const pdfData = this.loadPDFData(fileName);
        return pdfData?.chatMessages || [];
    }

    // Add a single chat message
    addChatMessage(fileName, message) {
        const messages = this.loadChatMessages(fileName);
        messages.push(message);
        this.saveChatMessages(fileName, messages);
    }
}

// Initialize storage manager
const storageManager = new StorageManager();

