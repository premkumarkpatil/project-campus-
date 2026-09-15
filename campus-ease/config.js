// Configuration file for CampusEase Lite

const CONFIG = {
    // Gemini API Configuration
    GEMINI_API_KEY: 'AIzaSyB7zImB7M68zVFQtZiAl_4q1DKbX9EeNGU', // Set your API key here or via environment
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    
    // Application Settings
    MAX_PDF_SIZE: 10 * 1024 * 1024, // 10MB
    CHUNK_SIZE: 100000, // Characters per chunk for large PDFs
    
    // Feature Settings
    FLASHCARD_COUNT: 15,
    RESOURCE_COUNT: 5,
    
    // Storage Keys
    STORAGE_KEY_RECENT_DOCS: 'campusEase_recent_docs',
    STORAGE_KEY_CURRENT_PDF: 'campusEase_current_pdf'
};

// Try to get API key from environment or prompt user
if (!CONFIG.GEMINI_API_KEY) {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        CONFIG.GEMINI_API_KEY = storedKey;
    } else {
        // Prompt user for API key on first load
        const apiKey = prompt('Please enter your Gemini API key:');
        if (apiKey) {
            CONFIG.GEMINI_API_KEY = apiKey;
            localStorage.setItem('gemini_api_key', apiKey);
        }
    }
}

