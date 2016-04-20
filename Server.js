var io = require('socket.io').listen(9898);
var Rooms = [];
/*
Room = {
	roomID: string,	//вида R1, R2...
	length: int,	//кол-во игроков в комнате
	WhiteMove: bool,//ходят ли в данный момент белые						//нужно только для соответствия протоколу
	Logs: Array, 	//массив ходов
	Players: Array,	//массив игроков (элемент массива-сокет)				//эти два костыля нужны
	Observers: Array,//массив следящих за игрой (элемент массива-сокет)		//для обработки дисконнекта
	GameIsAlive: bool//идет ли игра в данный момент
}
*/
var VaitingPlayers=[];//элемент массива-сокет


function RoomIDGenerator(){
	this.num = 1;
	this.getID = function(){
		return 'R' + this.num++;
	}
}
var generator = new RoomIDGenerator();

function getRandomInt(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Возвращает массив комнат для передачи подписчику (без лишней информации)
function GetRoomsToClient(){
	var arr=[];
	for(var i=0; i<Rooms.length; i++){
		if(Rooms[i].GameIsAlive){
			console.log('Rooms[i].roomID '+Rooms[i].roomID);
			console.log('Rooms[i].length '+Rooms[i].length);
			arr[arr.length]={
				roomID: Rooms[i].roomID,
				length: Rooms[i].length
			};
		}
	}
	return arr;
}

//Поиск комнаты по ID в массиве Rooms
function FindObjRoom(roomID){
	for(var i=0; i<Rooms.length; i++){
		if(Rooms[i].roomID == roomID){
			return Rooms[i];
		}
	}
	return undefined;
}

function LeaveGame(socket){
	for(var i=0; i<Rooms.length; i++){
		if(SocketInRoomAsPlayer(socket, Rooms[i])){
			LeaveRoom_Player(socket, Rooms[i]);
		}
		if(SocketInRoomAsObserver(socket, Rooms[i])){
			LeaveRoom_Observer(socket, Rooms[i]);
		}
	}
}

function LeaveRoom_Player(socket, Room){
	socket.leave(Room.roomID);
	console.log('* ' + socket.id + ' (игрок) покинул комнату '+Room.roomID+'.');
	Room.length--;
	
	for(var i=0; i<Room.Players.length; i++){
		if(Room.Players[i].id == socket.id){
			Room.Players.splice(i,1);
		}
	}
	
	if(Room.GameIsAlive){
		console.log('* игра в комнате '+Room.roomID+' окончена; причина - один из игроков покинул комнату.');
		io.sockets.in(Room.roomID).emit('game_end', {msg: 'leave', winnerColor: (Room.WhiteMove ? 'black' : 'white')});
		Room.GameIsAlive=false;
		io.sockets.in('Subscribers').emit('roomsList', GetRoomsToClient());
	}	
}

function LeaveRoom_Observer(socket, Room){
	socket.leave(Room.roomID);
	console.log('* ' + socket.id + ' (наблюдатель) покинул комнату '+Room.roomID+'.');
	Room.length--;
	
	for(var i=0; i<Room.Observers.length; i++){
		if(Room.Observers[i].id == socket.id){
			Room.Observers.splice(i,1);
		}
	}
	
	io.sockets.in('Subscribers').emit('roomsList', GetRoomsToClient());
}

function SocketInRoomAsPlayer(socket, Room){
	for(var i=0; i<Room.Players.length; i++){
		if(Room.Players[i].id == socket.id){
			return true;
		}
	}
	return false;
}

function SocketInRoomAsObserver(socket, Room){
	for(var i=0; i<Room.Observers.length; i++){
		if(Room.Observers[i].id == socket.id){
			return true;
		}
	}
	return false;
}

io.sockets.on('connection', function (socket) {
    console.log('** ' + socket.id + ' подключился к серверу.');
	
	socket.on('roomsList_subscribe', function() {
        console.log('* ' + socket.id + ' подписался на просмотр изменений списка комнат.');
        socket.join('Subscribers');
		socket.emit('roomsList', GetRoomsToClient());
    });
	
	socket.on('roomsList_unsubscribe', function() {
        console.log('* ' + socket.id + ' отписался от просмотра изменений списка комнат.');
        socket.leave('Subscribers');
    });	
	
	socket.on('room_enter', function(roomID) {
		var log = '* ' + socket.id + ' попытался войти в комнату '+roomID+'; ';
		var room = FindObjRoom(roomID);
		if(!(room === undefined)){
			log+='вход успешно выполнен.';
			socket.leave('Subscribers');
			socket.join(roomID);
			room.length++;
			room.Observers[room.Observers.length] = socket;
			io.sockets.in('Subscribers').emit('roomsList', GetRoomsToClient());
			socket.emit('game_logs', room.Logs);
		}
		else{
			log+='в доступе отказано; причина - не существует комнаты с таким ID.';
		}
        console.log(log);
    });
	
	socket.on('room_leave', function() {
		LeaveGame(socket);
    });
	
	socket.on('game_find', function() {
		console.log('* ' + socket.id + ' начал поиск игры.');
		if(VaitingPlayers.length==0){
			console.log('* ' + socket.id + ' встал в очередь поиска игры.');
			VaitingPlayers[VaitingPlayers.length]=socket;
		}
		else{
			var socket2=VaitingPlayers[VaitingPlayers.length-1];
			VaitingPlayers.splice(VaitingPlayers.length-1,1);
			var log = '* для ' + socket.id + ' найден партнер: '+socket2.id+'. ';
			
			var newRoom={
				roomID: generator.getID(),
				length: 2,
				WhiteMove: true,
				Logs: [],
				Players: [socket, socket2],
				Observers: [],
				GameIsAlive: true
			};
			Rooms[Rooms.length]=newRoom;
			log+='Для игры создана комната '+newRoom.roomID+'.';
			console.log(log);
			
			socket.join(newRoom.roomID);
			socket2.join(newRoom.roomID);
			
			var color1 = (getRandomInt(0,1) == 1 ? 'white' : 'black');
			var color2 = (color1 === 'white' ? 'black' : 'white');
			
			socket.emit('game_found', {color: color1, roomID: newRoom.roomID});
			socket2.emit('game_found', {color: color2, roomID: newRoom.roomID});
		}
		io.sockets.in('Subscribers').emit('roomsList', GetRoomsToClient());
    });
	
	socket.on('game_stopFinding', function() {
		for(var i=0; i<VaitingPlayers.length; i++){
			if(VaitingPlayers[i].id==socket.id){
				console.log('* ' + socket.id + ' покинул очередь поиска игры.');
				VaitingPlayers.splice(i,1);
			}
		}
    });
	
	socket.on('turn_move', function(data) {
        console.log(socket.id + ' делает ход '+data.from.x+data.from.y+' - '+data.to.x+data.to.y+'.');
		for (var room in socket.rooms) {
			if (room[0] == 'R'){
				var objRoom = FindObjRoom(room);
				
				socket.broadcast.to(room).emit('player_move', {
					playerColor: (objRoom.WhiteMove ? 'white' : 'black'), 
					from: {
						x: data.from.x,
						y: data.from.y
					},
					to: {
						x: data.to.x,
						y: data.to.y
					}
				});
				
				objRoom.WhiteMove=!objRoom.WhiteMove;
				objRoom.Logs[objRoom.Logs.length] = {
					moveType: 'move',
					moveData: data
				}
			}
		}
		
    });

	socket.on('turn_castling', function(data) {
        console.log(socket.id + ' делает рокировку с ладьей на '+data.from.x+data.from.y+'.');
		for (var room in socket.rooms) {
			if (room[0] == 'R'){
				var objRoom = FindObjRoom(room);
				
				socket.broadcast.to(room).emit('player_castling', {
					playerColor: (objRoom.WhiteMove ? 'white' : 'black'), 
					from: {
						x: data.from.x,
						y: data.from.y
					}
				});
				
				objRoom.WhiteMove=!objRoom.WhiteMove;
				objRoom.Logs[objRoom.Logs.length] = {
					moveType: 'castling',
					moveData: data
				}
			}
		}	
    });
	
	socket.on('turn_promotion', function(data) {
        console.log(socket.id + ' делает ход пешкой '+data.from.x+data.from.y+' - '+data.to.x+data.to.y+' и превращает ее в фигуру '+data.newPiece+'.');
		for (var room in socket.rooms) {
			if (room[0] == 'R'){
				var objRoom = FindObjRoom(room);
				
				socket.broadcast.to(room).emit('player_promotion', {
					playerColor: (objRoom.WhiteMove ? 'white' : 'black'), 
					from: {
						x: data.from.x,
						y: data.from.y
					},
					to: {
						x: data.to.x,
						y: data.to.y
					},
					newPiece: data.newPiece
				});
				
				objRoom.WhiteMove=!objRoom.WhiteMove;
				objRoom.Logs[objRoom.Logs.length] = {
					moveType: 'promotion',
					moveData: data
				}
			}
		}
		
    });

	socket.on('turn_mate', function() {
        console.log(socket.id + ' сообщил, что ему поставлен мат.');
		for (var room in socket.rooms) {
			if (room[0] == 'R'){
				var objRoom = FindObjRoom(room);
				
				socket.broadcast.to(room).emit('player_mate');
				
				objRoom.WhiteMove=!objRoom.WhiteMove;
			}
		}	
    });
	
	socket.on('turn_draw', function() {
        console.log(socket.id + ' сообщил, что ему поставлен пат.');
		for (var room in socket.rooms) {
			if (room[0] == 'R'){		
				var objRoom = FindObjRoom(room);
				
				socket.broadcast.to(room).emit('player_draw');
				
				objRoom.WhiteMove=!objRoom.WhiteMove;
			}
		}	
    });
	
	socket.on('turnValidation_invalid', function() {
        console.log(socket.id + ' сообщил, что предыдущий ход соперника был некорректен.');
		for (var room in socket.rooms) {
			if (room[0] == 'R'){
				var objRoom = FindObjRoom(room);
				
				console.log('* игра в комнате '+room+' окончена; причина - один из игроков сделал некорректный, по мнению соперника, ход.');
				io.sockets.in(room).emit('game_end', {msg: 'invalid turn', winnerColor: (objRoom.WhiteMove ? 'white' : 'black')});
				objRoom.GameIsAlive=false;
				
				io.sockets.in('Subscribers').emit('roomsList', GetRoomsToClient());
			}
		}	
    });
	
	socket.on('turnValidation_mate', function() {
        console.log(socket.id + ' подтвердил, что сопернику поставлен мат.');
		for (var room in socket.rooms) {
			if (room[0] == 'R'){
				var objRoom = FindObjRoom(room);
				
				console.log('* игра в комнате '+room+' окончена; причина - одному из игроков поставлен мат.');
				io.sockets.in(room).emit('game_end', {msg: 'mate', winnerColor: (objRoom.WhiteMove ? 'white' : 'black')});
				objRoom.GameIsAlive=false;
				
				io.sockets.in('Subscribers').emit('roomsList', GetRoomsToClient());
			}
		}	
    });
	
	socket.on('turnValidation_draw', function() {
        console.log(socket.id + ' подтвердил, что сопернику поставлен пат.');
		for (var room in socket.rooms) {
			if (room[0] == 'R'){
				var objRoom = FindObjRoom(room);
				
				console.log('* игра в комнате '+room+' окончена; причина - патовая ситуация.');
				io.sockets.in(room).emit('game_end', {msg: 'draw', winnerColor: null});
				objRoom.GameIsAlive=false;
				
				io.sockets.in('Subscribers').emit('roomsList', GetRoomsToClient());
			}
		}	
    });
	
    socket.on('disconnect', function() {
		LeaveGame(socket);
		console.log('** ' + socket.id + ' отключился от сервера.');
    });
});