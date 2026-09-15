// PDF text extraction using PDF.js

class PDFExtractor {
    constructor() {
        // Set up PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    async extractText(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async (e) => {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                    
                    let fullText = '';
                    const totalPages = pdf.numPages;
                    
                    // Extract text from all pages
                    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items
                            .map(item => item.str)
                            .join(' ');
                        fullText += pageText + '\n\n';
                    }
                    
                    // Clean up text
                    fullText = this.cleanText(fullText);
                    
                    resolve({
                        text: fullText,
                        pageCount: totalPages,
                        fileName: file.name,
                        fileSize: file.size
                    });
                } catch (error) {
                    reject(new Error(`Failed to extract PDF text: ${error.message}`));
                }
            };
            
            fileReader.onerror = () => {
                reject(new Error('Failed to read PDF file'));
            };
            
            fileReader.readAsArrayBuffer(file);
        });
    }

    cleanText(text) {
        // Remove excessive whitespace
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
    }

    // Split text into chunks if too large
    chunkText(text, maxChunkSize = CONFIG.CHUNK_SIZE) {
        if (text.length <= maxChunkSize) {
            return [text];
        }
        
        const chunks = [];
        let currentChunk = '';
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }
}

// Initialize extractor
const pdfExtractor = new PDFExtractor();

