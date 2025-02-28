document.addEventListener('DOMContentLoaded', function() {
    // Adiciona height control aos elementos de entrada existentes
    const inputs = {
        titulo: document.getElementById('titulo'),
        evento: document.getElementById('evento'),
        data: document.getElementById('data'),
        horario: document.getElementById('horario'),
        protocolCode: document.getElementById('protocolCode'),
        bgColor: document.getElementById('bgColor'),
        textColor: document.getElementById('textColor'),
        accentColor: document.getElementById('accentColor'),
        titleColor: document.getElementById('titleColor'),
        eventTitleColor: document.getElementById('eventTitleColor'),
        detailTextColor: document.getElementById('detailTextColor'),
        logoPlaceholderColor: document.getElementById('logoPlaceholderColor'),
        titleFont: document.getElementById('titleFont'),
        bodyFont: document.getElementById('bodyFont'),
        conviteHeight: document.getElementById('conviteHeight'),
        companyImage: document.getElementById('companyImage'),
        companyName: document.getElementById('companyName'),
        companyPhrase: document.getElementById('companyPhrase'),
        description: document.getElementById('description') // Added description input
    };

    const colorSchemes = {
        light: {
            bgColor: '#ffffff',
            textColor: '#333333',
            accentColor: '#1a365d',
            titleColor: '#333333',
            eventTitleColor: '#1a365d',
            detailTextColor: '#333333',
            logoPlaceholderColor: '#666666'
        },
        dark: {
            bgColor: '#1a365d',
            textColor: '#ffffff',
            accentColor: '#f2d0a3',
            titleColor: '#f2d0a3',
            eventTitleColor: '#f2d0a3',
            detailTextColor: '#ffffff',
            logoPlaceholderColor: '#f2d0a3'
        },
        pastel: {
            bgColor: '#f0f4f8',
            textColor: '#495057',
            accentColor: '#a5d8ff',
            titleColor: '#343a40',
            eventTitleColor: '#007bff',
            detailTextColor: '#6c757d',
            logoPlaceholderColor: '#adb5bd'
        },
        vibrant: {
            bgColor: '#28a745',
            textColor: '#ffffff',
            accentColor: '#ffc107',
            titleColor: '#ffffff',
            eventTitleColor: '#dc3545',
            detailTextColor: '#ffffff',
            logoPlaceholderColor: '#ffffff'
        },
        black: {
            bgColor: '#000000',
            textColor: '#ffffff',
            accentColor: '#FFD700',
            titleColor: '#FFD700',
            eventTitleColor: '#ffffff',
            detailTextColor: '#ffffff',
            logoPlaceholderColor: '#FFD700'
        }
    };

    // Function to apply color scheme
    function applyColorScheme(scheme) {
        inputs.bgColor.value = scheme.bgColor;
        inputs.textColor.value = scheme.textColor;
        inputs.accentColor.value = scheme.accentColor;
        inputs.titleColor.value = scheme.titleColor;
        inputs.eventTitleColor.value = scheme.eventTitleColor;
        inputs.detailTextColor.value = scheme.detailTextColor;
        inputs.logoPlaceholderColor.value = scheme.logoPlaceholderColor;
        updatePreview(); // Refresh preview after applying
    }

    // Add event listener to the color scheme dropdown
    document.getElementById('colorScheme').addEventListener('change', function() {
        applyColorScheme(colorSchemes[this.value]);
    });

    // Function to update description based on selection
    function updateDescription() {
        const descriptionOptions = {
            generic: "Uma consultoria completa para o seu negócio",
            businessAnalysis: "Análise comercial detalhada para impulsionar seu crescimento",
            contractProcess: "Entenda o processo de contratação ideal para sua empresa"
        };
        inputs.description.value = descriptionOptions[document.getElementById('descriptionOptions').value] || descriptionOptions.generic;
        updatePreview();
    }

    // Add event listener to the description options dropdown
    document.getElementById('descriptionOptions').addEventListener('change', updateDescription);

    // Atualizar display da altura
    const heightValue = document.getElementById('heightValue');
    inputs.conviteHeight.addEventListener('input', function() {
        heightValue.textContent = this.value + 'px';
        document.getElementById('convite').style.height = this.value + 'px';
    });

    // Definir altura inicial
    document.getElementById('convite').style.height = inputs.conviteHeight.value + 'px';

    // Generate and set initial protocol code
    function generateProtocolCode() {
        const date = new Date();
        const year = date.getFullYear();
        const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        return `PROTOCOL: VIS${year}${randomNum}`;
    }
    const initialProtocol = generateProtocolCode();
    inputs.protocolCode.value = initialProtocol;

    // Add protocol generation button handler
    document.getElementById('generateProtocol').addEventListener('click', function() {
        inputs.protocolCode.value = generateProtocolCode();
        updatePreview();
    });

    // Atualiza o preview em tempo real
    function updatePreview() {
        // Re-query elements that might have changed
        const previewElements = {
            titulo: document.getElementById('titulo-preview'),
            evento: document.getElementById('evento-preview'),
            data: document.getElementById('data-preview'),
            horario: document.getElementById('horario-preview'),
            convite: document.getElementById('convite'),
            borders: document.querySelectorAll('.decorative-border'),
            conviteContent: document.querySelector('.convite-content'),
            footerText: document.querySelector('.footer-text'),
            companyNamePreview: document.getElementById('company-name-preview'),
            companyPhrasePreview: document.getElementById('company-phrase-preview'),
            logoPlaceholder: document.querySelector('.logo-placeholder'),
            description: document.getElementById('description-preview') // Added description preview
        };

        // Update texts if elements exist
        if (previewElements.titulo) previewElements.titulo.textContent = inputs.titulo.value;
        if (previewElements.evento) previewElements.evento.textContent = inputs.evento.value;
        if (previewElements.data) previewElements.data.textContent = inputs.data.value;
        if (previewElements.horario) previewElements.horario.textContent = inputs.horario.value;

        // Update description if element exist
        if (previewElements.description) previewElements.description.textContent = inputs.description.value;

        // Update protocol code from input field instead of generating new one
        if (previewElements.footerText) {
            previewElements.footerText.textContent = inputs.protocolCode.value || generateProtocolCode();
        }

        // Update colors
        if (previewElements.convite) {
            previewElements.convite.style.backgroundColor = inputs.bgColor.value;
            previewElements.convite.style.color = inputs.textColor.value;
        }
        
        if (previewElements.borders) {
            previewElements.borders.forEach(border => {
                border.style.background = `linear-gradient(90deg, transparent, ${inputs.accentColor.value}, transparent)`;
            });
        }

        // Update fonts
        document.documentElement.style.setProperty('--title-font', inputs.titleFont.value);
        document.documentElement.style.setProperty('--body-font', inputs.bodyFont.value);

        // Update company image
        const companyImage = document.getElementById('company-logo');
        if (inputs.companyImage.files && inputs.companyImage.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                companyImage.src = e.target.result;
            };
            reader.readAsDataURL(inputs.companyImage.files[0]);
        }

        if (previewElements.companyNamePreview) {
            previewElements.companyNamePreview.textContent = inputs.companyName.value;
        }
         if (previewElements.companyPhrasePreview) {
            previewElements.companyPhrasePreview.textContent = inputs.companyPhrase.value;
        }

        // Update specific text colors
        const titlePreview = document.getElementById('titulo-preview');
        if (titlePreview) {
            titlePreview.style.color = inputs.titleColor.value;
        }

        const eventTitlePreview = document.getElementById('evento-preview');
        if (eventTitlePreview) {
            eventTitlePreview.style.color = inputs.eventTitleColor.value;
        }

        const detailText = document.querySelectorAll('.details p');
        detailText.forEach(detail => {
           detail.style.color = inputs.detailTextColor.value; 
        });

        // Update specific color for logo placeholder
        if (previewElements.logoPlaceholder) {
            previewElements.logoPlaceholder.style.color = inputs.logoPlaceholderColor.value;
        }
    }

    // Adiciona listeners para todos os inputs
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Update the font preview when selection changes
    document.getElementById('titleFont').addEventListener('change', function() {
        this.nextElementSibling.style.fontFamily = this.value;
    });

    document.getElementById('bodyFont').addEventListener('change', function() {
        this.nextElementSibling.style.fontFamily = this.value;
    });

    // HTML Editor functionality
    const htmlEditor = document.getElementById('htmlEditor');
    const visualEditor = document.getElementById('visual-editor');
    const htmlEditorContainer = document.getElementById('html-editor');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const updateHtmlBtn = document.getElementById('updateHtml');
    const mensagemEditor = document.getElementById('mensagem'); // Get the message editor element

    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const geminiPromptInput = document.getElementById('geminiPrompt');
    const generateMessageButton = document.getElementById('generateMessage');
    const generatedMessageTextarea = document.getElementById('generatedMessage');
    const copyMessageButton = document.getElementById('copyMessage');

    generateMessageButton.addEventListener('click', async () => {
        const apiKey = geminiApiKeyInput.value;
        const prompt = geminiPromptInput.value;

        if (!apiKey) {
            alert('Por favor, insira sua chave API do Gemini.');
            return;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "contents": [{
                        "parts": [{ "text": prompt }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }

            const data = await response.json();
            console.log('Gemini API Response:', data);
            
            // Check if the 'candidates' array exists and has at least one element
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
              generatedMessageTextarea.value = data.candidates[0].content.parts[0].text;
            } else {
              generatedMessageTextarea.value = "Erro ao gerar mensagem. Verifique a chave API e o prompt.";
            }

        } catch (error) {
            console.error('Erro ao chamar a API do Gemini:', error);
            generatedMessageTextarea.value = `Erro: ${error.message}. Verifique a chave API e o prompt.`;
        }
    });

    copyMessageButton.addEventListener('click', () => {
        generatedMessageTextarea.select();
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        alert('Mensagem copiada para a área de transferência!');
    });

    // Set initial HTML content
    htmlEditor.value = document.querySelector('.convite-content').outerHTML;

    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            visualEditor.classList.remove('active');
            htmlEditorContainer.classList.remove('active');
            mensagemEditor.classList.remove('active'); // Hide the message editor

            if (btn.dataset.tab === 'html') {
                htmlEditorContainer.classList.add('active');
                // Update HTML editor with current content
                htmlEditor.value = document.querySelector('.convite-content').outerHTML;
            } else if(btn.dataset.tab === 'visual') {
                visualEditor.classList.add('active');
                updatePreview(); // Update visual preview
            }
            else if(btn.dataset.tab === 'mensagem'){
              mensagemEditor.classList.add('active');
            }
        });
    });

    // Update preview from HTML editor
    updateHtmlBtn.addEventListener('click', () => {
        try {
            const previewContainer = document.getElementById('convite');
            const newContent = htmlEditor.value;
            
            // Ensure the HTML contains necessary preview elements
            if (!newContent.includes('titulo-preview') || 
                !newContent.includes('evento-preview') || 
                !newContent.includes('data-preview') || 
                !newContent.includes('horario-preview')) {
                throw new Error('O HTML deve conter todos os elementos necessários para o preview');
            }
            
            previewContainer.innerHTML = newContent;
            
            // Re-apply styles after HTML update
            updatePreview();
        } catch (e) {
            console.error('Erro ao atualizar HTML:', e);
            alert('HTML inválido. Certifique-se de manter os IDs necessários para o preview.');
        }
    });

    // Update HTML editor when visual editor changes
    function updateHtmlEditor() {
        if (htmlEditorContainer.classList.contains('active')) {
            htmlEditor.value = document.querySelector('.convite-content').outerHTML;
        }
    }

    // Add HTML editor update to the existing update function
    const originalUpdatePreview = updatePreview;
    updatePreview = function() {
        originalUpdatePreview();
        updateHtmlEditor();
    };

    // Elementos das configurações de download
    const imageScale = document.getElementById('imageScale');
    const imageFormat = document.getElementById('imageFormat');
    const imageQuality = document.getElementById('imageQuality');
    const qualityValue = document.getElementById('qualityValue');
    const fileName = document.getElementById('fileName');
    const jpegQualityContainer = document.querySelector('.jpeg-quality');

    // Atualizar display da qualidade JPEG
    imageQuality.addEventListener('input', function() {
        qualityValue.textContent = Math.round(this.value * 100) + '%';
    });

    // Mostrar/esconder controle de qualidade JPEG
    imageFormat.addEventListener('change', function() {
        jpegQualityContainer.style.display = this.value === 'jpeg' ? 'block' : 'none';
    });

    // Função para download do convite
    document.getElementById('download').addEventListener('click', async function() {
        const convite = document.getElementById('convite');
        
        // Create a temporary container to maintain aspect ratio during capture
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        document.body.appendChild(tempContainer);
        
        // Clone the convite element
        const conviteClone = convite.cloneNode(true);
        tempContainer.appendChild(conviteClone);
        
        // Ensure the clone maintains the same dimensions
        conviteClone.style.width = `${convite.offsetWidth}px`;
        conviteClone.style.height = `${convite.offsetHeight}px`;
        conviteClone.style.position = 'relative';
        conviteClone.style.padding = '0';
        
        try {
            // Aguarda todas as imagens carregarem
            const images = conviteClone.getElementsByTagName('img');
            const imagePromises = Array.from(images).map(img => {
                return new Promise((resolve, reject) => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = reject;
                    }
                });
            });

            await Promise.all(imagePromises);

            html2canvas(conviteClone, {
                backgroundColor: null,
                scale: parseInt(imageScale.value),
                logging: false,
                width: convite.offsetWidth,
                height: convite.offsetHeight,
                useCORS: true,
                allowTaint: true,
                onclone: function(clonedDoc) {
                    const clonedElement = clonedDoc.querySelector('#convite');
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.padding = '0';
                    }
                }
            }).then(canvas => {
                const format = imageFormat.value;
                const quality = format === 'jpeg' ? parseFloat(imageQuality.value) : 1;
                const link = document.createElement('a');
                link.download = `${fileName.value}.${format}`;
                link.href = canvas.toDataURL(`image/${format}`, quality);
                link.click();
                
                // Clean up
                document.body.removeChild(tempContainer);
            });
        } catch (error) {
            console.error('Erro ao carregar imagens:', error);
            alert('Houve um erro ao gerar o convite. Verifique se todas as imagens são válidas.');
            document.body.removeChild(tempContainer);
        }
    });

    // Atualiza o preview inicial
    updatePreview();
});