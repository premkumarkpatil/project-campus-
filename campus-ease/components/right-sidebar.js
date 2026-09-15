// Right Sidebar Component

class RightSidebar {
    constructor() {
        this.toolCards = document.querySelectorAll('.tool-card');
        this.quickActionBtns = document.querySelectorAll('.quick-action-btn');
        this.toolContent = document.getElementById('tool-content');
        this.currentTool = null;
        this.cachedContent = {
            flashcards: null,
            mnemonics: null,
            mindmap: null,
            resources: null
        };
        this.init();
    }

    init() {
        // Handle tool card clicks
        this.toolCards.forEach(card => {
            card.addEventListener('click', () => {
                const tool = card.dataset.tool;
                this.selectTool(tool);
            });
        });

        // Handle quick action button clicks
        this.quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.selectTool(action);
            });
        });
    }

    selectTool(toolName) {
        // Update active state on cards
        this.toolCards.forEach(card => {
            card.classList.remove('ring-2', 'ring-gray-400', 'ring-offset-1', 'bg-gray-50');
            if (card.dataset.tool === toolName) {
                card.classList.add('ring-2', 'ring-gray-400', 'ring-offset-1', 'bg-gray-50');
            }
        });

        this.currentTool = toolName;

        // Show loading in sidebar
        this.showLoading();

        // Emit event for app.js to handle generation - content will show in center
        const event = new CustomEvent('toolSelected', { detail: { tool: toolName } });
        document.dispatchEvent(event);
    }

    showLoading() {
        this.toolContent.innerHTML = `
            <div class="text-center py-8">
                <div class="spinner mx-auto mb-3"></div>
                <p class="text-gray-500 text-sm">Generating content...</p>
            </div>
        `;
    }

    clearContent() {
        // Clear content area - show nothing
        this.toolContent.innerHTML = '';
    }

    displayContent(toolName, data) {
        // Add header with tool name
        let headerHTML = '';
        const toolNames = {
            flashcards: 'AI Flashcards',
            mnemonics: 'Mnemonics',
            mindmap: 'Mind Maps',
            resources: 'Resources'
        };

        headerHTML = `
            <div class="border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800">${toolNames[toolName] || toolName}</h3>
            </div>
        `;

        let contentHTML = '';
        switch (toolName) {
            case 'flashcards':
                contentHTML = this.renderFlashcards(data);
                break;
            case 'mnemonics':
                contentHTML = this.renderMnemonics(data);
                break;
            case 'mindmap':
                contentHTML = this.renderMindMap(data);
                break;
            case 'resources':
                contentHTML = this.renderResources(data);
                break;
        }

        this.toolContent.innerHTML = headerHTML + contentHTML;
    }

    renderFlashcards(flashcards) {
        if (!Array.isArray(flashcards) || flashcards.length === 0) {
            return '<p class="text-gray-500 text-center py-12 text-sm">No flashcards generated</p>';
        }

        const html = flashcards.map((card, index) => `
            <div class="flashcard mb-4" data-index="${index}">
                <div class="flashcard-inner">
                    <div class="flashcard-front bg-white border-2 border-gray-200 shadow-sm cursor-pointer">
                        <div class="text-center p-4">
                            <p class="text-gray-600 text-xs mb-2 uppercase">Front</p>
                            <p class="text-gray-800 font-medium text-sm">${card.front}</p>
                        </div>
                    </div>
                    <div class="flashcard-back bg-blue-50 border-2 border-blue-200 shadow-sm">
                        <div class="text-center p-4">
                            <p class="text-blue-600 text-xs mb-2 uppercase">Back</p>
                            <p class="text-gray-800 text-sm mb-2">${card.back}</p>
                            <span class="inline-block px-2 py-1 text-xs rounded ${
                                card.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }">${card.difficulty}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers for flip after rendering
        setTimeout(() => {
            this.toolContent.querySelectorAll('.flashcard').forEach(card => {
                card.addEventListener('click', () => {
                    card.classList.toggle('flipped');
                });
            });
        }, 100);

        return html;
    }

    renderMnemonics(mnemonics) {
        if (!Array.isArray(mnemonics) || mnemonics.length === 0) {
            return '<p class="text-gray-500 text-center py-12 text-sm">No mnemonics generated</p>';
        }

        const html = mnemonics.map(mnemonic => `
            <div class="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                <h4 class="font-semibold text-gray-800 mb-2 text-sm">${mnemonic.concept}</h4>
                <p class="text-gray-600 text-xs mb-2">${mnemonic.mnemonic}</p>
                <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    ${mnemonic.type}
                </span>
            </div>
        `).join('');

        return html;
    }

    renderMindMap(mindMap) {
        if (!mindMap || !mindMap.root) {
            return '<p class="text-gray-500 text-center py-12 text-sm">No mind map generated</p>';
        }

        // Simple tree view
        const buildTreeHTML = (node, level = 0) => {
            const indent = level * 16;
            let html = `
                <div class="mb-1" style="margin-left: ${indent}px">
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        <span class="font-medium text-gray-800 text-sm">${node.title || node.root || 'Root'}</span>
                    </div>
                </div>
            `;

            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    html += buildTreeHTML(child, level + 1);
                });
            }

            if (node.nodes && node.nodes.length > 0) {
                node.nodes.forEach(child => {
                    html += buildTreeHTML(child, level + 1);
                });
            }

            return html;
        };

        const html = `
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h3 class="font-bold text-base mb-3 text-gray-800">${mindMap.root}</h3>
                ${buildTreeHTML(mindMap)}
            </div>
        `;

        return html;
    }

    renderResources(resources) {
        if (!Array.isArray(resources) || resources.length === 0) {
            return '<p class="text-gray-500 text-center py-12 text-sm">No resources generated</p>';
        }

        const getIcon = (type) => {
            switch (type) {
                case 'youtube': return '▶️';
                case 'pdf': return '📄';
                case 'article': return '📰';
                default: return '🔗';
            }
        };

        const html = resources.map(resource => `
            <div class="bg-white border border-gray-200 rounded-lg p-3 mb-3 hover:shadow-md transition-shadow">
                <div class="flex items-start gap-2">
                    <span class="text-xl">${getIcon(resource.type)}</span>
                    <div class="flex-1 min-w-0">
                        <a href="${resource.url}" target="_blank" class="text-blue-600 hover:underline font-medium text-sm break-words">
                            ${resource.title}
                        </a>
                        <p class="text-xs text-gray-600 mt-1">${resource.description || ''}</p>
                        <span class="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            ${resource.type}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        return html;
    }

    cacheContent(toolName, data) {
        this.cachedContent[toolName] = data;
    }

    clearCache() {
        this.cachedContent = {
            flashcards: null,
            mnemonics: null,
            mindmap: null,
            resources: null
        };
        // Reset active states
        this.toolCards.forEach(card => {
            card.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        });
        // Clear content area
        this.toolContent.innerHTML = '';
    }
}
