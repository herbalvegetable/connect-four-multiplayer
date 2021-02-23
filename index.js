const express = require('express');
const socket = require('socket.io');

const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(port, ()=>{
	console.log(`Server listening to port ${port}`);
});
app.use(express.static('public'));

const io = socket(server);

class Client{
	static list = [];
	static updateClientList(){
		io.emit('updateClientList', this.list);
	}
}
class Room{
	static list = [];
}
class Game{
	static list = [];
	static getGameData(gameId){
		for(var game of this.list){
			if(game.id == gameId){
				return game;
			}
		}
	}
	static changeTurn(gameId){
		var game = this.getGameData(gameId);
		game.turn += 1;
		if(game.turn > 1){
			game.turn = 0;
		}
	}
}
io.on('connection', socket=>{
	console.log(`Client connected: ${socket.id}`);
	Client.list.push(socket.id);
	Client.updateClientList();
	//CLIENT CODE
	io.emit('newClient', {
		id: socket.id,
		roomList: Room.list,
	});
	socket.on('addRoom', data=>{
		var canCreate = true;
		for(var roomData of Room.list){
			if(data.id == roomData.id){
				canCreate = false;
			}
		}
		if(canCreate){
			Room.list.push(data);
			io.emit('addRoom', data);
		}
	});
	socket.on('joinGame', data=>{
		for(var roomData of Room.list){
			if(roomData.id == data.creatorId){
				Room.list.splice(Room.list.indexOf(roomData));
				break;
			}
		}
		io.emit('removeRoom', data.creatorId);
		var gameData = {
			id: data.creatorId,
			turn: 0,
			winner: null,
		}
		Game.list.push(gameData);
		io.emit('joinGame', {...data, randTurn: Math.floor(Math.random()*2), gameId: gameData.id});
	});
	socket.on('disconnect', ()=>{
		console.log(`Disconnected: ${socket.id}`);
		Client.list.splice(Client.list.indexOf(socket.id));
		Client.updateClientList();
	});
	//GAME CODE
	socket.on('placeChip', data=>{
		Game.changeTurn(data.gameId);
		io.emit('placeChip', {...data, turn: Game.getGameData(data.gameId).turn});
	});
});