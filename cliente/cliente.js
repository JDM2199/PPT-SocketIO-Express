console.log("cliente.js executing");

const socket = io();
let roomUniqueId = null;
let player1 = false;

// Función para crear una nueva partida
function createGame() {
    player1 = true;
    socket.emit('createGame');
}

// Función para unirse a una partida existente
function joinGame() {
    roomUniqueId = document.getElementById('roomUniqueId').value;
    socket.emit('joinGame', { roomUniqueId: roomUniqueId });
}

// Escucha el evento "newGame" enviado por el servidor
socket.on("newGame", (data) => {
    roomUniqueId = data.roomUniqueId;
    document.getElementById('initial').style.display = 'none';
    document.getElementById('gamePlay').style.display = 'block';
    let copyButton = document.createElement('button');
    copyButton.style.display = 'block';
    copyButton.classList.add('btn', 'btn-primary', 'py-2', 'my-2');
    copyButton.innerText = 'Copiar Código';
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(roomUniqueId).then(function () {
            console.log('Async: Copying to clipboard was successful!');
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    });

    document.getElementById('waitingArea').innerHTML = `Esperando al oponente, comparta el código ${roomUniqueId} para que se una a la partida`;
    document.getElementById('waitingArea').appendChild(copyButton);
});

// Escucha el evento "playersConnected" cuando ambos jugadores están conectados
socket.on("playersConnected", () => {
    document.getElementById('initial').style.display = 'none';
    document.getElementById('waitingArea').style.display = 'none';
    document.getElementById('gameArea').style.display = 'flex';
});

socket.on("p1Choice", (data) => {
    if (!player1) {
        createOpponentChoiceButton(data);
    }
});

socket.on("p2Choice", (data) => {
    if (player1) {
        createOpponentChoiceButton(data);
    }
});

// Escucha el evento "result" para mostrar el resultado del juego
socket.on("result", (data) => {
    let winnerText = '';
    if (data.winner != 'd') {
        if (data.winner == 'p1' && player1) {
            winnerText = 'Ganaste';
        } else if (data.winner == 'p1') {
            winnerText = 'Perdiste';
        } else if (data.winner == 'p2' && !player1) {
            winnerText = 'Ganaste';
        } else if (data.winner == 'p2') {
            winnerText = 'Perdiste';
        }
    } else {
        winnerText = 'Es un empate';
    }
    document.getElementById('opponentState').style.display = 'none';
    document.getElementById('opponentButton').style.display = 'block';
    document.getElementById('winnerArea').innerHTML = winnerText;

    setTimeout(() => {
        location.reload();
    }, 3000);
});

// Función para enviar la elección del jugador (Piedra, Papel, Tijera)
function sendChoice(rpsValue) {
    const choiceEvent = player1 ? "p1Choice" : "p2Choice";
    socket.emit(choiceEvent, {
        rpsValue: rpsValue,
        roomUniqueId: roomUniqueId
    });

    // Crea un botón para mostrar la elección del jugador
    let playerChoiceButton = document.createElement('button');
    playerChoiceButton.style.display = 'block';
    playerChoiceButton.classList.add(rpsValue.toString().toLowerCase());
    playerChoiceButton.innerText = rpsValue;
    document.getElementById('player1Choice').innerHTML = "";
    document.getElementById('player1Choice').appendChild(playerChoiceButton);
}

// Función para mostrar la elección del oponente
function createOpponentChoiceButton(data) {
    document.getElementById('opponentState').innerHTML = "El oponente hizo una elección";
    let opponentButton = document.createElement('button');
    opponentButton.id = 'opponentButton';
    opponentButton.classList.add(data.rpsValue.toString().toLowerCase());
    opponentButton.style.display = 'none';
    opponentButton.innerText = data.rpsValue;
    document.getElementById('player2Choice').appendChild(opponentButton);
}

