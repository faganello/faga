
var lista = []


function tempoEstimado(lista){
    let tempo = ((lista.length*20)/60).toFixed(2);
    console.log(tempo);
    document.querySelector('.tempoEstimado').textContent = "Tempo estimado: " + tempo + " min";
}

function checkIn(){
    // Seleciona todos os elementos com a classe 'check-contato'
    var checkCells = document.querySelectorAll('.check-contato');

    // Verifica se alguma célula ainda não possui as classes
    var firstUncheckedCell = null;
    for (let i = 0; i < checkCells.length; i++) {
        if (!checkCells[i].classList.contains("fa-regular") || !checkCells[i].classList.contains("fa-square-check")) {
            firstUncheckedCell = checkCells[i];
            break;
        }
    }

    // Se encontrou uma célula que não possui as classes, aplica as classes
    if (firstUncheckedCell !== null) {
        firstUncheckedCell.classList.add("fa-regular");
        firstUncheckedCell.classList.add("fa-square-check");
    }
}



var stopExecution = false; // Variável de controle para interromper a execução do loop

function executarWorkflow() {
    // Obtém o valor do campo de entrada de texto com id "msgInput"
    var msgInput = document.getElementById('msgInput');
    var message = msgInput.value;

    document.querySelector('.contador-msg').style.display = 'flex';

    // Permite que o loop recomece
    //stopExecution = false;

    // Laço for para percorrer os itens da lista
    for (let i = 0; i < lista.length; i++) {
        // Verifica se a execução deve ser interrompida
        if (stopExecution) {
            console.log("Execução interrompida.");
            break; // Sai do loop se a execução for interrompida
        }

        // Cria um escopo de função imediatamente invocada (IIFE) para preservar o valor correto de 'evento'
        (function(index) {
            // Dispara o evento personalizado após 12 segundos
            setTimeout(function() {
                if (stopExecution) return; // Verifica novamente se a execução deve ser interrompida antes de continuar

                var evento = new CustomEvent('automa:execute-workflow', {
                    detail: {
                        id: 'D4BCaTRTNq1XDSHshazNt',
                        data: {
                            variables: {
                                message: message,
                                phone: lista[index]
                            }
                        }
                    }
                });
                window.dispatchEvent(evento);
                checkIn();
                // adiciona o numero ao contador
                document.querySelector('.num-contato-atual').textContent = i+1;
            }, 20000 * index); // Multiplica o tempo pelo índice para garantir um atraso crescente

        })(i); // Passa o valor atual do índice para a IIFE

    }
}

// Função para interromper a execução
function pararExecucao() {
    stopExecution = true; // Define a variável de controle como verdadeira para interromper o loop
    window.alert("Disparo interrompido! Para continuar enviando, recarregue a página e comece novamente");
    document.querySelector('.stop-workflow').style.display = 'none';
    document.querySelector('.reload-page').style.display = 'block';
    document.querySelector('.contador-msg').style.backgroundColor = '#3f0000f2';
    console.log(">> botão 'Interromper' clicado");
}


function removerContato() {
    // Selecionando todos os elementos com a classe 'contatoWpp'
    var contatosWpp = document.querySelectorAll('.contatoWpp');
    
    // Iterando sobre a NodeList e removendo cada elemento
    contatosWpp.forEach(function(contato) {
        contato.parentNode.removeChild(contato);
    });
}

// Função para adicionar os elementos HTML na página
function adicionarContatos() {
    var num_contatos = 0;
    var listaContatosElemento = document.getElementById("lista-contatos");
    var loader = document.querySelector('.loadSheets');

    // Iterando sobre a lista de contatos
    lista.forEach(function(telefone) {
        num_contatos += 1;
        // Criando elementos HTML
        var divGrid = document.createElement("div");
        divGrid.classList.add("grid");
        divGrid.classList.add("contatoWpp");

        var divCell1 = document.createElement("div");
        divCell1.classList.add("cell");
        divCell1.classList.add("num-contato");
        divCell1.textContent = num_contatos; // Conteúdo para a primeira célula

        var divCell2 = document.createElement("div");
        divCell2.classList.add("cell");
        divCell2.classList.add("is-col-span-4");
        var paragrafo = document.createElement("p");
        paragrafo.textContent = telefone; // Formatação do número de telefone
        divCell2.appendChild(paragrafo);

        var divCell3 = document.createElement("div"); //fa-regular fa-square-check
        divCell3.classList.add("cell");
        var checkCell = document.createElement("i");
        checkCell.classList.add("check-contato");
        divCell3.appendChild(checkCell);

        // Adicionando elementos HTML criados à div da lista de contatos
        divGrid.appendChild(divCell1);
        divGrid.appendChild(divCell2);
        divGrid.appendChild(divCell3);
        listaContatosElemento.appendChild(divGrid);

        // Adicionando uma linha horizontal após cada contato
        //var hr = document.createElement("hr");
        //hr.style.width = "100%";
        //hr.classList.add("hr-contato");
        //listaContatosElemento.appendChild(hr);
        
    });

    loader.style.display = 'none';


}


// Função para fazer a requisição ao webhook e manipular a resposta
function Webhook() {

    removerContato();

    var loader = document.querySelector('.loadSheets');

    if(loader.style.display == 'none'){
        loader.style.display = 'block';
    }

    // URL do webhook
    var urlWebhook = "http://localhost:5678/webhook/consultar-contatos";

    // Configuração da requisição
    var requisicao = new XMLHttpRequest();

    // Definindo o método HTTP e a URL
    requisicao.open("GET", urlWebhook, true);

    // Configurando a função a ser chamada quando a resposta for recebida
    requisicao.onreadystatechange = function () {
        // Verificando se a requisição foi concluída e a resposta foi recebida com sucesso
        if (requisicao.readyState === 4 && requisicao.status === 200) {
            // Obtendo a resposta do webhook
            var resposta = JSON.parse(requisicao.responseText);

            // Atribuindo os números de telefone à variável global
            lista = resposta.Tel;

            // Imprimindo a resposta no console
            console.log("Resposta do webhook:", resposta);

            // Imprimindo os números de telefone na resposta
            console.log("Números de telefone:", lista);
            
            adicionarContatos();
            tempoEstimado(lista);
            document.querySelector('.num-total-contatos').textContent = lista.length;
        }
    };

    // Enviando a requisição
    requisicao.send();
}


function showReleaseNotes() {
    document.querySelector('.release-note').style.display = 'flex';
}
function hiddeReleaseNotes(){
    document.querySelector('.release-note').style.display = 'none';
}


// Chamando a função para fazer a requisição ao webhook
Webhook();
