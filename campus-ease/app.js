// Main Application Logic

class CampusEaseApp {
    constructor() {
        this.currentPDFText = null;
        this.currentPDFName = null;
        this.summary = null;
        
        this.leftSidebar = new LeftSidebar();
        this.centerChat = new CenterChat();
        this.rightSidebar = new RightSidebar();
        
        // Set global reference for chat component and app instance
        window.currentPDFName = null;
        window.campusEaseApp = this;
        
        this.init();
    }

    init() {
        // Listen for PDF upload
        document.addEventListener('pdfUploaded', async (e) => {
            await this.handlePDFUpload(e.detail.file);
        });

        // Listen for chat questions
        document.addEventListener('chatQuestion', async (e) => {
            await this.handleChatQuestion(e.detail.question);
        });

        // Listen for tool selection (replaces tab clicks)
        document.addEventListener('toolSelected', async (e) => {
            await this.handleToolSelection(e.detail.tool);
        });

        // Listen for scroll to message requests
        document.addEventListener('scrollToMessage', (e) => {
            const messageId = e.detail.messageId;
            if (messageId) {
                this.centerChat.scrollToMessage(messageId);
            }
        });
    }

    async handlePDFUpload(file) {
        try {
            this.leftSidebar.updateUploadStatus('processing');
            
            // Check if PDF data exists in storage
            const savedData = storageManager.loadPDFData(file.name);
            
            if (savedData && savedData.text) {
                // Load from storage
                this.currentPDFText = savedData.text;
                this.currentPDFName = savedData.fileName || file.name;
                this.summary = savedData.summary;
                window.currentPDFName = this.currentPDFName;

                // Clear previous content
                this.centerChat.clearMessages();
                this.rightSidebar.clearCache();
                
                // Load cached content into sidebar
                if (savedData.flashcards) this.rightSidebar.cacheContent('flashcards', savedData.flashcards);
                if (savedData.mnemonics) this.rightSidebar.cacheContent('mnemonics', savedData.mnemonics);
                if (savedData.mindmap) this.rightSidebar.cacheContent('mindmap', savedData.mindmap);
                if (savedData.resources) this.rightSidebar.cacheContent('resources', savedData.resources);
                
                // Load saved chat messages
                const savedMessages = storageManager.loadChatMessages(this.currentPDFName);
                if (savedMessages && savedMessages.length > 0) {
                    this.centerChat.loadMessages(savedMessages);
                } else {
                    // Display summary if no messages
                    this.centerChat.addMessage(this.summary || 'PDF loaded from saved data', false);
                }
                
                this.centerChat.enableChat();
                
                // Update workspace status
                const statusEl = document.getElementById('workspace-status');
                if (statusEl) {
                    statusEl.textContent = `Active: ${file.name} (Loaded from cache)`;
                }
                
                this.leftSidebar.updateUploadStatus('complete');
                this.leftSidebar.addToRecentDocs(file.name, file.size);
                this.leftSidebar.addActivity('upload', `Loaded ${file.name} from saved data`);
                
                return;
            }
            
            // Extract text from PDF (new upload)
            const result = await pdfExtractor.extractText(file);
            this.currentPDFText = result.text;
            this.currentPDFName = result.fileName;
            window.currentPDFName = result.fileName;

            // Clear previous content
            this.centerChat.clearMessages();
            this.rightSidebar.clearCache();
            this.centerChat.disableChat();
            
            // Load saved chat messages if they exist
            const savedMessages = storageManager.loadChatMessages(this.currentPDFName);
            if (savedMessages && savedMessages.length > 0) {
                this.centerChat.loadMessages(savedMessages);
                this.centerChat.enableChat();
            }
            
            // Update workspace status
            const statusEl = document.getElementById('workspace-status');
            if (statusEl) {
                statusEl.textContent = `Processing ${file.name}...`;
            }

            // Only generate summary if not already in saved messages
            const hasSummary = savedMessages.some(msg => msg.content && msg.content.includes('Summary') && !msg.isUser);
            
            if (!hasSummary) {
                // Show loading message
                const loadingMsg = this.centerChat.addMessage('Extracting text and generating summary...', false, true);

                // Generate summary
                this.summary = await geminiAPI.generateSummary(this.currentPDFText);
                
                // Update loading message with summary
                loadingMsg.remove();
                const summaryMsgId = this.centerChat.addMessage(this.summary, false);
                
                // Save summary message ID for activity tracking
                if (summaryMsgId) {
                    this.leftSidebar.addActivity('generate', `Summary generated for ${file.name}`, { messageId: summaryMsgId.id });
                }
            } else {
                this.summary = savedMessages.find(msg => msg.content && msg.content.includes('Summary'))?.content || '';
            }
            
            // Enable chat
            this.centerChat.enableChat();
            
            // Update workspace status (reuse statusEl)
            if (statusEl) {
                statusEl.textContent = `Active: ${file.name}`;
            }
            
            // Update UI
            this.leftSidebar.updateUploadStatus('complete');
            this.leftSidebar.addToRecentDocs(file.name, file.size);
            this.leftSidebar.addActivity('generate', `Summary generated for ${file.name}`);
            
            // Save to storage
            storageManager.savePDFData(file.name, {
                text: this.currentPDFText,
                summary: this.summary,
                fileName: file.name
            });
            
            // Set global reference
            window.currentPDFName = file.name;

        } catch (error) {
            console.error('PDF processing error:', error);
            this.leftSidebar.updateUploadStatus('error');
            this.leftSidebar.addActivity('error', `Failed to process ${file.name}`);
            this.centerChat.addMessage('Failed to process PDF: ' + error.message, false);
        }
    }

    async handleChatQuestion(question) {
        if (!this.currentPDFText) {
            this.centerChat.addMessage('Please upload a PDF first.', false);
            return;
        }

        try {
            const answer = await geminiAPI.answerQuery(this.currentPDFText, question);
            
            // Remove loading message and add answer
            const messages = this.centerChat.chatMessages.querySelectorAll('.message');
            const lastMessage = messages[messages.length - 1];
            if (lastMessage) {
                lastMessage.remove();
            }
            
            this.centerChat.addMessage(answer, false);
            this.centerChat.enableChat();
            
            // Get message ID for the answer (reuse messages query)
            const allMessages = this.centerChat.chatMessages.querySelectorAll('.message');
            const answerMessage = allMessages[allMessages.length - 1];
            const messageId = answerMessage ? answerMessage.id : null;
            
            // Add activity with message reference
            this.leftSidebar.addActivity('query', `Question asked: ${question.substring(0, 30)}...`, { messageId: messageId });
        } catch (error) {
            console.error('Chat error:', error);
            const messages = this.centerChat.chatMessages.querySelectorAll('.message');
            const lastMessage = messages[messages.length - 1];
            if (lastMessage) {
                lastMessage.remove();
            }
            this.centerChat.addMessage('Sorry, I encountered an error. Please try again.', false);
            this.centerChat.enableChat();
        }
    }

    async handleToolSelection(toolName) {
        if (!this.currentPDFText) {
            this.centerChat.addMessage('Please upload a PDF first.', false);
            return;
        }

        try {
            // Check if content exists in storage
            const savedContent = storageManager.getGeneratedContent(this.currentPDFName, toolName);
            
            let data;
            let messageId = null;
            
            if (savedContent) {
                // Load from storage
                data = savedContent;
                this.leftSidebar.addActivity('generate', `${this.getToolName(toolName)} loaded from cache`);
            } else {
                // Generate new content
                const loadingMsg = this.centerChat.addMessage(`Generating ${this.getToolName(toolName)}...`, false, true);
                
                switch (toolName) {
                    case 'flashcards':
                        data = await geminiAPI.generateFlashcards(this.currentPDFText);
                        break;
                    case 'mnemonics':
                        data = await geminiAPI.generateMnemonics(this.currentPDFText);
                        break;
                    case 'mindmap':
                        data = await geminiAPI.generateMindMap(this.currentPDFText);
                        break;
                    case 'resources':
                        data = await geminiAPI.generateResources(this.currentPDFText);
                        break;
                }
                
                // Remove loading message
                loadingMsg.remove();
                
                // Save to storage
                storageManager.saveGeneratedContent(this.currentPDFName, toolName, data);
            }

            // Cache in sidebar
            this.rightSidebar.cacheContent(toolName, data);
            
            // Clear sidebar content (content shows in center only)
            this.rightSidebar.clearContent();
            
            // Display in center chat section
            const messageDiv = this.displayGeneratedContentInCenter(toolName, data);
            
            // Get message ID for activity tracking
            if (messageDiv) {
                messageId = messageDiv.id || messageDiv.dataset?.messageId;
            }
            
            // Add activity with message reference (only if not loaded from cache)
            if (!savedContent) {
                if (messageId) {
                    this.leftSidebar.addActivity('generate', `${this.getToolName(toolName)} generated`, { messageId: messageId });
                } else {
                    this.leftSidebar.addActivity('generate', `${this.getToolName(toolName)} generated`);
                }
            }
            
        } catch (error) {
            console.error('Tool content generation error:', error);
            this.centerChat.addMessage(`Failed to generate ${this.getToolName(toolName)}: ${error.message}`, false);
        }
    }

    getToolName(toolName) {
        const toolNames = {
            flashcards: 'Flashcards',
            mnemonics: 'Mnemonics',
            mindmap: 'Mind Map',
            resources: 'Resources'
        };
        return toolNames[toolName] || toolName;
    }

    displayGeneratedContentInCenter(toolName, data) {
        // Render as styled components
        if (toolName === 'flashcards' && Array.isArray(data) && data.length > 0) {
            this.displayFlashcardsInCenter(data);
            return;
        }
        
        if (toolName === 'mnemonics' && Array.isArray(data) && data.length > 0) {
            this.displayMnemonicsInCenter(data);
            return;
        }
        
        if (toolName === 'resources' && Array.isArray(data) && data.length > 0) {
            this.displayResourcesInCenter(data);
            return;
        }
        
        if (toolName === 'mindmap' && data && data.root) {
            this.displayMindMapInCenter(data);
            return;
        }
        
        // Fallback for others
        this.centerChat.addMessage(`No ${this.getToolName(toolName)} data available.`, false);
    }

    displayFlashcardsInCenter(flashcards) {
        // Create a special message container for flashcards
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message flex justify-start items-start gap-3';
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200';
        avatarDiv.innerHTML = `
            <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
        `;
        messageDiv.appendChild(avatarDiv);
        
        // Content bubble - full width for flashcards
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'flex-1 bg-white text-gray-800 border border-gray-200 rounded-md px-4 py-3 text-sm';
        bubbleDiv.style.maxWidth = '100%';
        bubbleDiv.style.minWidth = '0';
        
        // Header
        const header = document.createElement('div');
        header.className = 'mb-3 pb-2 border-b border-gray-200';
        header.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-base">📚 AI Flashcards Generated</h3>
                <span class="text-xs text-gray-500">${flashcards.length} cards</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">Click on any card to flip</p>
        `;
        bubbleDiv.appendChild(header);
        
        // Flashcards grid - two columns per row
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
        
        flashcards.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'flashcard';
            cardDiv.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-front bg-white border-2 border-gray-200 shadow-sm cursor-pointer">
                        <div class="text-center p-4 h-full flex flex-col justify-center">
                            <p class="text-gray-600 text-xs mb-2 uppercase font-medium">Front</p>
                            <p class="text-gray-800 font-medium text-sm leading-relaxed break-words">${this.escapeHtml(card.front)}</p>
                        </div>
                    </div>
                    <div class="flashcard-back bg-gray-50 border-2 border-gray-200 shadow-sm">
                        <div class="text-center p-4 h-full flex flex-col justify-center">
                            <p class="text-gray-600 text-xs mb-2 uppercase font-medium">Back</p>
                            <p class="text-gray-800 text-sm mb-2 leading-relaxed break-words">${this.escapeHtml(card.back)}</p>
                            <span class="inline-block px-2 py-0.5 text-xs rounded mt-1 bg-gray-100 text-gray-700 border border-gray-200">
                                ${card.difficulty}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            
            // Add click handler for flip
            cardDiv.addEventListener('click', () => {
                cardDiv.classList.toggle('flipped');
            });
            
            cardsContainer.appendChild(cardDiv);
        });
        
        bubbleDiv.appendChild(cardsContainer);
        messageDiv.appendChild(bubbleDiv);
        
        // Add to chat messages
        this.centerChat.chatMessages.appendChild(messageDiv);
        this.centerChat.hideEmptyState();
        this.centerChat.scrollToBottom();
        
        // Save flashcard message if PDF is loaded
        if (window.currentPDFName) {
            const messageData = {
                id: messageDiv.id,
                content: `Flashcards Generated (${flashcards.length} cards)`,
                isUser: false,
                timestamp: Date.now(),
                type: 'flashcards',
                flashcards: flashcards
            };
            storageManager.addChatMessage(window.currentPDFName, messageData);
        }
        
        return messageDiv;
    }

    displayMnemonicsInCenter(mnemonics) {
        // Create a special message container for mnemonics
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message flex justify-start items-start gap-3';
        messageDiv.id = messageId;
        messageDiv.dataset.messageId = messageId;
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200';
        avatarDiv.innerHTML = `
            <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
        `;
        messageDiv.appendChild(avatarDiv);
        
        // Content bubble
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'max-w-2xl bg-white text-gray-800 border border-gray-200 rounded-md px-3 py-2 text-sm';
        
        // Header
        const header = document.createElement('div');
        header.className = 'mb-3 pb-2 border-b border-gray-200';
        header.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-base">🧠 Mnemonics Generated</h3>
                <span class="text-xs text-gray-500">${mnemonics.length} mnemonics</span>
            </div>
        `;
        bubbleDiv.appendChild(header);
        
        // Mnemonics grid
        const mnemonicsContainer = document.createElement('div');
        mnemonicsContainer.className = 'space-y-3';
        
        mnemonics.forEach((mnemonic) => {
            const mnemonicCard = document.createElement('div');
            mnemonicCard.className = 'bg-gray-50 border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow';
            
            mnemonicCard.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <h4 class="font-semibold text-gray-900 text-sm">${this.escapeHtml(mnemonic.concept)}</h4>
                    <span class="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 border border-gray-200">
                        ${mnemonic.type}
                    </span>
                </div>
                <p class="text-gray-700 text-sm leading-relaxed">${this.escapeHtml(mnemonic.mnemonic)}</p>
            `;
            
            mnemonicsContainer.appendChild(mnemonicCard);
        });
        
        bubbleDiv.appendChild(mnemonicsContainer);
        messageDiv.appendChild(bubbleDiv);
        
        // Add to chat messages
        this.centerChat.chatMessages.appendChild(messageDiv);
        this.centerChat.hideEmptyState();
        this.centerChat.scrollToBottom();
        
        // Save mnemonic message if PDF is loaded
        if (window.currentPDFName) {
            const messageData = {
                id: messageId,
                content: `Mnemonics Generated (${mnemonics.length} mnemonics)`,
                isUser: false,
                timestamp: Date.now(),
                type: 'mnemonics',
                mnemonics: mnemonics
            };
            storageManager.addChatMessage(window.currentPDFName, messageData);
        }
        
        return messageDiv;
    }

    displayResourcesInCenter(resources) {
        // Create a special message container for resources
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message flex justify-start items-start gap-3';
        messageDiv.id = messageId;
        messageDiv.dataset.messageId = messageId;
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200';
        avatarDiv.innerHTML = `
            <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
        `;
        messageDiv.appendChild(avatarDiv);
        
        // Content bubble
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'max-w-2xl bg-white text-gray-800 border border-gray-200 rounded-md px-3 py-2 text-sm';
        
        // Header
        const header = document.createElement('div');
        header.className = 'mb-3 pb-2 border-b border-gray-200';
        header.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-base">🔗 Recommended Resources</h3>
                <span class="text-xs text-gray-500">${resources.length} resources</span>
            </div>
        `;
        bubbleDiv.appendChild(header);
        
        // Resources list
        const resourcesContainer = document.createElement('div');
        resourcesContainer.className = 'space-y-3';
        
        const getIcon = (type) => {
            switch (type) {
                case 'youtube': return '▶️';
                case 'pdf': return '📄';
                case 'article': return '📰';
                default: return '🔗';
            }
        };
        
        const getTypeColor = (type) => {
            return 'bg-gray-100 text-gray-700 border border-gray-200';
        };
        
        resources.forEach((resource) => {
            const resourceCard = document.createElement('div');
            resourceCard.className = 'bg-gray-50 border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow';
            
            resourceCard.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 bg-white rounded-md flex items-center justify-center text-xl border border-gray-200">
                        ${getIcon(resource.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <a href="${this.escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer" 
                           class="text-gray-900 hover:text-gray-700 hover:underline font-medium text-sm block mb-1">
                            ${this.escapeHtml(resource.title)}
                        </a>
                        <p class="text-gray-600 text-xs mb-2 leading-relaxed">${this.escapeHtml(resource.description || 'No description available')}</p>
                        <div class="flex items-center gap-2">
                            <span class="inline-block px-2 py-0.5 text-xs rounded ${getTypeColor(resource.type)}">
                                ${resource.type}
                            </span>
                            <a href="${this.escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer" 
                               class="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1">
                                Open link
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            
            resourcesContainer.appendChild(resourceCard);
        });
        
        bubbleDiv.appendChild(resourcesContainer);
        messageDiv.appendChild(bubbleDiv);
        
        // Add to chat messages
        this.centerChat.chatMessages.appendChild(messageDiv);
        this.centerChat.hideEmptyState();
        this.centerChat.scrollToBottom();
        
        // Save resource message if PDF is loaded
        if (window.currentPDFName) {
            const messageData = {
                id: messageId,
                content: `Resources Generated (${resources.length} resources)`,
                isUser: false,
                timestamp: Date.now(),
                type: 'resources',
                resources: resources
            };
            storageManager.addChatMessage(window.currentPDFName, messageData);
        }
        
        return messageDiv;
    }

    displayMindMapInCenter(mindMap) {
        // Create a special message container for mind map
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message flex justify-start items-start gap-3';
        messageDiv.id = messageId;
        messageDiv.dataset.messageId = messageId;
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200';
        avatarDiv.innerHTML = `
            <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
        `;
        messageDiv.appendChild(avatarDiv);
        
        // Content bubble - compact width
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'flex-1 bg-white text-gray-800 border border-gray-200 rounded-md px-3 py-2 text-sm';
        bubbleDiv.style.maxWidth = '100%';
        bubbleDiv.style.minWidth = '0';
        
        // Header
        const header = document.createElement('div');
        header.className = 'mb-2 pb-2 border-b border-gray-200';
        header.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-sm">🗺️ Mind Map Generated</h3>
                <div class="flex items-center gap-1.5">
                    <button class="mindmap-zoom-btn px-1.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors" data-action="zoom-out" title="Zoom Out">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"></path>
                        </svg>
                    </button>
                    <button class="mindmap-zoom-btn px-1.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors" data-action="zoom-in" title="Zoom In">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"></path>
                        </svg>
                    </button>
                    <button class="mindmap-zoom-btn px-1.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors" data-action="reset" title="Reset View">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        bubbleDiv.appendChild(header);
        
        // Mind map container - compact size
        const mindMapContainer = document.createElement('div');
        mindMapContainer.className = 'mindmap-container relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200';
        mindMapContainer.style.height = '400px';
        mindMapContainer.style.position = 'relative';
        mindMapContainer.style.maxWidth = '100%';
        
        // SVG container
        const svgContainer = document.createElement('div');
        svgContainer.className = 'mindmap-svg-container';
        svgContainer.style.width = '100%';
        svgContainer.style.height = '100%';
        svgContainer.style.overflow = 'hidden';
        svgContainer.style.cursor = 'grab';
        svgContainer.style.position = 'relative';
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'mindmap-svg');
        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = '100%';
        
        // Initialize zoom and pan
        let scale = 1;
        let panX = 0;
        let panY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        
        // Build mind map structure with better spacing
        const buildMindMap = (data) => {
            const nodes = [];
            const links = [];
            let nodeId = 0;
            
            // Calculate node positions with proper spacing
            const processNode = (node, parentId = null, level = 0, x = 0, y = 0) => {
                const id = nodeId++;
                const title = node.title || node.root || 'Root';
                
                const nodeObj = {
                    id,
                    title,
                    x,
                    y,
                    level,
                    children: []
                };
                
                nodes.push(nodeObj);
                
                if (parentId !== null) {
                    links.push({ source: parentId, target: id });
                }
                
                // Process children with compact, non-overlapping layout
                const children = node.children || node.nodes || [];
                if (children.length > 0) {
                    // Increased vertical spacing to account for text labels
                    const verticalSpacing = 110;
                    const horizontalSpacing = 140;
                    
                    // Calculate total height needed
                    const totalHeight = (children.length - 1) * verticalSpacing;
                    const startY = y - (totalHeight / 2);
                    
                    children.forEach((child, index) => {
                        const childX = x + horizontalSpacing;
                        const childY = startY + (index * verticalSpacing);
                        const childId = processNode(child, id, level + 1, childX, childY);
                        nodeObj.children.push(childId);
                    });
                }
                
                return id;
            };
            
            // Start from center
            processNode(data, null, 0, 0, 0);
            return { nodes, links };
        };
        
        const { nodes, links } = buildMindMap(mindMap);
        
        // Calculate bounds with padding - account for text labels
        const padding = 100;
        const textHeight = 40; // Account for text below nodes
        const maxX = Math.max(...nodes.map(n => n.x)) + padding;
        const maxY = Math.max(...nodes.map(n => n.y)) + padding + textHeight;
        const minX = Math.min(...nodes.map(n => n.x)) - padding;
        const minY = Math.min(...nodes.map(n => n.y)) - padding;
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Set viewBox to center the mind map
        svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Create group for zoom/pan
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${panX}, ${panY}) scale(${scale})`);
        
        // Store link elements for updating
        const linkElements = new Map();
        
        // Function to create curved path
        const createCurvedPath = (x1, y1, x2, y2) => {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            // Create a smooth curve using quadratic bezier
            const controlX = midX + (x2 - x1) * 0.3;
            const controlY = midY;
            return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
        };
        
        // Function to update link paths
        const updateLinks = () => {
            links.forEach(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                const pathElement = linkElements.get(`${link.source}-${link.target}`);
                
                if (source && target && pathElement) {
                    const path = createCurvedPath(source.x, source.y, target.x, target.y);
                    pathElement.setAttribute('d', path);
                }
            });
        };
        
        // Draw links - curved paths
        links.forEach(link => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            
            if (source && target) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const pathData = createCurvedPath(source.x, source.y, target.x, target.y);
                path.setAttribute('d', pathData);
                path.setAttribute('stroke', '#e2e8f0');
                path.setAttribute('stroke-width', '1.5');
                path.setAttribute('fill', 'none');
                path.setAttribute('class', 'mindmap-link');
                g.appendChild(path);
                linkElements.set(`${link.source}-${link.target}`, path);
            }
        });
        
        // Draw nodes - compact and subtle, with drag functionality
        const nodeGroups = new Map();
        let draggedNode = null;
        let dragOffset = { x: 0, y: 0 };
        
        nodes.forEach(node => {
            // Create a group for each node (circle + text)
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.setAttribute('class', 'mindmap-node');
            nodeGroup.setAttribute('data-node-id', node.id);
            nodeGroup.style.cursor = 'move';
            
            // Node circle - smaller and subtle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', node.level === 0 ? 20 : 14);
            circle.setAttribute('fill', node.level === 0 ? '#c4b5fd' : '#ddd6fe');
            circle.setAttribute('stroke', node.level === 0 ? '#8b5cf6' : '#a78bfa');
            circle.setAttribute('stroke-width', '1.5');
            circle.setAttribute('class', 'node-circle');
            nodeGroup.appendChild(circle);
            
            // Node text - improved positioning to prevent overlap
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', node.x);
            // Position text below circle with more spacing
            const textOffset = node.level === 0 ? 35 : 25;
            text.setAttribute('y', node.y + textOffset);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', node.level === 0 ? '10' : '9');
            text.setAttribute('font-weight', node.level === 0 ? '600' : '500');
            text.setAttribute('fill', '#475569');
            text.setAttribute('class', 'select-none');
            
            // Improved word wrap with better width calculation
            const words = node.title.split(' ');
            const maxWidth = node.level === 0 ? 85 : 70;
            const fontSize = node.level === 0 ? 10 : 9;
            const lines = [];
            let currentLine = '';
            
            // Create a temporary text element for measurement
            const measureText = (textStr) => {
                const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                tempText.setAttribute('font-size', fontSize);
                tempText.setAttribute('font-weight', node.level === 0 ? '600' : '500');
                const tempTspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tempTspan.textContent = textStr;
                tempText.appendChild(tempTspan);
                svg.appendChild(tempText);
                const width = tempTspan.getComputedTextLength();
                svg.removeChild(tempText);
                return width;
            };
            
            words.forEach((word) => {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const textLength = measureText(testLine);
                
                if (textLength > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) {
                lines.push(currentLine);
            }
            
            // Render text lines with proper spacing
            lines.forEach((line, index) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('x', node.x);
                tspan.setAttribute('dy', index === 0 ? '0' : '9.5');
                tspan.setAttribute('font-size', fontSize);
                tspan.textContent = line;
                text.appendChild(tspan);
            });
            
            // Add background rectangle for better readability and prevent overlap
            if (lines.length > 0) {
                const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // Calculate text bounds accurately
                const textWidths = lines.map(line => measureText(line));
                const maxTextWidth = Math.max(...textWidths);
                const textHeight = (lines.length - 1) * 9.5 + 8;
                const rectPadding = 5;
                
                const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bgRect.setAttribute('x', node.x - (maxTextWidth / 2) - rectPadding);
                bgRect.setAttribute('y', node.y + textOffset - 10);
                bgRect.setAttribute('width', maxTextWidth + (rectPadding * 2));
                bgRect.setAttribute('height', textHeight + (rectPadding * 2));
                bgRect.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
                bgRect.setAttribute('rx', '4');
                bgRect.setAttribute('stroke', 'rgba(226, 232, 240, 0.6)');
                bgRect.setAttribute('stroke-width', '0.5');
                bgRect.setAttribute('class', 'node-bg');
                textGroup.appendChild(bgRect);
                textGroup.appendChild(text);
                nodeGroup.appendChild(textGroup);
            } else {
                nodeGroup.appendChild(text);
            }
            
            // Add drag functionality to node group
            let isNodeDragging = false;
            let nodeStartX = 0;
            let nodeStartY = 0;
            
            nodeGroup.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    isNodeDragging = true;
                    draggedNode = node;
                    const rect = svgContainer.getBoundingClientRect();
                    // Convert screen coordinates to SVG coordinates accounting for zoom and pan
                    const svgX = (e.clientX - rect.left - panX) / scale;
                    const svgY = (e.clientY - rect.top - panY) / scale;
                    dragOffset.x = svgX - node.x;
                    dragOffset.y = svgY - node.y;
                    e.stopPropagation();
                    e.preventDefault();
                }
            });
            
            const handleMouseMove = (e) => {
                if (isNodeDragging && draggedNode === node) {
                    const rect = svgContainer.getBoundingClientRect();
                    // Convert screen coordinates to SVG coordinates accounting for zoom and pan
                    const svgX = (e.clientX - rect.left - panX) / scale;
                    const svgY = (e.clientY - rect.top - panY) / scale;
                    
                    const newX = svgX - dragOffset.x;
                    const newY = svgY - dragOffset.y;
                    
                    // Update node position
                    node.x = newX;
                    node.y = newY;
                    
                    // Update circle position
                    circle.setAttribute('cx', node.x);
                    circle.setAttribute('cy', node.y);
                    
                    // Update text position
                    text.setAttribute('x', node.x);
                    text.setAttribute('y', node.y + textOffset);
                    text.querySelectorAll('tspan').forEach(tspan => {
                        tspan.setAttribute('x', node.x);
                    });
                    
                    // Update background rectangle if exists
                    const bgRect = nodeGroup.querySelector('.node-bg');
                    if (bgRect) {
                        const textWidths = lines.map(line => measureText(line));
                        const maxTextWidth = Math.max(...textWidths);
                        bgRect.setAttribute('x', node.x - (maxTextWidth / 2) - 5);
                        bgRect.setAttribute('y', node.y + textOffset - 10);
                    }
                    
                    // Update all links connected to this node
                    updateLinks();
                    e.preventDefault();
                }
            };
            
            const handleMouseUp = (e) => {
                if (isNodeDragging && draggedNode === node) {
                    isNodeDragging = false;
                    draggedNode = null;
                }
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            g.appendChild(nodeGroup);
            nodeGroups.set(node.id, nodeGroup);
        });
        
        svg.appendChild(g);
        svgContainer.appendChild(svg);
        mindMapContainer.appendChild(svgContainer);
        
        // Zoom controls
        const zoomControls = header.querySelectorAll('.mindmap-zoom-btn');
        zoomControls.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                
                if (action === 'zoom-in') {
                    scale = Math.min(scale * 1.2, 2);
                } else if (action === 'zoom-out') {
                    scale = Math.max(scale / 1.2, 0.5);
                } else if (action === 'reset') {
                    scale = 1;
                    panX = 0;
                    panY = 0;
                }
                
                g.setAttribute('transform', `translate(${panX}, ${panY}) scale(${scale})`);
            });
        });
        
        // Pan functionality - only if not dragging a node
        svgContainer.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !e.target.closest('.mindmap-node') && !e.target.closest('.node-circle')) {
                isDragging = true;
                const rect = svgContainer.getBoundingClientRect();
                startX = e.clientX - panX;
                startY = e.clientY - panY;
                svgContainer.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && !draggedNode) {
                panX = e.clientX - startX;
                panY = e.clientY - startY;
                g.setAttribute('transform', `translate(${panX}, ${panY}) scale(${scale})`);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                svgContainer.style.cursor = 'grab';
            }
        });
        
        // Wheel zoom with center point
        svgContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = svgContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.5, Math.min(2, scale * delta));
            
            // Zoom towards mouse position
            const scaleChange = newScale / scale;
            panX = mouseX - (mouseX - panX) * scaleChange;
            panY = mouseY - (mouseY - panY) * scaleChange;
            scale = newScale;
            
            g.setAttribute('transform', `translate(${panX}, ${panY}) scale(${scale})`);
        });
        
        bubbleDiv.appendChild(mindMapContainer);
        messageDiv.appendChild(bubbleDiv);
        
        // Add to chat messages
        this.centerChat.chatMessages.appendChild(messageDiv);
        this.centerChat.hideEmptyState();
        this.centerChat.scrollToBottom();
        
        // Save mind map message if PDF is loaded
        if (window.currentPDFName) {
            const messageData = {
                id: messageId,
                content: `Mind Map Generated: ${mindMap.root}`,
                isUser: false,
                timestamp: Date.now(),
                type: 'mindmap',
                mindmap: mindMap
            };
            storageManager.addChatMessage(window.currentPDFName, messageData);
        }
        
        return messageDiv;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CampusEaseApp();
});

