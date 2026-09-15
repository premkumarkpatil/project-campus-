// Center Chat Component

class CenterChat {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatForm = document.getElementById('chat-form');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.init();
    }

    init() {
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });

        // Auto-resize textarea with smart scrollbar handling and dynamic border-radius
        this.chatInput.addEventListener('input', () => {
            // Reset height to auto to get accurate scrollHeight
            this.chatInput.style.height = 'auto';
            this.chatInput.style.overflowY = 'hidden';
            
            const scrollHeight = this.chatInput.scrollHeight;
            const maxHeight = 120; // max-height in pixels
            const minHeight = 40; // min-height in pixels
            const maxBorderRadius = 9999; // rounded-full equivalent
            const minBorderRadius = 8; // small rounding when scrollbar appears
            
            let currentHeight;
            let borderRadius;
            
            if (scrollHeight <= maxHeight) {
                // Content fits within max height, no scrollbar needed
                currentHeight = Math.max(scrollHeight, minHeight);
                this.chatInput.style.height = currentHeight + 'px';
                this.chatInput.style.overflowY = 'hidden';
                
                // Calculate border-radius: full at minHeight, decreasing faster as height increases
                // Use quadratic curve for faster decrease
                const heightRange = maxHeight - minHeight;
                const currentRange = currentHeight - minHeight;
                const normalizedProgress = currentRange / heightRange; // 0 to 1
                // Quadratic curve: progress^2 makes it decrease faster
                const curvedProgress = normalizedProgress * normalizedProgress;
                const borderRadiusRange = maxBorderRadius - minBorderRadius;
                borderRadius = maxBorderRadius - (curvedProgress * borderRadiusRange);
                borderRadius = Math.max(borderRadius, minBorderRadius);
            } else {
                // Content exceeds max height, show scrollbar - almost rectangular
                currentHeight = maxHeight;
                this.chatInput.style.height = currentHeight + 'px';
                this.chatInput.style.overflowY = 'auto';
                borderRadius = minBorderRadius; // Small rounding when scrollbar appears
            }
            
            // Apply border-radius
            this.chatInput.style.borderRadius = borderRadius + 'px';
            
            // Keep send button aligned at the top
            const sendBtn = document.getElementById('send-btn');
            if (sendBtn) {
                sendBtn.style.marginTop = '2px';
            }
        });

        // Handle Enter key (send) vs Shift+Enter (new line)
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Clear chat button
        const clearChatBtn = document.getElementById('clear-chat-btn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                if (confirm('Clear all chat messages?')) {
                    this.clearMessages();
                }
            });
        }
    }

    enableChat() {
        this.chatInput.disabled = false;
        this.sendBtn.disabled = false;
    }

    disableChat() {
        this.chatInput.disabled = true;
        this.sendBtn.disabled = true;
    }

    clearMessages() {
        this.chatMessages.innerHTML = '';
        this.showEmptyState();
        
        // Clear saved messages if PDF is loaded
        if (window.currentPDFName) {
            storageManager.saveChatMessages(window.currentPDFName, []);
        }
    }

    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }

    hideEmptyState() {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    addMessage(content, isUser = false, isLoading = false, messageId = null) {
        this.hideEmptyState();
        
        // Generate message ID if not provided
        if (!messageId) {
            messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-3 w-full`;
        messageDiv.id = messageId;
        messageDiv.dataset.messageId = messageId;
        
        // Avatar for AI messages
        if (!isUser && !isLoading) {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200';
            avatarDiv.innerHTML = `
                <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
            `;
            messageDiv.appendChild(avatarDiv);
        }

        // User avatar placeholder (invisible for alignment)
        if (isUser) {
            const spacerDiv = document.createElement('div');
            spacerDiv.className = 'flex-shrink-0 w-6 h-6';
            messageDiv.appendChild(spacerDiv);
        }
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `max-w-2xl rounded-lg px-3 py-2 text-sm ${
            isUser 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-800 border border-gray-200'
        }`;
        bubbleDiv.style.wordWrap = 'break-word';
        bubbleDiv.style.overflowWrap = 'break-word';
        bubbleDiv.style.wordBreak = 'break-word';

        if (isLoading) {
            bubbleDiv.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="spinner" style="width: 14px; height: 14px; border-width: 1.5px;"></div>
                    <span class="text-xs ${isUser ? 'text-white' : 'text-gray-600'}">Thinking...</span>
                </div>
            `;
        } else {
            // Convert markdown to HTML (simple conversion)
            bubbleDiv.innerHTML = this.markdownToHTML(content);
        }

        messageDiv.appendChild(bubbleDiv);
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Save message if PDF is loaded
        if (window.currentPDFName && !isLoading) {
            const messageData = {
                id: messageId,
                content: content,
                isUser: isUser,
                timestamp: Date.now()
            };
            storageManager.addChatMessage(window.currentPDFName, messageData);
        }
        
        return messageDiv;
    }

    // Load messages from storage
    loadMessages(messages) {
        this.clearMessages();
        messages.forEach(msg => {
            // Handle special message types
            if (window.campusEaseApp) {
                if (msg.type === 'flashcards' && msg.flashcards) {
                    const flashcardDiv = window.campusEaseApp.displayFlashcardsInCenter(msg.flashcards);
                    if (flashcardDiv && msg.id) {
                        flashcardDiv.id = msg.id;
                        flashcardDiv.dataset.messageId = msg.id;
                    }
                } else if (msg.type === 'mnemonics' && msg.mnemonics) {
                    const mnemonicDiv = window.campusEaseApp.displayMnemonicsInCenter(msg.mnemonics);
                    if (mnemonicDiv && msg.id) {
                        mnemonicDiv.id = msg.id;
                        mnemonicDiv.dataset.messageId = msg.id;
                    }
                } else if (msg.type === 'resources' && msg.resources) {
                    const resourceDiv = window.campusEaseApp.displayResourcesInCenter(msg.resources);
                    if (resourceDiv && msg.id) {
                        resourceDiv.id = msg.id;
                        resourceDiv.dataset.messageId = msg.id;
                    }
                } else if (msg.type === 'mindmap' && msg.mindmap) {
                    const mindmapDiv = window.campusEaseApp.displayMindMapInCenter(msg.mindmap);
                    if (mindmapDiv && msg.id) {
                        mindmapDiv.id = msg.id;
                        mindmapDiv.dataset.messageId = msg.id;
                    }
                } else {
                    // Regular message
                    this.addMessage(msg.content, msg.isUser, false, msg.id);
                }
            } else {
                // Regular message (fallback)
                this.addMessage(msg.content, msg.isUser, false, msg.id);
            }
        });
    }

    // Scroll to a specific message by ID
    scrollToMessage(messageId) {
        const messageEl = document.getElementById(messageId);
        if (messageEl) {
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the message briefly
            messageEl.classList.add('highlight-message');
            setTimeout(() => {
                messageEl.classList.remove('highlight-message');
            }, 2000);
        }
    }

    async handleSendMessage() {
        const question = this.chatInput.value.trim();
        if (!question) return;

        // Add send animation
        this.sendBtn.classList.add('sending');
        setTimeout(() => {
            this.sendBtn.classList.remove('sending');
        }, 400);

        // Add user message
        this.addMessage(question, true);
        this.chatInput.value = '';
        // Reset textarea height and border-radius
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = '40px';
        this.chatInput.style.overflowY = 'hidden';
        this.chatInput.style.borderRadius = '9999px'; // Reset to rounded-full
        
        // Disable input while processing
        this.chatInput.disabled = true;
        this.sendBtn.disabled = true;

        // Add loading message
        const loadingMsg = this.addMessage('', false, true);

        try {
            // Emit event for app.js to handle
            const event = new CustomEvent('chatQuestion', { detail: { question } });
            document.dispatchEvent(event);
        } catch (error) {
            loadingMsg.remove();
            this.addMessage('Sorry, I encountered an error. Please try again.', false);
            this.chatInput.disabled = false;
            this.sendBtn.disabled = false;
        }
    }

    updateLoadingMessage(messageDiv, content) {
        const bubble = messageDiv.querySelector('div');
        bubble.innerHTML = this.markdownToHTML(content);
        bubble.classList.remove('bg-gray-100');
        bubble.classList.add('bg-gray-100');
    }

    markdownToHTML(text) {
        if (!text) return '';
        
        // Simple markdown to HTML converter
        let html = text;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="font-semibold text-base mt-2 mb-1">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="font-bold text-lg mt-2 mb-1">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="font-bold text-xl mt-2 mb-1">$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-2 my-1 overflow-x-auto text-xs"><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">$1</code>');
        
        // Lists
        html = html.replace(/^\* (.*$)/gim, '<li class="ml-3 list-disc mb-0.5 text-sm">$1</li>');
        html = html.replace(/^- (.*$)/gim, '<li class="ml-3 list-disc mb-0.5 text-sm">$1</li>');
        
        // Wrap consecutive list items
        html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="mb-1.5 space-y-0.5">$&</ul>');
        
        // Paragraphs - more compact
        html = html.split('\n\n').map(para => {
            if (para.trim() && !para.match(/^<[hul]/) && !para.match(/^<pre/)) {
                return `<p class="mb-1 leading-relaxed text-sm" style="word-wrap: break-word; overflow-wrap: break-word;">${para.trim()}</p>`;
            }
            return para;
        }).join('\n');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html || '<p class="mb-1 leading-relaxed text-sm" style="word-wrap: break-word; overflow-wrap: break-word;">' + text + '</p>';
    }

    scrollToBottom() {
        const container = document.getElementById('chat-container');
        container.scrollTop = container.scrollHeight;
    }
}

