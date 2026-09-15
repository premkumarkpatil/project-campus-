# CampusEase Lite - AI Summarizer

A minimal, web-based NotebookLM-style application for PDF summarization and learning tools powered by Gemini 2.0 Flash API.

## Features

- 📄 **PDF Upload & Text Extraction** - Upload PDFs and extract text automatically
- 📝 **Auto Summary Generation** - Get instant AI-generated summaries
- 💬 **Query Answering** - Ask questions about PDF content
- 🎴 **Flashcards** - Generate study flashcards with difficulty levels
- 🧠 **Mnemonics** - Create memory aids for key concepts
- 🗺️ **Mind Maps** - Visualize hierarchical relationships
- 🔗 **Resource Recommendations** - Get suggested learning resources

## Setup

1. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Configure API Key**
   - Open `config.js`
   - Set `GEMINI_API_KEY` to your API key, OR
   - The app will prompt you on first load to enter the key

3. **Run the Application**
   - Simply open `index.html` in a modern web browser
   - Or use a local server:
     ```bash
     # Python
     python -m http.server 8000
     
     # Node.js
     npx http-server
     ```
   - Navigate to `http://localhost:8000`

## Usage

1. Click **"Upload PDF"** in the left sidebar
2. Select a PDF file
3. Wait for automatic text extraction and summary generation
4. The summary appears in the center chat area
5. Ask questions about the PDF in the chat
6. Explore AI-generated tools in the right sidebar:
   - **Flashcards**: Click to flip cards
   - **Mnemonics**: View memory aids
   - **Mind Map**: See hierarchical structure
   - **Resources**: Access recommended links

## Technology Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **PDF Processing**: PDF.js
- **AI**: Gemini 2.0 Flash API
- **Storage**: localStorage (for recent documents)

## File Structure

```
/
├── index.html              # Main HTML file
├── styles.css              # Custom styles
├── app.js                  # Main application logic
├── config.js               # Configuration
├── prompts.js              # AI prompt templates
├── gemini-api.js           # Gemini API wrapper
├── pdf-extractor.js        # PDF text extraction
└── components/
    ├── left-sidebar.js     # Left sidebar component
    ├── center-chat.js      # Chat interface component
    └── right-sidebar.js    # Right sidebar component
```

## Notes

- All processing happens client-side (except API calls)
- No backend required
- Recent PDFs are stored in browser localStorage
- API key is stored in localStorage (not recommended for production)

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari

## License

MIT

