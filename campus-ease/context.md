# **context.md**

## **Project Name: CampusEase Lite (NotebookLM-Style AI Summarizer)**

A minimal, web-based NotebookLM clone focused on:

* PDF ingestion
* AI-generated summaries
* Flashcards
* Mnemonics
* Mind maps
* Query answering
* External resource suggestions

The system uses **only the Gemini 2.0 Flash API**. No backend frameworks unless required. Keep everything lightweight.

---

## **Core Idea**

The app takes a PDF as input, extracts text, processes it using Gemini, and transforms it into a rich AI learning workspace. The UI and UX should closely resemble **NotebookLM** — clean, minimal, with a three-panel layout.

The flow:

1. Upload PDF
2. Extract text
3. Automatically generate a summary
4. Show summary in the *center window*
5. Right sidebar contains AI-generated tools (flashcards, mind maps, mnemonics, resources)
6. Left sidebar contains file upload and recent documents
7. Users can ask questions about the PDF content in the center chat window

---

## **Primary Features**

### **1. PDF Text Extractor**

* After upload, extract full text from PDF.
* Show file name and upload status on the left sidebar.
* Store extracted text locally in memory.
* No backend storage required.

### **2. Auto Summary Generation**

Once PDF is processed:

* Send extracted text to Gemini Flash
* Generate a clean, structured summary
* Display summary in the *center chat area* as the first message
* Include headings, bullets, and short paragraphs

### **3. Query Answering**

Center chat window acts like NotebookLM chat:

* User asks questions
* Gemini answers based only on extracted PDF content
* Use RAG-style prompt: “Use only the provided text below…”

### **4. Flashcards Generator**

Right sidebar → “Flashcards” section:

* Generate 10–20 flashcards from the PDF
* Format each as:

  * Front
  * Back
  * Difficulty (easy/medium/hard)

### **5. Mnemonics Generator**

Right sidebar → “Mnemonics”:

* Generate easy acronyms, story-based memory aids, or patterns
* Present in a clean list format

### **6. Mind Map Generator**

Right sidebar → “Mind Map”:

* Generate a hierarchical JSON structure
  Example:

  ```
  {
    "root": "Main Topic",
    "nodes": [
      { "title": "Subtopic 1", "children": [...] },
      { "title": "Subtopic 2", "children": [...] }
    ]
  }
  ```
* The frontend should visualize this using any lightweight JS library (D3.js, Cytoscape, or a simple tree view)

### **7. External Resources Recommender**

Right sidebar → “Resources”:

* Ask Gemini to suggest:

  * 3–5 YouTube videos
  * 3–5 PDF references
  * 3–5 useful links
* Should be high-quality, relevant, and credible

The app does *not* fetch real-time Google/Youtube data.
Only AI-curated recommendations.

---

## **UI Layout (Similar to NotebookLM)**

### **Left Sidebar**

* “Upload PDF” button
* List of recently uploaded PDFs (stored locally)
* Show filename + small icon
* Expandable drawer style
* Minimalistic, grey sidebar

### **Center Panel (Main Workspace)**

* AI chat area
* First message = Auto generated summary
* Subsequent messages = user queries + answers
* Simple message bubbles like NotebookLM
* Top header: “Workspace”

### **Right Sidebar**

Tabbed UI:

1. **Flashcards**
2. **Mnemonics**
3. **Mind Map**
4. **Resources**

Each tab loads AI-generated content on click.

---

## **Technical Requirements**

### **Frontend**

* HTML + Tailwind + JavaScript (or React)
* Minimal, fast, notebook-style UI
* No heavy frameworks unless necessary
* Local state only (unless storing recent PDFs)

### **AI**

* All features powered by **Gemini 2.0 Flash API**
* Prompt templates stored as clean JS files
* Strict grounding to extracted PDF text for answers

### **PDF Extraction**

* Use PDF.js or a similar JS library
* Extract plain text only
* Pass entire text (or split into chunks if large)

---

## **Prompting Rules**

### **Summary Prompt**

“Summarize the following PDF content into structured, clean sections. Use headings and bullets. Keep it concise and academic.”

### **Flashcards Prompt**

“Generate flashcards based only on the following content. Use the format: {front, back, difficulty}.”

### **Mnemonics Prompt**

“Create memory-friendly mnemonics for core concepts in the text. Include acronyms, numbers, and short stories.”

### **Mind Map Prompt**

“Create a JSON mind map representing hierarchical relationships between concepts. Do not include explanations, only nodes.”

### **Resources Prompt**

“Suggest high-quality external learning resources (YouTube videos, PDFs, articles) relevant to the topic.”

---

## **Constraints**

* No user accounts
* No database
* No backend unless required for CORS
* Single Gemini API key
* Lightweight and fast
* NotebookLM-style clean UI
* Focused on one PDF at a time

---

## **Expected Output**

A functioning browser app that:

* Takes PDF → Extracts → Summarizes
* Answers questions based on the PDF
* Generates flashcards, mnemonics, mind maps, and recommended resources
* Looks and behaves like NotebookLM’s interface

---