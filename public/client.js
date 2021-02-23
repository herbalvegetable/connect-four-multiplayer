//const url = 'http://localhost:5000/';
const url = 'http://link-four.herokuapp.com/';
const socket = io.connect(url);
const ls = window.localStorage;
class Client{
	static id = null;
	static list = [];
}
socket.on('newClient', data=>{
	if(Client.id == null){
		Client.id = data.id;
		for(var roomData of data.roomList){
			addNewRoom(roomData.title, roomData.id);
		}
	}
});

let roomsContainer = document.querySelector('#roomsContainer');
let roomButton = document.querySelector('#roomButton');
let roomTitleInput = document.querySelector('#roomTitle');
roomTitleInput.value = ls.getItem('roomTitle') != null ? ls.getItem('roomTitle') : '';
let outputSpan = document.querySelector('#output');
let playerCountDisplay = document.querySelector('#playerCount');

socket.on('updateClientList', clientList=>{
	Client.list = clientList;
	playerCountDisplay.innerText = `Online: ${clientList.length}`;
});
roomButton.addEventListener('click', ()=>{
	console.log('Create new room');
	var roomId = '';
	for (var i = 0; i < 4; i++) {
		roomId += `${Math.floor(Math.random()*10)}`;
	}
	socket.emit('addRoom', {
		title: roomTitleInput.value != '' ? roomTitleInput.value : `New room ${roomId}`,
		id: Client.id,
	});
});
roomTitleInput.addEventListener('change', ()=>{
	var txt = roomTitleInput.value;
	ls.setItem('roomTitle', txt);
});
function addNewRoom(titleTxt, id){
	var room = document.createElement('div');
	room.setAttribute('class', 'room');
	room.setAttribute('name', id);
	var title = document.createElement('span');
	title.setAttribute('class', 'roomTitle');
	title.innerText = titleTxt;
	room.appendChild(title);
	room.appendChild(document.createElement('br'));
	if(id != Client.id){
		var joinBtn = document.createElement('button');
		joinBtn.innerText = 'Join';
		joinBtn.addEventListener('click', ()=>{
			socket.emit('joinGame', {
				joinerId: Client.id,
				creatorId: id,
			});
		});
		room.appendChild(joinBtn);
	}
	else{
		var text = document.createElement('span');
		text.setAttribute('class', 'roomStatus');
		text.innerText = 'This is your room';
		room.appendChild(text);
	}
	roomsContainer.insertBefore(room, roomsContainer.childNodes[0]);
}
function removeRoom(id){
	for(var room of document.querySelectorAll('.room')){
		if(room.getAttribute('name') == id){
			roomsContainer.removeChild(room);
		}
	}
}
socket.on('addRoom', data=>{
	addNewRoom(data.title, data.id);
	if(Client.id == data.id){
		outputSpan.innerText = `Created room: ${data.title}`;
		outputSpan.style.color = 'rgb(0, 77, 0)';
		roomTitleInput.value = '';
	}
});
socket.on('removeRoom', creatorId=>{
	removeRoom(creatorId);
	if(Client.id == creatorId){
		outputSpan.innerText = '';
	}
});
function switchPage(option){
	var homeEl = document.querySelector('#home');
	switch(option){
		case 0: //switch to game
		homeEl.style.display = 'none';
		canvas.style.display = 'block';
		document.querySelector('html').style.overflow = 'hidden';
		document.body.style.margin = '0px';
		break;
		case 1: //switch to home page
		homeEl.style.display = 'block';
		canvas.style.display = 'none';
		document.querySelector('html').style.overflow = 'auto';
		document.body.style.margin = '8px';
		break;
	}
}
socket.on('joinGame', data=>{
	var ids = [data.joinerId, data.creatorId];
	if(ids.includes(Client.id)){
		console.log('join game');
		switchPage(0);
		Game.id = data.gameId;
		if(Client.id == ids[data.randTurn]){
			Game.clientTurn = 0;
		}
		else{
			Game.clientTurn = 1;
		}
	}
});

