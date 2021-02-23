var canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	Grid.set();
	Chip.set();
	Game.homeButton.set();
});
canvas.addEventListener('contextmenu', e=>{
	if(e.button == 2){
		e.preventDefault();
	}
});
let key = {};
window.addEventListener('keydown', e=>{
	key[e.keyCode] = true;
});
window.addEventListener('keyup', e=>{
	key[e.keyCode] = false;
});
let mouse = {};
canvas.addEventListener('mousemove', e=>{
	mouse.x = e.clientX;
	mouse.y = e.clientY;
});
canvas.addEventListener('mousedown', e=>{
	if(e.button == 0){
		mouse.down = true;
	}
	if(e.button == 2){
		mouse.rightClick = true;
	}
});
canvas.addEventListener('mouseup', e=>{
	if(e.button == 0){
		mouse.down = false;
		Game.canClick = true;
	}
	if(e.button == 2){
		mouse.rightClick = false;
	}
});
var bgColour = 'dodgerblue';
let gridWindowImg = new Image();
gridWindowImg.src = 'gridWindow.png';
let arrowImg = new Image();
arrowImg.src = 'arrow.png';

class Game{
	static id = null;
	static clientTurn = null;
	static turnIndex = 0;
	static canClick = true;
	static displayClientTurn(){
		ctx.fillStyle = Chip.styles[Game.clientTurn].colour[0];
		ctx.font = `50px Gaegu`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		var text = `You are ${Chip.names[Game.clientTurn]}`;
		ctx.fillText(text, canvas.width/6, canvas.height/2);
	}
	static displayTurn(){
		ctx.fillStyle = Chip.styles[Game.turnIndex].colour[0];
		ctx.font = `50px Gaegu`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		var text = `${Chip.names[Game.turnIndex]}\'s turn`;
		ctx.fillText(text, canvas.width/2, 90);
	}
	static winner = null;
	static displayWinner(){
		if(this.winner != null){
			if(Grid.winnerList.length > 0){
				var gridStart = Grid.winnerList[0];
				var gridEnd = Grid.winnerList[Grid.winnerList.length-1];
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 10;
				ctx.lineCap = 'round';
				ctx.setLineDash([20, 20]);
				ctx.beginPath();
				ctx.moveTo(gridStart.x, gridStart.y);
				ctx.lineTo(gridEnd.x, gridEnd.y);
				ctx.stroke();
				ctx.closePath();
			}
			var x = canvas.width/2;
			var y = 90;
			ctx.font = `50px Gaegu`;
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'rgb(57, 230, 0)';
			ctx.textAlign = 'right';
			ctx.fillText('Winner: ', x, y);
			ctx.fillStyle = Chip.styles[this.winner].colour[0];
			ctx.textAlign = 'left';
			ctx.fillText(Chip.names[Game.winner], x, y);
		}
	}
	static homeButton = {
		x: canvas.width/4*3,
		y: canvas.height/2,
		width: Math.min(canvas.width, canvas.height)/9,
		height: Math.min(canvas.width, canvas.height)/9,
		set: ()=>{
			var hb = this.homeButton;
			hb.x = canvas.width/4*3;
			hb.y = canvas.height/2;
			hb.width = hb.height = Math.min(canvas.width, canvas.height)/9;
		},
		style: {
			img: arrowImg,
			colour: ['black', null, 2],
		},
	}
	static displayHomeButton(){
		if(this.homeButton.style.img != null){
			ctx.drawImage(this.homeButton.style.img, this.homeButton.x-this.homeButton.width/2, this.homeButton.y-this.homeButton.height/2, this.homeButton.width, this.homeButton.height);
		}
		else{
			ctx.fillStyle = this.homeButton.style.colour[0];
			ctx.strokeStyle = this.homeButton.style.colour[1];
			ctx.lineWidth = this.homeButton.style.colour[2];
			if(this.homeButton.style.colour[0] != null){
				ctx.fillRect(this.homeButton.x-this.homeButton.width/2, this.homeButton.y-this.homeButton.height/2, this.homeButton.width, this.homeButton.height);
			}
			if(this.homeButton.style.colour[1] != null){
				ctx.strokeRect(this.homeButton.x-this.homeButton.width/2, this.homeButton.y-this.homeButton.height/2, this.homeButton.width, this.homeButton.height);
			}
		}
		this.checkMouseWithinHomeButton = ()=>{
			if(mouse.x > this.homeButton.x - this.homeButton.width/2 && mouse.x < this.homeButton.x + this.homeButton.width/2 && mouse.y > this.homeButton.y - this.homeButton.height/2 && mouse.y < this.homeButton.y + this.homeButton.height/2){
				return true;
			}
			else{
				return false;
			}
		}
		if(this.checkMouseWithinHomeButton() && mouse.down){
			switchPage(1);
		}
	}
}
socket.on('placeChip', data=>{
	if(Game.id == data.gameId){
		Game.turnIndex = data.turn;
		var coords = data.options.coords;
		var grid = Grid.list[coords.y][coords.x];
		var options = {
			grid: grid,
			x: Grid.list[0][data.options.indexes[0]].x,
			y: Grid.list[0][0].y - Grid.list[0][0].height/2,
			l: grid.width,
			turnIndex: data.options.turnIndex,
			style: data.options.style,
		};
		Chip.add(options);
	}
});
class Grid{
	static list = []; //6x7
	static rows = 6;//6
	static cols = 7;//7
	static l = Math.floor(Math.min(canvas.width, canvas.height/6*4)/Math.max(this.rows, this.cols));
	static defaultOptions = {
		width: this.l > 100 ? 100 : this.l,
		height: this.l > 100 ? 100 : this.l,
		style: {
			img: null,
			colour: [bgColour, null, 2],
		},
	}
	static winnerList = [];
	static init(){
		for (var i = 0; i < this.rows; i++) {
			var row = [];
			for (var j = 0; j < this.cols; j++) {
				var x = (canvas.width - this.defaultOptions.width*this.cols)/2 + this.defaultOptions.width*(j+0.5);
				var y = (canvas.height - this.defaultOptions.height*this.rows)/2 + this.defaultOptions.height*(i+0.5);
				var options = {...this.defaultOptions, indexes: [j, i]};
				row.push(new Grid(x, y, options));
			}
			this.list.push(row);
		}
	}
	static set(){
		for (var i = 0; i < this.list.length; i++) {
			for (var j = 0; j < this.list[i].length; j++) {
				var grid = this.list[i][j];
				grid.x = (canvas.width - grid.width*this.cols)/2 + grid.width*(j+0.5);
				grid.y = (canvas.height - grid.height*this.rows)/2 + grid.height*(i+0.5);
			}
		}
	}
	static create(){
		for (var i = 0; i < this.list.length; i++) {
			for (var j = 0; j < this.list[i].length; j++) {
				this.list[i][j].create();
			}
		}
	}
	static onHover(){
		for (var i = 0; i < this.list.length; i++) {
			for (var j = 0; j < this.list[i].length; j++) {
				this.list[i][j].onHover();
			}
		}
	}
	static showWindow(){
		ctx.beginPath();
		for (var i = 0; i < this.list.length; i++) {
			for (var j = 0; j < this.list[i].length; j++) {//this.list[i][j]
				var grid = this.list[i][j];
				var r = grid.width/2*0.835;
				ctx.moveTo(grid.x + r, grid.y);
				ctx.arc(grid.x, grid.y, r, 0, Math.PI*2);
			}
		}
		ctx.clip();
		ctx.closePath();
		background(bgColour);
	}
	static drawGridWindowImg(){
		for (var i = 0; i < this.list.length; i++) {
			for (var j = 0; j < this.list[i].length; j++) {//this.list[i][j]
				var grid = this.list[i][j];
				ctx.drawImage(gridWindowImg, grid.x-grid.width/2, grid.y-grid.height/2, grid.width, grid.height);
			}
		}
	}
	static getBottomGrid(colIndex){
		var bottomGrid = null;
		for (var j = 0; j < this.list.length; j++) {
			var grid = this.list[j][colIndex];
			if(grid.chip == null){
				bottomGrid = grid;
			}
		}
		return bottomGrid;
	}
	static getBottomGridCoords(colIndex){
		var coords = {x: colIndex};
		for (var j = 0; j < this.list.length; j++) {
			var grid = this.list[j][colIndex];
			if(grid.chip == null){
				coords.y = j;
			}
		}
		return coords;
	}
	constructor(x, y, options){
		this.x = x;
		this.y = y;
		this.width = options.width;
		this.height = options.height;
		this.style = {...options.style};
		this.indexes = options.indexes;
		this.chip = null;
		this.create = ()=>{
			if(this.style.img != null){
				ctx.drawImage(this.style.img, this.x-this.width/2, this.y-this.height/2, this.width, this.height);
			}
			else{
				ctx.fillStyle = this.style.colour[0];
				ctx.strokeStyle = this.style.colour[1];
				ctx.lineWidth = this.style.colour[2];
				if(this.style.colour[0] != null){
					ctx.fillRect(this.x-this.width/2, this.y-this.height/2, this.width, this.height);
				}
				if(this.style.colour[1] != null){
					ctx.strokeRect(this.x-this.width/2, this.y-this.height/2, this.width, this.height);
				}
			}
			ctx.drawImage(gridWindowImg, this.x-this.width/2, this.y-this.height/2, this.width, this.height);
			if(Game.winner == null){
				this.onClick();
				if(this.chip != null && Chip.list.length >= 4){
					Grid.winnerList = this.checkWinner();
				}
			}
		}
		this.onHover = ()=>{
			if(this.checkMouse()){
				var bottomGrid = Grid.getBottomGrid(this.indexes[0]);
				if(bottomGrid != null){
					var hoverColour = 'rgba(255, 255, 255, 0.5)';
					ctx.fillStyle = hoverColour;
					ctx.strokeStyle = hoverColour;
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.arc(bottomGrid.x, bottomGrid.y, bottomGrid.width/2, 0, Math.PI*2);
					ctx.fill();
					ctx.stroke();
					ctx.closePath();
				}
			}
		}
		this.onClick = ()=>{ //CARE
			if(this.checkMouse() && mouse.down && Game.canClick && Game.clientTurn == Game.turnIndex){
				var bottomGrid = Grid.getBottomGrid(this.indexes[0]);
				if(bottomGrid != null){
					Game.canClick = false;
					var options = {
						/*
						x: Grid.list[0][this.indexes[0]].x,
						y: Grid.list[0][0].y - Grid.list[0][0].width/2 - bottomGrid.width/2,
						l: bottomGrid.width,
						*/
						indexes: this.indexes,
						coords: Grid.getBottomGridCoords(this.indexes[0]),
						turnIndex: Game.turnIndex,
						style: Chip.styles[Game.turnIndex],
					}
					socket.emit('placeChip', {
						gameId: Game.id,
						options: options,
					});
				}
			}
		}
		this.checkWinner = ()=>{
			var lineList = [];
			var winnerList = [];
			var north = [];
			var northEast = [];
			var east = [];
			var southEast = [];
			var south = [];
			var southWest = [];
			var west = [];
			var northWest = [];
			for (var i = 0; i < 4; i++) {
				try{
					north.push(Grid.list[this.indexes[1]-i][this.indexes[0]]);
				}catch{}
				if(north.length == 4){
					lineList.push(north);
				}
				try{
					northEast.push(Grid.list[this.indexes[1]-i][this.indexes[0]+i]);
				}catch{}
				if(northEast.length == 4){
					lineList.push(northEast);
				}
				try{
					east.push(Grid.list[this.indexes[1]][this.indexes[0]+i]);
				}catch{}
				if(east.length == 4){
					lineList.push(east);
				}
				try{
					southEast.push(Grid.list[this.indexes[1]+i][this.indexes[0]+i]);
				}catch{}
				if(southEast.length == 4){
					lineList.push(southEast);
				}
				try{
					south.push(Grid.list[this.indexes[1]+i][this.indexes[0]]);
				}catch{}
				if(south.length == 4){
					lineList.push(south);
				}
				try{
					southWest.push(Grid.list[this.indexes[1]+i][this.indexes[0]-i]);
				}catch{}
				if(southWest.length == 4){
					lineList.push(southWest);
				}
				try{
					west.push(Grid.list[this.indexes[1]][this.indexes[0]-i]);
				}catch{}
				if(west.length == 4){
					lineList.push(west);
				}
				try{
					northWest.push(Grid.list[this.indexes[1]-i][this.indexes[0]-i]);
				}catch{}
				if(northWest.length == 4){
					lineList.push(northWest);
				}
			}
			for(var line of lineList){
				var count = 0;
				var winner = null;
				for(var grid of line){
					if(grid != undefined && grid.chip != null){
						switch(grid.chip.turnIndex){
							case 0:
							count += 1;
							if(count == 4){
								Game.winner = 0;
							}
							break;
							case 1:
							count -= 1;
							if(count == -4){
								Game.winner = 1;
							}
							break;
						}
					}
					if(Game.winner != null){
						winnerList = line;
						break;
					}
				}
				if(Game.winner != null){
					break;
				}
			}
			return winnerList;
		}
		this.checkMouse = ()=>{
			if(mouse.x > this.x - this.width/2 && mouse.x < this.x + this.width/2 && mouse.y > this.y - this.height/2 && mouse.y < this.y + this.height/2){
				return true;
			}
			else{
				return false;
			}
		}
	}
}
class Chip{
	static names = ['Red', 'Yellow'];
	static styles = [
		{
			img: null,
			colour: ['red', 'red', 2],
		},
		{
			img: null,
			colour: ['yellow', 'yellow', 2],
		},
	];
	static list = [];
	static add(options){
		let chip = new Chip(options);
		this.list.push(new Chip(options));
		options.grid.chip = chip;
	}
	static rmv(chip){
		chip.grid.chip = null;
		this.list.splice(this.list.indexOf(chip), 1);
	}
	static create(){
		for (var i = 0; i < this.list.length; i++) {
			if(this.list[i].remove){
				this.list.splice(i, 1);
			}
			else{
				this.list[i].create();
			}
		}
	}
	static set(){
		for (var i = 0; i < this.list.length; i++) {
			var chip = this.list[i];
			chip.x = chip.grid.x;
			chip.y = chip.grid.y;
			chip.l = chip.grid.width;
		}
	}
	constructor(options){
		this.grid = options.grid;
		this.x = options.x != undefined ? options.x : this.grid.x;
		this.y = options.y != undefined ? options.y : this.grid.y;
		this.l = options.l;
		this.rot = options.rot != undefined ? options.rot : 0;
		this.turnIndex = options.turnIndex;
		this.style = options.style;
		this.create = ()=>{
			ctx.translate(this.x, this.y);
			ctx.rotate(this.rot);
			if(this.style.img != null){
				ctx.drawImage(this.style.img, -this.l/2, -this.l/2, this.l, this.l);
			}
			else{
				ctx.fillStyle = this.style.colour[0];
				ctx.strokeStyle = this.style.colour[1];
				ctx.lineWidth = this.style.colour[2];
				ctx.beginPath();
				ctx.arc(0, 0, this.l/2, 0, Math.PI*2);
				if(this.style.colour[0] != null){
					ctx.fill();
				}
				if(this.style.colour[1] != null){
					ctx.stroke();
				}
				ctx.closePath();
			}
			ctx.rotate(-this.rot);
			ctx.translate(-this.x, -this.y);
			this.moveToGrid();
		}
		this.moveToGrid = ()=>{
			var xDist = this.grid.x - this.x;
			var yDist = this.grid.y - this.y;
			var dist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
			var rot = Math.atan2(yDist, xDist);
			var gravity = 9.81;
			if(dist < Math.ceil(gravity)){
				this.x = this.grid.x;
				this.y = this.grid.y;
			}
			else{
				this.x += Math.cos(rot) * gravity;
				this.y += Math.sin(rot) * gravity;
			}
		}
	}
}
Grid.init();

function background(colour){
	ctx.fillStyle = colour;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function loop(){
	if(canvas.style.display != 'none'){
		requestAnimationFrame(loop);
		ctx.save();
		background(bgColour);
		Grid.create();
		if(Game.clientTurn != null){
			Game.displayClientTurn();
		}
		if(Game.winner == null){
			Game.displayTurn();
		}
		Grid.showWindow();
		Chip.create();
		if(Game.winner == null){
			Grid.onHover();
		}
		Grid.drawGridWindowImg();
		ctx.restore();
		if(Game.winner != null){
			Game.displayWinner();
			Game.displayHomeButton();
		}
	}
}
loop();