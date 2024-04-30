function typeEffect(element, speed, words) {
  var currentWordIndex = 0;
  var text = '';
  var wordIndex = 0;
  var isDeleting = false;

  function type() {
    if (wordIndex < words[currentWordIndex].length) {
      text += words[currentWordIndex].charAt(wordIndex);
      element.innerHTML = text;
      wordIndex++;
      setTimeout(type, speed);
    } else {
      isDeleting = true;
      setTimeout(erase, speed * 2);
    }
  }

  function erase() {
    if (wordIndex > 0) {
      text = words[currentWordIndex].substring(0, wordIndex - 1);
      element.innerHTML = text;
      wordIndex--;
      setTimeout(erase, speed / 2);
    } else {
      isDeleting = false;
      currentWordIndex = (currentWordIndex + 1) % words.length;
      setTimeout(type, speed);
    }
  }

  setTimeout(type, speed);
}

// application
var speed = 250; // velocidade de digitação em milissegundos
var words = ['crie', 'aprenda', 'viva', 'descanse', 'passeie', 'aproveite']; // lista de palavras a serem exibidas
var title_word = document.querySelector('.title-word'); // elemento HTML onde o texto será exibido

// aplicar efeito de digitação ao elemento
typeEffect(title_word, speed, words);


