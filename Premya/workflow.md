# CampusEase Lite - Development Workflow

## Phase 1: Project Setup & Core Infrastructure

### 1.1 Initialize Project
- [ ] Create project structure (HTML, CSS, JS files)
- [ ] Set up Tailwind CSS (CDN or build)
- [ ] Create `index.html` with three-panel layout skeleton
- [ ] Set up Gemini API key configuration (environment variable or config file)

### 1.2 Core Files Structure
```
/
├── index.html
├── styles.css (or Tailwind)
├── app.js (main application logic)
├── pdf-extractor.js (PDF.js integration)
├── gemini-api.js (API wrapper)
├── prompts.js (prompt templates)
└── components/
    ├── left-sidebar.js
    ├── center-chat.js
    └── right-sidebar.js
```

---

## Phase 2: UI Layout Implementation

### 2.1 Three-Panel Layout
- [ ] Left Sidebar: Upload button + recent PDFs list
- [ ] Center Panel: Chat interface with message bubbles
- [ ] Right Sidebar: Tabbed UI (Flashcards, Mnemonics, Mind Map, Resources)
- [ ] Apply NotebookLM-style minimal design (grey sidebar, clean chat)

### 2.2 Responsive Design
- [ ] Ensure layout works on different screen sizes
- [ ] Add collapsible sidebars if needed

---

## Phase 3: PDF Processing

### 3.1 PDF Upload & Extraction
- [ ] Integrate PDF.js library
- [ ] File input handler for PDF upload
- [ ] Extract text from all pages
- [ ] Store extracted text in memory (state management)
- [ ] Display upload status in left sidebar
- [ ] Save recent PDFs to localStorage

### 3.2 Text Processing
- [ ] Handle large PDFs (chunking if needed)
- [ ] Clean extracted text (remove excessive whitespace)

---

## Phase 4: Gemini API Integration

### 4.1 API Wrapper
- [ ] Create `gemini-api.js` with fetch calls to Gemini 2.0 Flash
- [ ] Handle API key securely
- [ ] Error handling for API failures
- [ ] Rate limiting considerations

### 4.2 Prompt Templates
- [ ] Create `prompts.js` with all prompt templates:
  - Summary prompt
  - Query answering prompt (RAG-style)
  - Flashcards prompt
  - Mnemonics prompt
  - Mind map prompt
  - Resources prompt

---

## Phase 5: Core Features Implementation

### 5.1 Auto Summary (Priority 1)
- [ ] Trigger summary generation after PDF upload
- [ ] Send extracted text to Gemini with summary prompt
- [ ] Display formatted summary in center chat as first message
- [ ] Format with headings, bullets, paragraphs

### 5.2 Query Answering (Priority 2)
- [ ] Chat input field in center panel
- [ ] Send user questions + PDF text to Gemini
- [ ] Display Q&A in chat bubbles
- [ ] Ensure answers are grounded to PDF content only

### 5.3 Flashcards Generator (Priority 3)
- [ ] Right sidebar "Flashcards" tab
- [ ] Generate 10-20 flashcards on tab click
- [ ] Display cards with front/back/difficulty
- [ ] Flip animation for cards

### 5.4 Mnemonics Generator (Priority 4)
- [ ] Right sidebar "Mnemonics" tab
- [ ] Generate mnemonics on tab click
- [ ] Display as clean list (acronyms, stories, patterns)

### 5.5 Mind Map Generator (Priority 5)
- [ ] Right sidebar "Mind Map" tab
- [ ] Generate JSON structure from Gemini
- [ ] Integrate visualization library (D3.js or simple tree view)
- [ ] Render hierarchical mind map

### 5.6 Resources Recommender (Priority 6)
- [ ] Right sidebar "Resources" tab
- [ ] Generate 3-5 YouTube videos, PDFs, links
- [ ] Display as clickable list with icons

---

## Phase 6: State Management & Data Flow

### 6.1 Application State
- [ ] Current PDF text (in-memory)
- [ ] Current summary
- [ ] Chat history
- [ ] Generated flashcards, mnemonics, mind map, resources
- [ ] Recent PDFs list (localStorage)

### 6.2 Lazy Loading
- [ ] Load AI features only when tab is clicked
- [ ] Cache generated content to avoid re-generation

---

## Phase 7: Polish & Testing

### 7.1 UI/UX Refinement
- [ ] Loading states for all AI operations
- [ ] Error messages for failed operations
- [ ] Smooth transitions and animations
- [ ] Typography and spacing adjustments

### 7.2 Testing
- [ ] Test with various PDF sizes
- [ ] Test all AI features
- [ ] Test error scenarios (invalid PDF, API failures)
- [ ] Cross-browser testing

### 7.3 Optimization
- [ ] Optimize API calls (batch if possible)
- [ ] Minimize bundle size
- [ ] Performance optimization

---

## Technology Stack Summary

- **Frontend**: HTML + Tailwind CSS + Vanilla JavaScript
- **PDF Processing**: PDF.js
- **AI**: Gemini 2.0 Flash API
- **Visualization**: D3.js (or lightweight alternative) for mind maps
- **Storage**: localStorage (for recent PDFs only)

---

## Development Order (Recommended)

1. **Setup** → Project structure + basic layout
2. **PDF Upload** → File input + PDF.js integration
3. **Summary** → First working feature (validates API integration)
4. **Chat** → Query answering (core interaction)
5. **Right Sidebar Features** → Flashcards → Mnemonics → Mind Map → Resources
6. **Polish** → UI refinement + error handling

---

## Key Considerations

- Keep it lightweight (no heavy frameworks)
- All processing client-side (except Gemini API calls)
- Single PDF at a time focus
- Clean, minimal NotebookLM-style UI
- Strict grounding to PDF content for all AI responses

