// Importamos las dependencias necesarias
const express = require('express'); 
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


const rooms = {};

app.use(express.static(path.join(__dirname, 'cliente')));
app.get('/healthcheck', (req, res) => {
    res.send('<h1>Aplicación en ejecución PPT...</h1>');
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/cliente/index.html');
});

// Manejo de eventos de conexión con Socket.IO
io.on('connection', (socket) => {
    console.log('Usuario conectado');
    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    // Evento para crear una nueva sala de juego
    socket.on('createGame', () => {
        const roomUniqueId = makeid(6);
        rooms[roomUniqueId] = {};
        socket.join(roomUniqueId); 
        socket.emit("newGame", {roomUniqueId: roomUniqueId});
    });

    // Evento para que un jugador se una a una sala existente
    socket.on('joinGame', (data) => {
        if (rooms[data.roomUniqueId] != null) { 
            socket.join(data.roomUniqueId);
            socket.to(data.roomUniqueId).emit("playersConnected", {});
            socket.emit("playersConnected");
        }
    });

    socket.on("p1Choice", (data) => {
        let rpsValue = data.rpsValue;
        rooms[data.roomUniqueId].p1Choice = rpsValue;
        socket.to(data.roomUniqueId).emit("p1Choice", {rpsValue: data.rpsValue});
        if (rooms[data.roomUniqueId].p2Choice != null) {
            declareWinner(data.roomUniqueId);
        }
    });

    socket.on("p2Choice", (data) => {
        let rpsValue = data.rpsValue;
        rooms[data.roomUniqueId].p2Choice = rpsValue;
        socket.to(data.roomUniqueId).emit("p2Choice", {rpsValue: data.rpsValue});
        if (rooms[data.roomUniqueId].p1Choice != null) {
            declareWinner(data.roomUniqueId);
        }
    });
});

// Función para determinar el ganador del juego
function declareWinner(roomUniqueId) {
    let p1Choice = rooms[roomUniqueId].p1Choice;
    let p2Choice = rooms[roomUniqueId].p2Choice;
    let winner = null;

    // Lógica para determinar el ganador según las reglas de Piedra, Papel o Tijera
    if (p1Choice === p2Choice) {
        winner = "d";
    } else if (p1Choice == "Papel") {
        if (p2Choice == "Tijera") {
            winner = "p2";
        } else {
            winner = "p1";
        }
    } else if (p1Choice == "Piedra") {
        if (p2Choice == "Papel") {
            winner = "p2";
        } else {
            winner = "p1";
        }
    } else if (p1Choice == "Tijera") {
        if (p2Choice == "Piedra") {
            winner = "p2";
        } else {
            winner = "p1";
        }
    }

    io.sockets.to(roomUniqueId).emit("result", {
        winner: winner
    });

    rooms[roomUniqueId].p1Choice = null;
    rooms[roomUniqueId].p2Choice = null;
}

server.listen(3000, () => {
    console.log('listening on *:3000');
});

// Función para generar un ID único para las salas
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
