// Prompt templates for Gemini API

const PROMPTS = {
    summary: (pdfText) => `Summarize the following PDF content into a single, concise paragraph. Focus on the main ideas and key points. Keep it brief and professional - maximum 200 words. Do not use headings or bullet points, just write a flowing paragraph.

PDF Content:
${pdfText}`,

    query: (pdfText, question) => `You are an AI assistant helping users understand PDF content. Answer the following question using ONLY the information provided in the PDF content below. If the answer cannot be found in the provided content, say so clearly.

PDF Content:
${pdfText}

User Question: ${question}

Provide a clear, concise answer based only on the PDF content:`,

    flashcards: (pdfText) => {
        const count = (typeof CONFIG !== 'undefined' && CONFIG.FLASHCARD_COUNT) || 15;
        return `Generate ${count} flashcards based only on the following content. Return a JSON array with this exact format:
[
  {
    "front": "Question or term",
    "back": "Answer or definition",
    "difficulty": "easy|medium|hard"
  }
]

Do not include any explanations, only the JSON array.

PDF Content:
${pdfText}`;
    },

    mnemonics: (pdfText) => `Create memory-friendly mnemonics for core concepts in the following text. Include acronyms, numbers, and short stories. Return a JSON array with this format:
[
  {
    "concept": "Concept name",
    "mnemonic": "Memory aid description",
    "type": "acronym|story|pattern|rhyme"
  }
]

PDF Content:
${pdfText}`,

    mindmap: (pdfText) => `Create a JSON mind map representing hierarchical relationships between concepts in the following content. Return ONLY valid JSON in this exact format:
{
  "root": "Main Topic",
  "nodes": [
    {
      "title": "Subtopic 1",
      "children": [
        {
          "title": "Sub-subtopic 1.1",
          "children": []
        }
      ]
    },
    {
      "title": "Subtopic 2",
      "children": []
    }
  ]
}

Do not include any explanations, only the JSON object.

PDF Content:
${pdfText}`,

    resources: (pdfText) => {
        const count = (typeof CONFIG !== 'undefined' && CONFIG.RESOURCE_COUNT) || 5;
        return `Suggest high-quality external learning resources relevant to the following content. Return a JSON array with this format:
[
  {
    "title": "Resource title",
    "type": "youtube|pdf|article|website",
    "url": "https://example.com",
    "description": "Brief description"
  }
]

Suggest ${count} resources total, with a mix of YouTube videos, PDFs, and articles.

PDF Content:
${pdfText}`;
    }
};

