

// 
// Animação para o Titulo da Sessão
//
document.addEventListener('DOMContentLoaded', () => {
    const servicesTitle = document.querySelector('#servicos .section-title-v1');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Dispara quando 10% do elemento estiver visível
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Adiciona as classes de animação
                servicesTitle.classList.add('animate__animated', 'animate__backInUp');
                
                // Para de observar após a animação
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    observer.observe(servicesTitle);
});

