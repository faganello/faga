import { v4 as uuidv4 } from 'uuid';
import katex from 'katex';
//import * as Plotly from 'plotly.js-dist';
const katexOptions = {
    throwOnError: false,
    displayMode: true
};

class BlockEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.blockMenu = document.getElementById('block-menu');
        this.addBlockButton = document.getElementById('add-block');
        this.blocks = [];
        this.activeBlockId = null;
        this.isBlockMenuOpen = false;
        this.menuTargetBlockId = null;
        this.draggedBlock = null;
        this.dropTarget = null;
        this.formattingToolbar = this.createFormattingToolbar();
        document.body.appendChild(this.formattingToolbar);
        
        // Add selection change listener
        document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
        
        this.readingModeToggle = document.getElementById('reading-mode-toggle');
        this.readingModeToggle.addEventListener('change', this.toggleReadingMode.bind(this));
        
        // Initialize reading mode state - set to false by default
        this.isReadingMode = false;
        
        this.loadFromLocalStorage();
        this.init();
        
        // Add menu button functionality
        this.menuButton = document.getElementById('menu-button');
        this.menuDropdown = document.getElementById('menu-dropdown');
        this.menuButton.addEventListener('click', this.toggleMenu.bind(this));
        document.addEventListener('click', this.handleMenuClick.bind(this));
        
        // Add clear history functionality
        this.initializeClearHistory();
        
        // Add image upload related properties
        this.imageUploadDialog = document.getElementById('image-upload-dialog');
        this.imageInput = document.getElementById('image-input');
        this.initializeImageUpload();
        
        // Default graph code template
        this.defaultGraphCode = `
{
  data: [
    {
      x: [1, 2, 3, 4, 5],
      y: [1, 4, 9, 16, 25],
      type: 'scatter',
      mode: 'lines+markers',
      marker: {color: '#2563eb'}
    }
  ],
  layout: {
    title: 'Simple Square Function',
    xaxis: {title: 'x'},
    yaxis: {title: 'y = x²'},
    height: 400,
    width: 754
  }
}
        `;
    }
    
    init() {
        // Create an initial text block if editor is empty
        if (this.blocks.length === 0) {
            this.createBlock('paragraph');
        }
        
        // Add event listeners
        this.addBlockButton.addEventListener('click', () => this.createBlock('paragraph'));
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        this.attachBlockMenuListeners();
        
        // Add click area for empty space clicks
        this.editor.addEventListener('click', (e) => {
            // Only handle clicks directly on the editor, not on blocks
            if (e.target === this.editor || e.target.classList.contains('editor-click-area')) {
                this.createBlock('paragraph');
            }
        });
        
        // Add drag and drop event listeners
        this.editor.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.editor.addEventListener('dragover', this.handleDragOver.bind(this));
        this.editor.addEventListener('dragenter', this.handleDragEnter.bind(this));
        this.editor.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.editor.addEventListener('drop', this.handleDrop.bind(this));
        this.editor.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // Render initial state
        this.render();
    }
    
    handleDocumentClick(e) {
        // Close block menu when clicking outside
        if (this.isBlockMenuOpen && !this.blockMenu.contains(e.target)) {
            this.closeBlockMenu();
        }
    }
    
    attachBlockMenuListeners() {
        const menuItems = document.querySelectorAll('.block-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const blockType = e.currentTarget.dataset.type;
                if (blockType === 'image') {
                    this.showImageUploadDialog();
                } else {
                    if (this.menuTargetBlockId) {
                        this.updateBlockType(this.menuTargetBlockId, blockType);
                    } else {
                        this.createBlock(blockType);
                    }
                }
                this.closeBlockMenu();
            });
        });
    }
    
    createBlock(type, position = null) {
        const id = uuidv4();
        const block = {
            id,
            type,
            content: '',
            checked: false, // for todo blocks
            alignment: null, // Added alignment property
            width: null, // Added width property
            isEditing: false // Added isEditing property
        };
        
        if (position === null) {
            // Append to the end
            this.blocks.push(block);
        } else {
            // Insert at specific position
            this.blocks.splice(position, 0, block);
        }
        
        this.render();
        // Focus the new block after rendering
        setTimeout(() => {
            const blockElement = document.getElementById(`block-${id}`);
            if (blockElement) {
                const contentElement = blockElement.querySelector('.block-content');
                contentElement.focus();
            }
        }, 0);
        
        return id;
    }
    
    updateBlockType(blockId, newType) {
        const block = this.blocks.find(b => b.id === blockId);
        if (block) {
            block.type = newType;
            this.render();
            
            // Add focus handling after render
            setTimeout(() => {
                const blockElement = document.getElementById(`block-${blockId}`);
                if (blockElement) {
                    const contentElement = blockElement.querySelector('.block-content');
                    if (contentElement) {
                        contentElement.focus();
                        
                        // Place cursor at the end of the content
                        const range = document.createRange();
                        const selection = window.getSelection();
                        
                        if (contentElement.lastChild && contentElement.lastChild.nodeType === Node.TEXT_NODE) {
                            range.setStart(contentElement.lastChild, contentElement.lastChild.length);
                        } else {
                            range.setStart(contentElement, contentElement.childNodes.length);
                        }
                        
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        
                        // Add focused class
                        blockElement.classList.add('is-focused');
                    }
                }
            }, 0);
        }
    }
    
    updateBlockContent(blockId, content) {
        const block = this.blocks.find(b => b.id === blockId);
        if (block) {
            block.content = content;
            this.saveToLocalStorage();
        }
    }
    
    updateBlockChecked(blockId, checked) {
        const block = this.blocks.find(b => b.id === blockId);
        if (block && block.type === 'todo') {
            block.checked = checked;
            this.render();
        }
    }
    
    deleteBlock(blockId) {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index !== -1) {
            this.blocks.splice(index, 1);
            
            // Create a default block if all blocks are deleted
            if (this.blocks.length === 0) {
                this.createBlock('paragraph');
            } else {
                this.render();
                
                // Focus the previous or next block
                const newFocusIndex = Math.min(index, this.blocks.length - 1);
                if (newFocusIndex >= 0 && newFocusIndex < this.blocks.length) {
                    const blockToFocus = document.getElementById(`block-${this.blocks[newFocusIndex].id}`);
                    if (blockToFocus) {
                        const contentElement = blockToFocus.querySelector('.block-content');
                        if (contentElement) {
                            contentElement.focus();
                        }
                    }
                }
            }
            
            // Save changes to localStorage
            this.saveToLocalStorage();
        }
    }
    
    moveBlock(blockId, direction) {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index === -1) return;
        
        if (direction === 'up' && index > 0) {
            // Swap with the previous block
            [this.blocks[index - 1], this.blocks[index]] = [this.blocks[index], this.blocks[index - 1]];
            this.render();
            
            // Focus the moved block
            const blockElement = document.getElementById(`block-${blockId}`);
            if (blockElement) {
                const contentElement = blockElement.querySelector('.block-content');
                contentElement.focus();
            }
        } else if (direction === 'down' && index < this.blocks.length - 1) {
            // Swap with the next block
            [this.blocks[index], this.blocks[index + 1]] = [this.blocks[index + 1], this.blocks[index]];
            this.render();
            
            // Focus the moved block
            const blockElement = document.getElementById(`block-${blockId}`);
            if (blockElement) {
                const contentElement = blockElement.querySelector('.block-content');
                contentElement.focus();
            }
        }
    }
    
    openBlockMenu(blockId, x, y) {
        this.menuTargetBlockId = blockId;
        this.blockMenu.style.display = 'block';
        
        // Get the block element
        const blockElement = document.getElementById(`block-${blockId}`);
        const blockRect = blockElement.getBoundingClientRect();
        
        // Position the menu next to the block's left side and vertically centered
        const menuRect = this.blockMenu.getBoundingClientRect();
        const editorRect = this.editor.getBoundingClientRect();
        
        // Calculate initial position (left side of block, vertically centered)
        let left = blockRect.left - menuRect.width - 10; // 10px gap
        let top = blockRect.top + (blockRect.height - menuRect.height) / 2;
        
        // If menu would go off screen to the left, position it to the right of the block
        if (left < 0) {
            left = blockRect.right + 10;
        }
        
        // Ensure menu doesn't go off screen vertically
        const maxTop = window.innerHeight - menuRect.height;
        top = Math.max(0, Math.min(top, maxTop));
        
        // Apply the position
        this.blockMenu.style.left = `${left}px`;
        this.blockMenu.style.top = `${top}px`;
        
        this.isBlockMenuOpen = true;
    }
    
    closeBlockMenu() {
        this.blockMenu.style.display = 'none';
        this.isBlockMenuOpen = false;
        this.menuTargetBlockId = null;
    }
    
    render() {
        this.editor.innerHTML = '';
        
        if (this.blocks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-editor';
            emptyState.textContent = 'Click + to add a block';
            this.editor.appendChild(emptyState);
            return;
        }
        
        this.blocks.forEach(block => {
            const blockElement = this.createBlockElement(block);
            this.editor.appendChild(blockElement);
        });

        // Add click area at the bottom
        if (!this.isReadingMode) {
            const clickArea = document.createElement('div');
            clickArea.className = 'editor-click-area';
            this.editor.appendChild(clickArea);
        }
    }
    
    createBlockElement(block) {
        const blockElement = document.createElement('div');
        blockElement.className = `block block-${block.type}`;
        blockElement.id = `block-${block.id}`;
        blockElement.dataset.id = block.id;
        blockElement.draggable = true;
        
        const handle = document.createElement('div');
        handle.className = 'block-handle';
        handle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
            </svg>
        `;
        blockElement.appendChild(handle);
        
        switch (block.type) {
            case 'paragraph':
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                this.createTextBlock(blockElement, block);
                break;
            case 'bullet-list':
            case 'numbered-list':
                this.createListBlock(blockElement, block);
                break;
            case 'quote':
                this.createQuoteBlock(blockElement, block);
                break;
            case 'todo':
                this.createTodoBlock(blockElement, block);
                break;
            case 'divider':
                this.createDividerBlock(blockElement);
                break;
            case 'image':
                this.createImageBlockElement(blockElement, block);
                break;
            case 'equation':
                this.createEquationBlock(blockElement, block);
                break;
            case 'graph':
                this.createGraphBlock(blockElement, block);
                break;
        }
        
        return blockElement;
    }
    
    createTextBlock(blockElement, block) {
        const content = document.createElement('div');
        content.className = 'block-content';
        content.contentEditable = !this.isReadingMode;
        content.innerHTML = block.content;
        
        // Add click handler for links
        content.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && this.isReadingMode) {
                e.preventDefault();
                e.stopPropagation(); // Prevent document click from immediately closing it
                window.open(e.target.href, '_blank', 'noopener,noreferrer');
            }
        });
        
        this.addContentEventListeners(content, block.id);
        blockElement.appendChild(content);
    }
    
    createListBlock(blockElement, block) {
        const content = document.createElement('div');
        content.className = 'block-content block-list-item';
        content.contentEditable = true;
        content.innerHTML = block.content;
        this.addContentEventListeners(content, block.id);
        blockElement.appendChild(content);
    }
    
    createTodoBlock(blockElement, block) {
        const wrapper = document.createElement('div');
        wrapper.className = 'block-todo-item';
        
        const checkbox = document.createElement('div');
        checkbox.className = `block-todo-checkbox ${block.checked ? 'checked' : ''}`;
        checkbox.addEventListener('click', () => {
            this.updateBlockChecked(block.id, !block.checked);
        });
        
        const content = document.createElement('div');
        content.className = `block-content block-todo-content ${block.checked ? 'checked' : ''}`;
        content.contentEditable = true;
        content.innerHTML = block.content;
        this.addContentEventListeners(content, block.id);
        
        wrapper.appendChild(checkbox);
        wrapper.appendChild(content);
        blockElement.appendChild(wrapper);
    }
    
    createQuoteBlock(blockElement, block) {
        const content = document.createElement('div');
        content.className = 'block-content';
        content.contentEditable = true;
        content.innerHTML = block.content;
        this.addContentEventListeners(content, block.id);
        blockElement.appendChild(content);
    }
    
    createDividerBlock(blockElement) {
        blockElement.className += ' block-divider-container';
        
        const divider = document.createElement('div');
        divider.className = 'block-divider';
        blockElement.appendChild(divider);
        
        // Create a focusable div that's visible in edit mode
        const focusableDiv = document.createElement('div');
        focusableDiv.className = 'block-content divider-focus';
        focusableDiv.contentEditable = true;
        focusableDiv.setAttribute('tabindex', '0'); // Makes it focusable
        this.addContentEventListeners(focusableDiv, blockElement.dataset.id);
        blockElement.appendChild(focusableDiv);
    }
    
    createImageBlockElement(blockElement, block) {
        const content = document.createElement('div');
        content.className = `block-content block-image ${block.alignment ? 'align-' + block.alignment : 'align-center'}`;
        content.contentEditable = false;
        
        // Make the content focusable
        content.tabIndex = 0;
        
        // Add keydown event listener for image deletion
        content.addEventListener('keydown', (e) => {
            this.handleKeyDown(e, block.id, content);
        });
        
        const img = document.createElement('img');
        img.src = block.content;
        img.alt = 'Uploaded image';
        
        // Set initial width if it exists in the block data
        if (block.width) {
            img.style.width = block.width + '%';
        }
        
        // Add image controls
        const controls = document.createElement('div');
        controls.className = 'image-controls';
        
        // Resize control
        const resizeControl = document.createElement('div');
        resizeControl.className = 'resize-control';
        
        const slider = document.createElement('div');
        slider.className = 'resize-slider';
        
        const handle = document.createElement('div');
        handle.className = 'resize-slider-handle';
        
        const value = document.createElement('div');
        value.className = 'resize-value';
        
        // Set initial slider position
        const initialWidth = block.width || 100;
        handle.style.left = initialWidth + '%';
        value.textContent = Math.round(initialWidth) + '%';
        
        // Add alignment controls
        const alignControls = document.createElement('div');
        alignControls.className = 'align-controls';
        
        const alignments = [
            { value: 'left', icon: 'format_align_left' },
            { value: 'center', icon: 'format_align_center' },
            { value: 'right', icon: 'format_align_right' }
        ];
        
        alignments.forEach(({value, icon}) => {
            const button = document.createElement('button');
            button.className = `align-button ${block.alignment === value ? 'active' : ''}`;
            button.innerHTML = `<span class="material-icons">${icon}</span>`;
            button.addEventListener('click', () => {
                block.alignment = value;
                content.className = `block-content block-image align-${value}`;
                alignControls.querySelectorAll('.align-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                this.saveToLocalStorage();
            });
            alignControls.appendChild(button);
        });
        
        // Add slider functionality
        let isDragging = false;
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            handle.classList.add('dragging');
            document.addEventListener('mousemove', updateSize);
            document.addEventListener('mouseup', stopDragging);
            e.preventDefault();
        });

        const updateSize = (e) => {
            if (!isDragging) return;
            
            const rect = slider.getBoundingClientRect();
            let percentage = ((e.clientX - rect.left) / rect.width) * 100;
            percentage = Math.max(10, Math.min(100, percentage));
            
            handle.style.left = percentage + '%';
            value.textContent = Math.round(percentage) + '%';
            img.style.width = percentage + '%';
            
            block.width = percentage;
            this.saveToLocalStorage();
        };

        const stopDragging = () => {
            isDragging = false;
            handle.classList.remove('dragging');
            document.removeEventListener('mousemove', updateSize);
            document.removeEventListener('mouseup', stopDragging);
        };
        
        slider.appendChild(handle);
        resizeControl.appendChild(slider);
        resizeControl.appendChild(value);
        
        controls.appendChild(resizeControl);
        controls.appendChild(alignControls);
        
        // Add delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-image-button';
        deleteButton.innerHTML = `
            <span class="material-icons">delete</span>
            Delete
        `;
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteBlock(block.id);
        });
        controls.appendChild(deleteButton);

        // Add click handler for image selection
        img.addEventListener('click', (e) => {
            if (this.isReadingMode) {
                window.open(block.content, '_blank');
            } else {
                e.stopPropagation();
                content.classList.toggle('selected');
            }
        });
        
        // Click outside to deselect
        document.addEventListener('click', (e) => {
            if (!content.contains(e.target)) {
                content.classList.remove('selected');
            }
        });
        
        content.appendChild(controls);
        content.appendChild(img);
        blockElement.appendChild(content);
    }
    
    createEquationBlock(blockElement, block) {
        const editorDiv = document.createElement('div');
        editorDiv.className = 'equation-editor';
        editorDiv.contentEditable = true;
      
        // Definir o conteúdo inicial no editor
        const initialContent = block.content || '\\text{Insira sua fórmula mágica aqui...}';

        // Definir o conteúdo no editor
        editorDiv.textContent = initialContent;

      
        
        // Only make editor active by default for completely new blocks (no ID yet)
        // This way, existing equation blocks won't have their mode changed when adding new blocks
        const isNewBlock = !block.id || !this.blocks.some(b => b.id === block.id);
        if ((!block.content && isNewBlock) || block.isEditing) {
            editorDiv.classList.add('active');
        }

        const viewerDiv = document.createElement('div');
        viewerDiv.className = 'equation-viewer';
        
        // Hide viewer for new blocks or blocks in editing mode
        if ((!block.content && isNewBlock) || block.isEditing) {
            viewerDiv.style.display = 'none';
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'equation-error';

        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'equation-toggle';
        
        // Set initial button state based on whether editor is active
        if ((!block.content && isNewBlock) || block.isEditing) {
            toggleButton.innerHTML = '<span class="material-icons">check</span>';
        } else {
            toggleButton.innerHTML = '<span class="material-icons">edit</span>';
        }

        // Handle toggle button click
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (editorDiv.classList.contains('active')) {
                // Save the editing state in the block data
                block.isEditing = false;
                // Switch to viewer
                editorDiv.classList.remove('active');
                viewerDiv.style.display = 'block';
                toggleButton.innerHTML = '<span class="material-icons">edit</span>';
            } else {
                // Save the editing state in the block data
                block.isEditing = true;
                // Switch to editor
                editorDiv.classList.add('active');
                viewerDiv.style.display = 'none';
                toggleButton.innerHTML = '<span class="material-icons">check</span>';
                editorDiv.focus();
            }
            
            // Save state to localStorage
            this.saveToLocalStorage();
        });

        // Render initial content if exists
        if (initialContent) {
            try {
                katex.render(initialContent, viewerDiv, katexOptions);
            } catch (e) {
                errorDiv.textContent = e.message;
                errorDiv.classList.add('active');
            }
        }

        // Handle editor focus
        editorDiv.addEventListener('focus', () => {
            blockElement.classList.add('is-focused');
        });

        // Handle editor blur
        editorDiv.addEventListener('blur', () => {
            blockElement.classList.remove('is-focused');
        });

        // Handle editor input
        editorDiv.addEventListener('input', (e) => {
            const equation = e.target.textContent;
            this.updateBlockContent(block.id, equation);

            try {
                katex.render(equation, viewerDiv, katexOptions);
                errorDiv.classList.remove('active');
            } catch (e) {
                errorDiv.textContent = e.message;
                errorDiv.classList.add('active');
            }
        });

        // Handle viewer click
        viewerDiv.addEventListener('click', (e) => {
            if (this.isReadingMode) return;

            // Toggle selected state
            viewerDiv.classList.toggle('selected');
            
            // If selected, add keyboard listener for deletion
            if (viewerDiv.classList.contains('selected')) {
                const handleKeyDown = (e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.preventDefault();
                        this.deleteBlock(block.id);
                        // Remove event listener immediately after deletion
                        document.removeEventListener('keydown', handleKeyDown);
                    }
                };
                document.addEventListener('keydown', handleKeyDown);
                
                // Remove listener when clicking outside
                const handleClickOutside = (e) => {
                    if (!viewerDiv.contains(e.target) && viewerDiv.isConnected) {
                        viewerDiv.classList.remove('selected');
                        document.removeEventListener('keydown', handleKeyDown);
                        document.removeEventListener('click', handleClickOutside);
                    }
                };
                document.addEventListener('click', handleClickOutside);
            }
        });

        const equationContainer = document.createElement('div');
        equationContainer.className = 'block-equation';
        equationContainer.appendChild(toggleButton);
        equationContainer.appendChild(editorDiv);
        equationContainer.appendChild(viewerDiv);
        equationContainer.appendChild(errorDiv);

        blockElement.appendChild(equationContainer);
    }
    
    createGraphBlock(blockElement, block) {
        const graphContainer = document.createElement('div');
        graphContainer.className = 'block-graph';
        
        // Initialize or set default content if none exists
        if (!block.content) {
            block.content = this.defaultGraphCode;
        }
        
        // Create the editor component
        const editor = document.createElement('div');
        editor.className = 'graph-editor';
        
        const codeEditor = document.createElement('textarea');
        codeEditor.className = 'graph-code-editor';
        codeEditor.value = block.content;
        codeEditor.spellcheck = false;
        
        // Create the display component
        const viewer = document.createElement('div');
        viewer.className = 'graph-viewer';
        
        // Add the placeholder for the Plotly graph
        const plotDiv = document.createElement('div');
        plotDiv.className = 'plot-container';
        viewer.appendChild(plotDiv);
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'graph-toggle';
        
        // Set initial mode based on isEditing property and reading mode
        if (block.isEditing === undefined) {
            block.isEditing = true; // Default to editing mode for new blocks
        }
        
        // Force view mode when in reading mode
        if (this.isReadingMode) {
            block.isEditing = false;
        }
        
        // Initialize the toggle button state
        if (block.isEditing) {
            toggleButton.innerHTML = '<span class="material-icons">visibility</span>';
            toggleButton.title = 'View Graph';
            editor.style.display = 'block';
            viewer.style.display = 'none';
        } else {
            toggleButton.innerHTML = '<span class="material-icons">edit</span>';
            toggleButton.title = 'Edit Code';
            editor.style.display = 'none';
            viewer.style.display = 'block';
            
            // Render the graph in view mode
            try {
                const graphData = eval(`(${block.content})`);
                if (graphData && graphData.data && graphData.layout) {
                    Plotly.newPlot(plotDiv, graphData.data, graphData.layout, {responsive: true, displayModeBar: false,});
                } else {
                    plotDiv.innerHTML = `<div class="graph-error">Error: Graph data must contain 'data' and 'layout' properties</div>`;
                }
            } catch (e) {
                plotDiv.innerHTML = `<div class="graph-error">Error rendering graph: ${e.message}</div>`;
            }
        }
        
        // Add click handler for graph selection in view mode
        viewer.addEventListener('click', (e) => {
            if (this.isReadingMode) return;
            if (block.isEditing) return;
            
            // Toggle selected state
            viewer.classList.toggle('selected');
            
            // If selected, add keyboard listener for deletion
            if (viewer.classList.contains('selected')) {
                const handleKeyDown = (e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.preventDefault();
                        this.deleteBlock(block.id);
                        // Remove event listener immediately after deletion
                        document.removeEventListener('keydown', handleKeyDown);
                    }
                };
                document.addEventListener('keydown', handleKeyDown);
                
                // Remove listener when clicking outside
                const handleClickOutside = (e) => {
                    if (!viewer.contains(e.target) && viewer.isConnected) {
                        viewer.classList.remove('selected');
                        document.removeEventListener('keydown', handleKeyDown);
                        document.removeEventListener('click', handleClickOutside);
                    }
                };
                document.addEventListener('click', handleClickOutside);
            }
        });
        
        // Add help button with question mark icon
        const helpButton = document.createElement('button');
        helpButton.className = 'graph-help-button';
        helpButton.innerHTML = '?';
        helpButton.title = 'Graph Instructions';
        
        // Create help popup
        const helpPopup = document.createElement('div');
        helpPopup.className = 'graph-help-popup';
        helpPopup.innerHTML = `
<button class="graph-help-close">×</button>
<h4>Como criar um gráfico</h4>
<p>Insira um objeto JavaScript com as propriedades <code>data</code> e <code>layout</code>:</p>

<div class="code-container">
    <code id="graph-example">{
  data: [
    {
      x: [1, 2, 3, 4, 5],
      y: [1, 4, 9, 16, 25],
      type: 'scatter',
      mode: 'lines+markers',
      marker: {color: '#2563eb'}
    }
  ],
  layout: {
    title: 'Meu Gráfico',
    xaxis: {title: 'Eixo X'},
    yaxis: {title: 'Eixo Y'}
  }
}</code>
    <button id="copy-graph-example">Copiar Exemplo</button>
</div>

<p class="warning">
    <b>Aviso:</b> As dimensões padrão do gráfico no editor são <b>largura 400px</b> e <b>altura 754px</b>. Você pode ajustar essas dimensões diretamente no objeto <code>layout</code>, mas lembre-se que ao editar as dimensões, o gráfico pode perder a responsividade.
</p>

<h4>Tipos de gráficos</h4>
<p>Scatter, bar, pie, heatmap, histogram, box, entre outros.</p>
<p>Consulte a <a href="https://plotly.com/javascript/" target="_blank" rel="noopener noreferrer">documentação do Plotly</a> para mais exemplos.</p>

<p><b>Dicas Adicionais:</b></p>
<ul>
    <li>Para gráficos responsivos, evite definir dimensões fixas (width e height) no objeto <code>layout</code>.</li>
    <li>Você pode personalizar cores, estilos e outros aspectos do gráfico modificando as propriedades dentro dos objetos <code>data</code> e <code>layout</code>.</li>
    <li>Para uma melhor visualização dos dados, experimente diferentes tipos de gráficos e veja qual se adapta melhor à sua necessidade.</li>
</ul>

<script>
  document.getElementById('copy-graph-example').addEventListener('click', function() {
    const code = document.getElementById('graph-example').textContent;
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('Exemplo copiado para a área de transferência!');
      })
      .catch(err => {
        console.error('Falha ao copiar: ', err);
        alert('Falha ao copiar o exemplo. Verifique o console do navegador.');
      });
  });
</script>

<style>
  .code-container {
    position: relative;
    margin-bottom: 10px;
  }

  #graph-example {
    display: block;
    padding: 10px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-word;
  }

  #copy-graph-example {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 5px 10px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 12px;
    cursor: pointer;
    border-radius: 3px;
  }

  #copy-graph-example:hover {
    background-color: #3e8e41;
  }

  .warning {
    color: orange;
    font-style: italic;
  }
</style>
        `;
        
        // Add event listeners for help button and close button
        helpButton.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('visible');
        });
        
        helpPopup.querySelector('.graph-help-close').addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.remove('visible');
        });
        
        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpButton) {
                helpPopup.classList.remove('visible');
            }
        });
        
        // Handle toggle button click
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            block.isEditing = !block.isEditing;
            
            if (block.isEditing) {
                // Switch to edit mode
                toggleButton.innerHTML = '<span class="material-icons">visibility</span>';
                toggleButton.title = 'View Graph';
                editor.style.display = 'block';
                viewer.style.display = 'none';
                codeEditor.focus();
            } else {
                // Switch to view mode and render graph
                toggleButton.innerHTML = '<span class="material-icons">edit</span>';
                toggleButton.title = 'Edit Code';
                editor.style.display = 'none';
                viewer.style.display = 'block';
                
                // Update the block content
                block.content = codeEditor.value;
                this.saveToLocalStorage();
                
                // Render the graph
                try {
                    const graphData = eval(`(${block.content})`);
                    if (graphData && graphData.data && graphData.layout) {
                        Plotly.newPlot(plotDiv, graphData.data, graphData.layout, {responsive: true, displayModeBar: false,});
                    } else {
                        plotDiv.innerHTML = `<div class="graph-error">Error: Graph data must contain 'data' and 'layout' properties</div>`;
                    }
                } catch (e) {
                    plotDiv.innerHTML = `<div class="graph-error">Error rendering graph: ${e.message}</div>`;
                }
            }
        });
        
        // Handle code editor changes
        codeEditor.addEventListener('input', (e) => {
            this.updateBlockContent(block.id, e.target.value);
        });
        
        // Modified keydown handler for the code editor
        codeEditor.addEventListener('keydown', (e) => {
            // Handle tab key for indentation
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = codeEditor.selectionStart;
                const end = codeEditor.selectionEnd;
                codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
                codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
                return;
            }
            
            // Only use our custom handler for specific keys we want to capture
            // Don't interfere with normal keyboard operation for typing, newlines, etc.
            if (e.key === 'Delete' && codeEditor.value === '' && this.blocks.length > 1) {
                // Only handle the delete key when the editor is empty and there are other blocks
                e.preventDefault();
                this.deleteBlock(block.id);
            } else if (e.ctrlKey && e.key === 'ArrowUp') {
                // Move block up with ctrl+up
                e.preventDefault();
                this.moveBlock(block.id, 'up');
            } else if (e.ctrlKey && e.key === 'ArrowDown') {
                // Move block down with ctrl+down
                e.preventDefault();
                this.moveBlock(block.id, 'down');
            }
            // Let other keys function normally (Enter, Backspace, arrow keys, etc.)
        });
        
        editor.appendChild(codeEditor);
        graphContainer.appendChild(toggleButton);
        graphContainer.appendChild(editor);
        graphContainer.appendChild(viewer);
        graphContainer.appendChild(helpButton);
        graphContainer.appendChild(helpPopup);
        
        blockElement.appendChild(graphContainer);
    }
    
    addContentEventListeners(contentElement, blockId) {
        contentElement.addEventListener('input', (e) => {
            this.updateBlockContent(blockId, e.target.innerHTML);
        });
        
        contentElement.addEventListener('focus', () => {
            this.activeBlockId = blockId;
            document.querySelectorAll('.block').forEach(block => {
                block.classList.remove('is-focused');
            });
            document.getElementById(`block-${blockId}`).classList.add('is-focused');
        });
        
        // Add blur event listener
        contentElement.addEventListener('blur', (e) => {
            // Check if the new focus target is within the same block
            const currentBlock = document.getElementById(`block-${blockId}`);
            const relatedTarget = e.relatedTarget;
            
            if (!relatedTarget || !currentBlock.contains(relatedTarget)) {
                currentBlock.classList.remove('is-focused');
            }
        });
        
        contentElement.addEventListener('keydown', (e) => {
            this.handleKeyDown(e, blockId, contentElement);
        });
        
        contentElement.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        break;
                }
            }
        });
    }
    
    handleKeyDown(e, blockId, contentElement) {
        // Handle backspace key for image deletion when selected
        if (e.key === 'Backspace') {
            const block = this.blocks.find(b => b.id === blockId);
            if (block && block.type === 'image') {
                const imageContent = contentElement.closest('.block-image');
                if (imageContent && imageContent.classList.contains('selected')) {
                    e.preventDefault();
                    this.deleteBlock(blockId);
                    return;
                }
            }
        }
        
        if (e.key === '/' && (contentElement.innerHTML === '' || contentElement.innerHTML === '<br>')) {
            const block = this.blocks.find(b => b.id === blockId);
            if (block && block.type !== 'equation') { 
                e.preventDefault();
                const rect = contentElement.getBoundingClientRect();
                this.openBlockMenu(blockId, rect.left, rect.bottom);
                return;
            }
        }
        
        // Handle backspace key for line deletion
        if (e.key === 'Backspace') {
            const currentIndex = this.blocks.findIndex(b => b.id === blockId);
            
            // If at start of block and there's content
            if (window.getSelection().anchorOffset === 0 && currentIndex > 0) {
                e.preventDefault();
                
                // Get the current and previous blocks
                const currentBlock = this.blocks[currentIndex];
                const previousBlock = this.blocks[currentIndex - 1];
                const previousBlockElement = document.getElementById(`block-${previousBlock.id}`);
                const previousContentElement = previousBlockElement.querySelector('.block-content');
                
                // Store the current content
                const currentContent = contentElement.innerHTML;
                
                // If current block has content, append it to previous block
                if (currentContent.trim()) {
                    const previousContent = previousContentElement.innerHTML;
                    previousBlock.content = previousContent + currentContent;
                }
                
                // Delete the current block
                this.blocks.splice(currentIndex, 1);
                
                // Render and focus on previous block
                this.render();
                
                setTimeout(() => {
                    const prevBlockEl = document.getElementById(`block-${previousBlock.id}`);
                    if (prevBlockEl) {
                        const prevContentEl = prevBlockEl.querySelector('.block-content');
                        prevContentEl.focus();
                        
                        // Place cursor at the merger point
                        const selection = window.getSelection();
                        const range = document.createRange();
                        if (prevContentEl.lastChild) {
                            if (prevContentEl.lastChild.nodeType === Node.TEXT_NODE) {
                                range.setStart(prevContentEl.lastChild, prevContentEl.lastChild.length);
                            } else {
                                range.setStartAfter(prevContentEl.lastChild);
                            }
                        } else {
                            range.setStart(prevContentEl, 0);
                        }
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }, 0);
                
                return;
            }
            
            // Handle empty block deletion
            if (contentElement.innerHTML === '') {
                if (this.blocks.length > 1) {
                    e.preventDefault();
                    this.deleteBlock(blockId);
                }
                return;
            }
        }
        
        // Handle Enter key
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            
            const currentIndex = this.blocks.findIndex(b => b.id === blockId);
            if (currentIndex !== -1) {
                const currentBlock = this.blocks[currentIndex];
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                // Get HTML content instead of plain text
                const content = contentElement.innerHTML;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                
                // Create a temporary div to handle the split
                const splitPoint = range.startOffset;
                const beforeFragment = range.cloneRange();
                beforeFragment.setStart(contentElement, 0);
                const afterFragment = range.cloneRange();
                afterFragment.setEnd(contentElement, contentElement.childNodes.length);
                
                const beforeContent = beforeFragment.cloneContents();
                const afterContent = afterFragment.cloneContents();
                
                const beforeDiv = document.createElement('div');
                const afterDiv = document.createElement('div');
                beforeDiv.appendChild(beforeContent);
                afterDiv.appendChild(afterContent);
                
                this.updateBlockContent(blockId, beforeDiv.innerHTML);
                contentElement.innerHTML = beforeDiv.innerHTML;
                
                if (content === '') {
                    // Convert empty blocks to paragraphs on double Enter
                    if (currentBlock.type !== 'paragraph') {
                        this.updateBlockType(blockId, 'paragraph');
                        this.render();
                        setTimeout(() => {
                            const blockElement = document.getElementById(`block-${blockId}`);
                            if (blockElement) {
                                const contentElement = blockElement.querySelector('.block-content');
                                contentElement.focus();
                            }
                        }, 0);
                        return;
                    }
                }
                
                const newBlockType = ['bullet-list', 'numbered-list'].includes(currentBlock.type) ? 
                    currentBlock.type : 'paragraph';
                
                const newBlockId = this.createBlock(newBlockType, currentIndex + 1);
                const newBlock = this.blocks.find(b => b.id === newBlockId);
                newBlock.content = afterDiv.innerHTML;
                
                this.saveToLocalStorage();
                this.render();
                
                setTimeout(() => {
                    const newBlockElement = document.getElementById(`block-${newBlockId}`);
                    if (newBlockElement) {
                        const newContentElement = newBlockElement.querySelector('.block-content');
                        newContentElement.focus();
                    }
                }, 0);
            }
            return;
        }
        
        // Handle arrow keys for navigation
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const currentIndex = this.blocks.findIndex(b => b.id === blockId);
            if (currentIndex !== -1) {
                if (e.key === 'ArrowUp' && currentIndex > 0) {
                    if (e.ctrlKey || e.metaKey) {
                        // Move block up
                        e.preventDefault();
                        this.moveBlock(blockId, 'up');
                    } else {
                        // Navigate to previous block
                        const prevBlock = document.getElementById(`block-${this.blocks[currentIndex - 1].id}`);
                        if (prevBlock) {
                            e.preventDefault();
                            const prevContentElement = prevBlock.querySelector('.block-content');
                            prevContentElement.focus();
                            
                            // Place cursor at the end
                            const selection = window.getSelection();
                            const range = document.createRange();
                            if (prevContentElement.lastChild && prevContentElement.lastChild.nodeType === Node.TEXT_NODE) {
                                range.setStart(prevContentElement.lastChild, prevContentElement.lastChild.length);
                            } else {
                                range.setStart(prevContentElement, prevContentElement.childNodes.length);
                            }
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                } else if (e.key === 'ArrowDown' && currentIndex < this.blocks.length - 1) {
                    if (e.ctrlKey || e.metaKey) {
                        // Move block down
                        e.preventDefault();
                        this.moveBlock(blockId, 'down');
                    } else {
                        // Navigate to next block
                        const nextBlock = document.getElementById(`block-${this.blocks[currentIndex + 1].id}`);
                        if (nextBlock) {
                            e.preventDefault();
                            const nextContentElement = nextBlock.querySelector('.block-content');
                            nextContentElement.focus();
                            
                            // Place cursor at the beginning
                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.setStart(nextContentElement.firstChild || nextContentElement, 0);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
            }
        }
    }
    
    handleDragStart(e) {
        // Ensure we're dragging a block
        const blockEl = e.target.closest('.block');
        if (!blockEl) return;
        
        this.draggedBlock = blockEl;
        e.dataTransfer.setData('text/plain', blockEl.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
        
        // Add dragging class
        blockEl.classList.add('dragging');
        
        // Set a custom drag image (optional)
        setTimeout(() => {
            blockEl.style.opacity = '0.4';
        }, 0);
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Show drop indicator
        const blockEl = e.target.closest('.block');
        if (blockEl && blockEl !== this.draggedBlock) {
            // Get pointer position relative to the block
            const rect = blockEl.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            // Remove any existing drop indicators
            document.querySelectorAll('.drop-indicator-top, .drop-indicator-bottom').forEach(el => {
                el.remove();
            });
            
            // Create drop indicator
            const dropIndicator = document.createElement('div');
            if (e.clientY < midpoint) {
                // Top half - drop above
                dropIndicator.className = 'drop-indicator-top';
                blockEl.before(dropIndicator);
            } else {
                // Bottom half - drop below
                dropIndicator.className = 'drop-indicator-bottom';
                blockEl.after(dropIndicator);
            }
        }
    }
    
    handleDragEnter(e) {
        const blockEl = e.target.closest('.block');
        if (blockEl && blockEl !== this.draggedBlock) {
            this.dropTarget = blockEl;
            blockEl.classList.add('drag-over');
        }
    }
    
    handleDragLeave(e) {
        const blockEl = e.target.closest('.block');
        if (blockEl && blockEl !== this.draggedBlock) {
            blockEl.classList.remove('drag-over');
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const dropTarget = e.target.closest('.block');
        if (!dropTarget || dropTarget === this.draggedBlock) return;
        
        // Get the block IDs
        const draggedId = this.draggedBlock.dataset.id;
        const targetId = dropTarget.dataset.id;
        
        // Get the respective indices
        const draggedIndex = this.blocks.findIndex(b => b.id === draggedId);
        const targetIndex = this.blocks.findIndex(b => b.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Get drop position (above or below)
        const rect = dropTarget.getBoundingClientRect();
        const dropPosition = e.clientY < (rect.top + rect.height / 2) ? 'above' : 'below';
        
        // Remove the dragged block from the array
        const [draggedBlock] = this.blocks.splice(draggedIndex, 1);
        
        // Calculate new insertion index
        let newIndex = targetIndex;
        if (draggedIndex < targetIndex && dropPosition === 'above') {
            newIndex--;
        } else if (draggedIndex > targetIndex && dropPosition === 'below') {
            newIndex++;
        } else if (dropPosition === 'below') {
            newIndex++;
        }
        
        // Insert the block at the new position
        this.blocks.splice(newIndex, 0, draggedBlock);
        
        // Re-render the editor
        this.render();
        
        // Focus the moved block after rendering
        setTimeout(() => {
            const movedBlockEl = document.getElementById(`block-${draggedId}`);
            if (movedBlockEl) {
                const contentEl = movedBlockEl.querySelector('.block-content');
                if (contentEl) contentEl.focus();
            }
        }, 0);
    }
    
    handleDragEnd(e) {
        if (this.draggedBlock) {
            this.draggedBlock.style.opacity = '';
            this.draggedBlock.classList.remove('dragging');
            this.draggedBlock = null;
        }
        
        if (this.dropTarget) {
            this.dropTarget.classList.remove('drag-over');
            this.dropTarget = null;
        }
        
        // Remove any drop indicators
        document.querySelectorAll('.drop-indicator-top, .drop-indicator-bottom').forEach(el => {
            el.remove();
        });
    }
    
    createFormattingToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'formatting-toolbar';
        
        const buttons = [
            { icon: 'format_bold', command: 'bold', title: 'Bold (Ctrl+B)' },
            { icon: 'format_italic', command: 'italic', title: 'Italic (Ctrl+I)' },
            { icon: 'format_underlined', command: 'underline', title: 'Underline (Ctrl+U)' },
            { icon: 'strikethrough_s', command: 'strikeThrough', title: 'Strikethrough' },
            'divider',
            { icon: 'format_align_left', command: 'justifyLeft', title: 'Align Left' },
            { icon: 'format_align_center', command: 'justifyCenter', title: 'Center' },
            { icon: 'format_align_right', command: 'justifyRight', title: 'Align Right' },
            'divider',
            { icon: 'link', command: 'createLink', title: 'Insert Link' }
        ];
        
        // Add text color and background color pickers
        const colorOptions = [
            { type: 'textColor', icon: 'format_color_text', title: 'Text Color' },
            { type: 'backgroundColor', icon: 'format_color_fill', title: 'Background Color' }
        ];
        
        colorOptions.forEach(colorOption => {
            const colorPickerButton = document.createElement('button');
            colorPickerButton.className = 'color-picker-button';
            colorPickerButton.title = colorOption.title;
            colorPickerButton.innerHTML = `<span class="material-icons">${colorOption.icon}</span>`;
            
            const colorPickerDropdown = this.createColorPicker(colorOption.type);
            colorPickerButton.appendChild(colorPickerDropdown);
            
            // Toggle visibility of color picker
            colorPickerButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent document click from immediately closing it
                colorPickerDropdown.classList.toggle('visible');
            });
            
            toolbar.appendChild(colorPickerButton);
        });
        
        buttons.forEach(button => {
            if (button === 'divider') {
                const divider = document.createElement('div');
                divider.className = 'formatting-divider';
                toolbar.appendChild(divider);
                return;
            }
            
            const btn = document.createElement('button');
            btn.className = 'formatting-button';
            btn.title = button.title;
            btn.innerHTML = `
                <span class="material-icons">${button.icon}</span>
            `;
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.executeCommand(button.command);
            });
            
            toolbar.appendChild(btn);
        });
        
        return toolbar;
    }
    
    executeCommand(command) {
        if (command === 'createLink') {
            const url = prompt('Enter the URL:');
            if (url) {
                document.execCommand(command, false, url);
                // Add target="_blank" to the newly created link
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                // Get the actual element, walking up from text nodes if necessary
                const element = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
                const links = element.getElementsByTagName('a');
                for (let link of links) {
                    link.target = "_blank";
                    link.rel = "noopener noreferrer"; // Security best practice
                }
            }
        } else {
            document.execCommand(command, false, null);
        }
    }
    
    // Create color picker
    createColorPicker(type) {
        const dropdown = document.createElement('div');
        dropdown.className = 'color-picker-dropdown';
        
        const colors = [
            '#000000', '#FFFFFF', '#F44336', '#E91E63', '#9C27B0', '#673AB7',
            '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
            '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
            '#795548', '#9E9E9E', '#607D8B'
        ];
        
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', (e) => {
                e.preventDefault();
                if (type === 'textColor') {
                    this.applyTextColor(color);
                } else if (type === 'backgroundColor') {
                    this.applyBackgroundColor(color);
                }
                dropdown.classList.remove('visible'); // Hide after selection
            });
            dropdown.appendChild(swatch);
        });
        
        // Prevent dropdown from closing when clicking inside
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        return dropdown;
    }
    
    // Apply text color
    applyTextColor(color) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color);
    }
    
    // Apply background color
    applyBackgroundColor(color) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('hiliteColor', false, color); // or 'backColor'
    }
    
    handleSelectionChange() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();
        
        // Check if selection is within an equation editor or graph editor
        const isInSpecialEditor = this.isSelectionInEquationEditor(selection) || 
                                  this.isSelectionInGraphEditor(selection);
        
        if (selectedText && this.isSelectionWithinEditor(selection) && !isInSpecialEditor) {
            const rect = range.getBoundingClientRect();
            this.showFormattingToolbar(rect);
        } else {
            this.hideFormattingToolbar();
        }
    }
    
    isSelectionInEquationEditor(selection) {
        let node = selection.anchorNode;
        while (node != null) {
            if (node.classList && node.classList.contains('equation-editor')) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }
    
    isSelectionInGraphEditor(selection) {
        let node = selection.anchorNode;
        while (node != null) {
            if (node.classList && node.classList.contains('graph-code-editor')) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }
    
    isSelectionWithinEditor(selection) {
        let node = selection.anchorNode;
        while (node != null) {
            if (node === this.editor) return true;
            node = node.parentNode;
        }
        return false;
    }
    
    showFormattingToolbar(rect) {
        const toolbar = this.formattingToolbar;
        toolbar.classList.add('visible');
        
        // Position the toolbar above the selection
        const toolbarRect = toolbar.getBoundingClientRect();
        const top = rect.top - toolbarRect.height - 10;
        const left = rect.left + (rect.width - toolbarRect.width) / 2;
        
        toolbar.style.top = `${top + window.scrollY}px`;
        toolbar.style.left = `${left}px`;
    }
    
    hideFormattingToolbar() {
        this.formattingToolbar.classList.remove('visible');
    }
    
    saveToLocalStorage() {
        try {
            const data = {
                blocks: this.blocks,
                version: '1.0'
            };
            const jsonString = JSON.stringify(data);
            
            // First try to store the data
            try {
                localStorage.setItem('editor-content', jsonString);
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    // If quota is exceeded, try to clear some space by removing old data
                    localStorage.clear();
                    
                    // Try saving again
                    try {
                        localStorage.setItem('editor-content', jsonString);
                    } catch (retryError) {
                        // If it still fails, show an error to the user
                        console.error('Storage quota exceeded. Some content may not be saved.');
                        alert('Warning: Storage quota exceeded. Some content may not be saved. Consider exporting your document.');
                    }
                }
            }
            
            // Save reading mode state separately as it's small
            localStorage.setItem('editor-reading-mode', this.isReadingMode);
        } catch (e) {
            console.error('Error saving to local storage:', e);
        }
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('editor-content');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.blocks = data.blocks;
                
                // Load reading mode state, default to false if not set
                const savedReadingMode = localStorage.getItem('editor-reading-mode');
                if (savedReadingMode !== null) {
                    this.isReadingMode = savedReadingMode === 'true';
                } else {
                    this.isReadingMode = false; // Default to false (edit mode)
                }
                this.readingModeToggle.checked = this.isReadingMode;
                this.editor.classList.toggle('reading-mode', this.isReadingMode);
                
                this.render();
            } catch (e) {
                console.error('Error loading saved content:', e);
                this.blocks = [];
                this.createBlock('paragraph');
                
                // Set reading mode to false on error
                this.isReadingMode = false;
                this.readingModeToggle.checked = false;
                this.editor.classList.remove('reading-mode');
            }
        } else {
            // No saved data - set reading mode to false
            this.isReadingMode = false;
            this.readingModeToggle.checked = false;
            this.editor.classList.remove('reading-mode');
        }
    }

    exportToJSON() {
        return JSON.stringify({
            blocks: this.blocks,
            version: '1.0'
        }, null, 2);
    }

    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.blocks = data.blocks;
            this.saveToLocalStorage();
            this.render();
        } catch (e) {
            console.error('Error importing content:', e);
        }
    }

    toggleReadingMode(e) {
        this.isReadingMode = e.target.checked;
        this.editor.classList.toggle('reading-mode', this.isReadingMode);
        
        // Update contentEditable for all block contents
        const blockContents = document.querySelectorAll('.block-content');
        blockContents.forEach(content => {
            content.contentEditable = !this.isReadingMode;
        });
        
        // Make title respect reading mode
        const title = document.querySelector('.document-title');
        title.contentEditable = !this.isReadingMode;
        
        // Always display the title placeholder if it is empty
        const documentTitle = document.querySelector('.document-title');
        if (documentTitle.textContent.trim() === '') {
            documentTitle.textContent = ''; // Ensure it's truly empty for the placeholder to show
        }
        
        // Update todo checkboxes to remain interactive
        const todoCheckboxes = document.querySelectorAll('.block-todo-checkbox');
        todoCheckboxes.forEach(checkbox => {
            checkbox.style.pointerEvents = 'auto';
        });
        
        this.render();
        
        // Save reading mode state
        localStorage.setItem('editor-reading-mode', this.isReadingMode);
    }
    
    toggleMenu(e) {
        e.stopPropagation();
        this.menuDropdown.classList.toggle('visible');
    }

    handleMenuClick(e) {
        if (!this.menuDropdown.contains(e.target) && !this.menuButton.contains(e.target)) {
            this.menuDropdown.classList.remove('visible');
        }
    }

    initializeClearHistory() {
        const clearHistoryBtn = document.getElementById('clear-history');
        const confirmationDialog = document.getElementById('confirmation-dialog');
        const dialogOverlay = document.getElementById('dialog-overlay');
        const cancelBtn = document.getElementById('cancel-clear');
        const confirmBtn = document.getElementById('confirm-clear');
        
        clearHistoryBtn.addEventListener('click', () => {
            this.showConfirmationDialog();
        });
        
        cancelBtn.addEventListener('click', () => {
            this.hideConfirmationDialog();
        });
        
        confirmBtn.addEventListener('click', () => {
            this.clearHistory();
            this.hideConfirmationDialog();
        });
        
        // Close dialog when clicking overlay
        dialogOverlay.addEventListener('click', () => {
            this.hideConfirmationDialog();
        });
        
        // Close dialog with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideConfirmationDialog();
            }
        });
    }
    
    showConfirmationDialog() {
        const dialog = document.getElementById('confirmation-dialog');
        const overlay = document.getElementById('dialog-overlay');
        dialog.classList.add('visible');
        overlay.classList.add('visible');
        this.menuDropdown.classList.remove('visible');
    }

    hideConfirmationDialog() {
        const dialog = document.getElementById('confirmation-dialog');
        const overlay = document.getElementById('dialog-overlay');
        dialog.classList.remove('visible');
        overlay.classList.remove('visible');
    }
    
    clearHistory() {
        // Clear local storage
        localStorage.removeItem('editor-content');
        localStorage.removeItem('editor-reading-mode');
        
        // Reset blocks array
        this.blocks = [];
        
        // Create initial paragraph block
        this.createBlock('paragraph');
        
        // Reset reading mode to default (false)
        this.isReadingMode = false;
        this.readingModeToggle.checked = false;
        this.editor.classList.remove('reading-mode');
        
        // Clear document title
        const documentTitle = document.querySelector('.document-title');
        documentTitle.textContent = '';
        
        // Render the empty state
        this.render();
    }
    
    initializeImageUpload() {
        // Add listeners for the image upload dialog
        const cancelImageBtn = document.getElementById('cancel-image');
        const uploadImageBtn = document.getElementById('upload-image');
        
        cancelImageBtn.addEventListener('click', () => {
            this.hideImageUploadDialog();
        });
        
        uploadImageBtn.addEventListener('click', () => {
            this.imageInput.click();
        });
        
        this.imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = e.target.result;
                    this.createImageBlock(imageData);
                    this.hideImageUploadDialog();
                    this.imageInput.value = ''; // Reset input
                };
                reader.readAsDataURL(file);
            }
        });
    }

    showImageUploadDialog() {
        this.imageUploadDialog.classList.add('visible');
        document.getElementById('dialog-overlay').classList.add('visible');
    }

    hideImageUploadDialog() {
        this.imageUploadDialog.classList.remove('visible');
        document.getElementById('dialog-overlay').classList.remove('visible');
    }

    createImageBlock(imageData) {
        const id = uuidv4();
        const block = {
            id,
            type: 'image',
            content: imageData,
            alignment: 'center', // Default alignment
            width: 100, // Default width
            isEditing: false // Added isEditing property
        };
        
        this.blocks.push(block);
        this.render();
        
        // Focus the new block after rendering
        setTimeout(() => {
            const blockElement = document.getElementById(`block-${id}`);
            if (blockElement) {
                const contentElement = blockElement.querySelector('.block-content');
                contentElement.focus();
            }
        }, 0);
        
        return id;
    }
}

// Initialize the editor when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const editor = new BlockEditor();
    window.editor = editor;
});

document.getElementById('export-json').addEventListener('click', () => {
    const editor = window.editor; 
    const json = editor.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'editor-content.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('import-json').addEventListener('click', () => {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const editor = window.editor;
            editor.importFromJSON(e.target.result);
        };
        reader.readAsText(file);
    }
});