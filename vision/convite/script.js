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
        titleFont: document.getElementById('titleFont'),
        bodyFont: document.getElementById('bodyFont'),
        conviteHeight: document.getElementById('conviteHeight')
    };

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
            footerText: document.querySelector('.footer-text')
        };

        // Update texts if elements exist
        if (previewElements.titulo) previewElements.titulo.textContent = inputs.titulo.value;
        if (previewElements.evento) previewElements.evento.textContent = inputs.evento.value;
        if (previewElements.data) previewElements.data.textContent = inputs.data.value;
        if (previewElements.horario) previewElements.horario.textContent = inputs.horario.value;

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

    // Set initial HTML content
    htmlEditor.value = document.querySelector('.convite-content').outerHTML;

    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.tab === 'html') {
                visualEditor.classList.remove('active');
                htmlEditorContainer.classList.add('active');
                // Update HTML editor with current content
                htmlEditor.value = document.querySelector('.convite-content').outerHTML;
            } else {
                visualEditor.classList.add('active');
                htmlEditorContainer.classList.remove('active');
                updatePreview(); // Update visual preview
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