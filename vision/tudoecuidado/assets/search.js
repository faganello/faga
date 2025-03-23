document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const toggleFaq = document.getElementById('toggleFaq');
    const accordionFaq = document.getElementById('accordionFaq');
    const faqItems = document.querySelectorAll('.faq-item');
    const selectedResult = document.getElementById('selectedResult');

    // Array com todas as perguntas e respostas, incluindo variações das perguntas
    const faqData = [
        {
            mainQuestion: "Como funciona o processo de contratação?",
            alternativeQuestions: [
                "Qual é o processo para contratar um cuidador?",
                "Como faço para começar o atendimento?",
                "Quais são os passos para contratar um cuidador?"
            ],
            answer: "Realizamos uma avaliação inicial das necessidades do idoso e da família, seguida por uma seleção criteriosa do cuidador mais adequado. Todo o processo é acompanhado por nossa equipe especializada."
        },
        {
            mainQuestion: "Quais são as qualificações dos cuidadores?",
            alternativeQuestions: [
                "Qual a formação dos cuidadores?",
                "Os cuidadores são qualificados?",
                "Qual o preparo técnico dos profissionais?"
            ],
            answer: "Todos os nossos cuidadores são profissionais certificados, com experiência comprovada e treinamento específico em cuidados geriátricos. Passam por uma rigorosa verificação de antecedentes."
        },
        {
            mainQuestion: "Qual é o valor do serviço?",
            alternativeQuestions: [
                "Quanto custa contratar um cuidador?",
                "Qual o preço do atendimento?",
                "Como funciona o pagamento?"
            ],
            answer: "Os valores variam de acordo com as necessidades específicas, período de atendimento e tipo de cuidado necessário. Entre em contato para uma avaliação personalizada."
        },
        {
            mainQuestion: "Existe cobertura 24 horas?",
            alternativeQuestions: [
                "Vocês atendem durante a noite?",
                "Tem cuidador para período integral?",
                "É possível ter atendimento dia e noite?"
            ],
            answer: "Sim, oferecemos serviços 24 horas com possibilidade de revezamento entre cuidadores, garantindo assistência contínua e qualidade no atendimento."
        },
        {
            mainQuestion: "Como é feita a substituição em caso de ausência do cuidador?",
            alternativeQuestions: [
                "O que acontece se o cuidador faltar?",
                "Existe cuidador substituto?",
                "Como funciona em caso de folga do cuidador?"
            ],
            answer: "Mantemos uma equipe de backup pronta para cobrir eventuais ausências, garantindo que seu familiar nunca fique sem assistência."
        }
    ];

    // Função de pesquisa
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const matchedQuestions = faqData.filter(item => {
            return item.mainQuestion.toLowerCase().includes(searchTerm) ||
                   item.alternativeQuestions.some(q => q.toLowerCase().includes(searchTerm));
        });

        if (matchedQuestions.length > 0) {
            searchResults.innerHTML = matchedQuestions
                .map(item => `<div class="search-result-item">${item.mainQuestion}</div>`)
                .join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });

    // Clique nos resultados da pesquisa
    searchResults.addEventListener('click', function(e) {
        if (e.target.classList.contains('search-result-item')) {
            const selectedQuestion = e.target.textContent;
            const selectedFaq = faqData.find(item => item.mainQuestion === selectedQuestion);
            
            searchInput.value = selectedQuestion;
            searchResults.style.display = 'none';
            
            selectedResult.querySelector('.selected-result-question').textContent = selectedFaq.mainQuestion;
            selectedResult.querySelector('.selected-result-answer').textContent = selectedFaq.answer;
            selectedResult.style.display = 'block';
            
            accordionFaq.classList.add('hidden');
            toggleFaq.textContent = 'Exibir FAQ tradicional';
        }
    });

    // Close button for selected result
    selectedResult.querySelector('.selected-result-close').addEventListener('click', function() {
        selectedResult.style.display = 'none';
        searchInput.value = '';
    });

    // Toggle FAQ tradicional
    toggleFaq.addEventListener('click', function(e) {
        e.preventDefault();
        accordionFaq.classList.toggle('hidden');
        this.textContent = accordionFaq.classList.contains('hidden') 
            ? 'Exibir FAQ tradicional' 
            : 'Ocultar FAQ tradicional';
    });

    // Funcionalidade do acordeão
    faqItems.forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Fecha todos os itens ativos
            faqItems.forEach(faqItem => faqItem.classList.remove('active'));
            
            // Se o item clicado não estava ativo, abre ele
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Fechar resultados da pesquisa quando clicar fora
    document.addEventListener('click', function(e) {
        if (!searchResults.contains(e.target) && !searchInput.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
});