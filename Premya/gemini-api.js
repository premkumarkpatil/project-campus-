// Gemini API wrapper

class GeminiAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = CONFIG.GEMINI_API_URL;
    }

    async generateContent(prompt, systemInstruction = null) {
        if (!this.apiKey) {
            throw new Error('Gemini API key is not set');
        }

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        if (systemInstruction) {
            requestBody.systemInstruction = {
                parts: [{
                    text: systemInstruction
                }]
            };
        }

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format from API');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    async generateSummary(pdfText) {
        const prompt = PROMPTS.summary(pdfText);
        return await this.generateContent(prompt);
    }

    async answerQuery(pdfText, question) {
        const prompt = PROMPTS.query(pdfText, question);
        return await this.generateContent(prompt);
    }

    async generateFlashcards(pdfText) {
        const prompt = PROMPTS.flashcards(pdfText);
        const response = await this.generateContent(prompt);
        // Try to extract JSON from response
        return this.parseJSONResponse(response);
    }

    async generateMnemonics(pdfText) {
        const prompt = PROMPTS.mnemonics(pdfText);
        const response = await this.generateContent(prompt);
        return this.parseJSONResponse(response);
    }

    async generateMindMap(pdfText) {
        const prompt = PROMPTS.mindmap(pdfText);
        const response = await this.generateContent(prompt);
        return this.parseJSONResponse(response);
    }

    async generateResources(pdfText) {
        const prompt = PROMPTS.resources(pdfText);
        const response = await this.generateContent(prompt);
        return this.parseJSONResponse(response);
    }

    parseJSONResponse(response) {
        if (!response) {
            throw new Error('Empty response from API');
        }
        
        // Try to extract JSON from markdown code blocks
        let jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            } catch (e) {
                console.warn('Failed to parse JSON from code block:', e);
            }
        }
        
        // Try to find JSON array
        jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn('Failed to parse JSON array:', e);
            }
        }
        
        // Try to find JSON object
        jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn('Failed to parse JSON object:', e);
            }
        }
        
        // Fallback: try parsing the entire response
        try {
            return JSON.parse(response.trim());
        } catch (e) {
            console.error('Failed to parse JSON response:', response);
            throw new Error('Failed to parse JSON response from API. Response: ' + response.substring(0, 100));
        }
    }
}

// Initialize API instance
const geminiAPI = new GeminiAPI(CONFIG.GEMINI_API_KEY);

