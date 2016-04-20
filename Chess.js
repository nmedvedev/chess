var Columns = 'abcdefgh'.split('');
var SquareSize = 80;
var BoardSize = 8*SquareSize;
var Matrix;
var NowMove = 'white';
var SelectedFigure = undefined;
var HistoryMoves = [];
var generator;
var tmpFigure = undefined;//��� ����������� �����



var MyColor;
var Castling=false;//����, ������������, ��� �� ���. ��� ���������� (������� ��� ������������ ���������)
//var socket = io.connect('http://192.168.20.115:9898');
var socket = io.connect('http://localhost:9898');

function MoveFromServer_Move(data){
	NowMove=data.playerColor;
	var _rs=data.from.y-1, _cs=SymbolToCoord(data.from.x),
		_rt=data.to.y-1, _ct=SymbolToCoord(data.to.x);
	var _target = $('div.board > div.square[data-row="'+_rt+'"][data-column="'+_ct+'"]')[0];
	SelectedFigure = Matrix[_rs][_cs];
	if(!(SelectedFigure==undefined) && CheckCorrectness(SelectedFigure,_target,Matrix)){
		var newMove = {
			figure: SelectedFigure,
			rs: SelectedFigure.row,
			cs: SelectedFigure.column,
			rt: _rt,
			ct: _ct
		};
		HistoryMoves[HistoryMoves.length] = newMove;
		
		Matrix[_rt][_ct]=SelectedFigure;
		Matrix[SelectedFigure.row][SelectedFigure.column]=undefined;
		SelectedFigure.row = _rt; SelectedFigure.column = _ct;
		
		ChangeMove();
		RefreshBoard();
		
		//���
		if(CheckMate(NowMove,Matrix)){
			socket.emit('turn_mate');
			return;
		}
		//���
		if(CheckToTheKing(NowMove,Matrix)){
			var str=(NowMove === 'white' ? '�����' : '׸����');
			str+=' �������� ���.';
			alert(str);	
		}
		//���
		if(CheckStalemate(NowMove,Matrix)){
			socket.emit('turn_draw');
			return;
		}
		
		SelectedFigure=undefined;	
	}
	else{
		socket.emit('turnValidation_invalid');
	}
}

function MoveFromServer_Castling(data){
	//NowMove=data.playerColor;
	var _rt=data.from.y-1, _ct=SymbolToCoord(data.from.x);
	//����������� �-���������� ������� �����, ���������� � �������, � ���������� ������� ������ ������
	if(_ct==7) _ct=6;
	if(_ct==0) _ct=2;
	
	var _target = $('div.board > div.square[data-row="'+_rt+'"][data-column="'+_ct+'"]')[0];
	SelectedFigure = FindKing(NowMove,Matrix);
	if(!(SelectedFigure==undefined) && CheckCorrectness(SelectedFigure,_target,Matrix)){
		var newMove = {
			figure: SelectedFigure,
			rs: SelectedFigure.row,
			cs: SelectedFigure.column,
			rt: _rt,
			ct: _ct
		};
		HistoryMoves[HistoryMoves.length] = newMove;
		
		Matrix[_rt][_ct]=SelectedFigure;
		Matrix[SelectedFigure.row][SelectedFigure.column]=undefined;
		SelectedFigure.row = _rt; SelectedFigure.column = _ct;
		
		ChangeMove();
		RefreshBoard();
		
		//���
		if(CheckMate(NowMove,Matrix)){
			socket.emit('turn_mate');
			return;
		}
		//���
		if(CheckToTheKing(NowMove,Matrix)){
			var str=(NowMove === 'white' ? '�����' : '׸����');
			str+=' �������� ���.';
			alert(str);	
		}
		//���
		if(CheckStalemate(NowMove,Matrix)){
			socket.emit('turn_draw');
			return;
		}
		
		SelectedFigure=undefined;	
	}
	else{
		socket.emit('turnValidation_invalid');
	}
}

function MoveFromServer_Promotion(data){
	//NowMove=data.playerColor;
	var _rs=data.from.y-1, _cs=SymbolToCoord(data.from.x),
		_rt=data.to.y-1, _ct=SymbolToCoord(data.to.x)
	var _target = $('div.board > div.square[data-row="'+_rt+'"][data-column="'+_ct+'"]')[0];
	SelectedFigure = Matrix[_rs][_cs];
	if(!(SelectedFigure==undefined) && CheckCorrectness(SelectedFigure,_target,Matrix)){
		var newMove = {
			figure: SelectedFigure,
			rs: SelectedFigure.row,
			cs: SelectedFigure.column,
			rt: _rt,
			ct: _ct
		};
		HistoryMoves[HistoryMoves.length] = newMove;
		
		SelectedFigure = {ID: generator.getID(), Type: (data.newPiece == 'rook' ? 'castle' : data.newPiece), Color: data.playerColor, row: _rt, column: _ct};
		Matrix[_rt][_ct]=SelectedFigure;
		Matrix[_rs][_cs]=undefined;
		
		ChangeMove();
		RefreshBoard();
		
		//���
		if(CheckMate(NowMove,Matrix)){
			socket.emit('turn_mate');
			return;
		}
		//���
		if(CheckToTheKing(NowMove,Matrix)){
			var str=(NowMove === 'white' ? '�����' : '׸����');
			str+=' �������� ���.';
			alert(str);	
		}
		//���
		if(CheckStalemate(NowMove,Matrix)){
			socket.emit('turn_draw');
			return;
		}
		
		SelectedFigure=undefined;	
	}
	else{
		socket.emit('turnValidation_invalid');
	}
}

socket.on('game_found', function(data) {
	alert('���� �������! ��� ����: '+(data.color === 'white' ? '�����.' : '������.'));
	MyColor=data.color;
	Document_state3();
});
socket.on('player_move', MoveFromServer_Move);
socket.on('player_castling', MoveFromServer_Castling);
socket.on('player_promotion', MoveFromServer_Promotion);
socket.on('player_mate', function() {
	if(CheckMate(NowMove,Matrix)){
		socket.emit('turnValidation_mate');
	}
	else{
		socket.emit('turnValidation_invalid');
	}
});
socket.on('player_draw', function() {
	if(CheckStalemate(NowMove,Matrix)){
		socket.emit('turnValidation_draw');
	}
	else{
		socket.emit('turnValidation_invalid');
	}
});
socket.on('game_end', function(data) {
	var log='���� ��������! �������: ';
	if(data.msg=='leave'){
		log+='���� �� ������� ������� �������';
	}
	if(data.msg=='mate'){
		log+='��������� ���';
	}
	if(data.msg=='draw'){
		log+='������� ��������';
	}
	if(data.msg=='invalid turn'){
		log+='������������ ��� '+(data.winnerColor === 'white' ? '������' : '�����');
	}
	log+='; ����������: ';
	if(data.winnerColor=='white'){
		log+='�����.';
	}
	if(data.winnerColor=='black'){
		log+='������.';
	}
	if(data.winnerColor==null){
		log+='�� ��������.';
	}
	alert(log);
	$('div.board > div.square').off('click');
});
socket.on('roomsList', function(rooms) {
	$('body').empty();
	$('body').html('<table id="RoomsTable" width="450" border="1" cellspacing="0" cellpadding="5">'+
	'<tr><th scope="col">ID �������</th><th scope="col">���-�� �����</th><th scope="col">&nbsp;</th></tr></table>'+
	'<div class="RoomsListUnsubscribeButton" ' +
	'style="width: 90px; height: 22px; '+
	'float: top; cursor: pointer; border: 1px solid black"><b>����������</b></div>\n');
	for(var i=0; i<rooms.length; i++){
		$('table#RoomsTable').html($('table#RoomsTable').html()+
		' <tr><td>'+rooms[i].roomID+'</td>'+
		' <td>'+rooms[i].length+'</td>'+
		' <td><div class="RoomEnterButton"'+
		' style = "float: top; cursor: pointer; border: 1px solid black"'+
		' data-roomID = "'+rooms[i].roomID+'">��������</div></td></tr> '
		);
	}
	$('div.RoomEnterButton').click(RoomEnterButton_click);
	$('div.RoomsListUnsubscribeButton').click(RoomsListUnsubscribeButton_click);
});
socket.on('game_logs', function(data) {
	for(var i=0; i<data.length; i++){
		if(data[i].moveType == 'move'){
			MoveFromServer_Move(data[i].moveData);
		}
		if(data[i].moveType == 'castling'){
			MoveFromServer_Castling(data[i].moveData);
		}
		if(data[i].moveType == 'promotion'){
			MoveFromServer_Promotion(data[i].moveData);
		}
	}
});

//��������� ID ��� �����
function IDGenerator(){
	this.num = 1;
	this.getID = function(){
		return this.num++;
	}
} 

//��� ����������� �������
Object.prototype.clone = function() {
	if(this.nodeName=="DIV") return this;
	var newObj = (this instanceof Array) ? [] : {};
	for (i in this) {
		if (i == 'clone')
			continue;
		if (this[i] && typeof this[i] == "object"){
			newObj[i] = this[i].clone();
		}
		else
			newObj[i] = this[i]
	}
	return newObj;
};

//���������� ��� �������� ��������
function Main(){
	generator = new IDGenerator();
	Document_state1();
}

//���������� ���� � ��������� "����� ������� ����"
function Document_state1(){
	$('body').empty();
	document.write('<div class="GameFindButton" ' +
		'style="width: 90px; height: 22px; '+
		'float: top; cursor: pointer; border: 1px solid black"><b>����� ����</b></div>\n'+
		'<div class="RoomsListButton" ' +
		'style="width: 300px; height: 22px; '+
		'float: top; cursor: pointer; border: 1px solid black"><b>����������� �� �������� ������ ������</b></div>\n');
	$('div.GameFindButton').click(GameFindButton_click);
	$('div.RoomsListButton').click(RoomsListButton_click);
}

//���������� ���� � ��������� "� �������� ������ ����"
function Document_state2(){
	$('body').empty();
	document.write('������� �����...');
	document.write('<div class="StopFindingButton" ' +
		'style="width: 140px; height: 22px; '+
		'float: top; cursor: pointer; border: 1px solid black"><b>���������� �����</b></div>\n');
	$('div.StopFindingButton').click(StopFindingButton_click);
}

//���������� ���� � ��������� "���� ����"
function Document_state3(){
	$('body').empty();
	document.write('<div id="wrap"></div> <div id="selectFigureWindow"></div>');
	var sfw = $('div#selectFigureWindow'), w=$('div#wrap');
	w.css({"display": "none","opacity": "0.8","position": "fixed","left": "0","right": "0","top": "0","bottom": "0","padding": "16px","background-color": "rgba(1, 1, 1, 0.725)",
		"z-index": "100","overflow": "auto"})
	sfw.css({"width": "450px","height": "100px","margin": "50px auto","display": "none","background": "#fff","z-index": "200","position": "fixed","left": "0","right": "0",
	"top": "0","bottom": "0","padding": "16px"});
	document.write(GenerateBoard());
	GenerateFigures();
	RefreshBoard();
	$('div.board > div.square').click(ClickOnSquare);
	document.write('<div class="LeaveButton" ' +
		'style="width: 140px; height: 22px; '+
		'float: top; cursor: pointer; border: 1px solid black"><b>�������� ����</b></div>\n');
	$('div.LeaveButton').click(LeaveButton_click);
	document.write('<div></div>');
}

//�������� ������ �������
function GenerateMatrix(){
	Matrix=new Array(8);
	for(var i = 0; i < 8; i++){
		Matrix[i] = new Array(8);
		for(var j = 0; j < 8; j++){
			Matrix[i][j] = undefined;
		}
	}
}

//�������� ������� � ����������� ����� �� ��������� �������
function GenerateFigures(){
	GenerateMatrix();
	
	for(var i=0;i<8;i++){
		Matrix[1][i]={ID: generator.getID(), Type: 'pawn', Color: 'white', row: 1, column: i};
	}
	Matrix[0][0]={ID: generator.getID(), Type: 'castle' ,Color: 'white', row: 0, column: 0}; Matrix[0][7]={ID: generator.getID(), Type: 'castle', Color: 'white', row: 0, column: 7};
	Matrix[0][1]={ID: generator.getID(), Type: 'knight', Color: 'white', row: 0, column: 1}; Matrix[0][6]={ID: generator.getID(), Type: 'knight', Color: 'white', row: 0, column: 6};
	Matrix[0][2]={ID: generator.getID(), Type: 'bishop', Color: 'white', row: 0, column: 2}; Matrix[0][5]={ID: generator.getID(), Type: 'bishop', Color: 'white', row: 0, column: 5};
	Matrix[0][3]={ID: generator.getID(), Type: 'queen', Color: 'white', row: 0, column: 3}; 
	Matrix[0][4]={ID: generator.getID(), Type: 'king', Color: 'white', row: 0, column: 4};
	
	for(var i=0;i<8;i++){
		Matrix[6][i]={ID: generator.getID(), Type: 'pawn', Color: 'black', row: 6, column: i};
	}
	Matrix[7][0]={ID: generator.getID(), Type: 'castle', Color: 'black', row: 7, column: 0}; Matrix[7][7]={ID: generator.getID(), Type: 'castle', Color: 'black', row: 7, column: 7};
	Matrix[7][1]={ID: generator.getID(), Type: 'knight', Color: 'black', row: 7, column: 1}; Matrix[7][6]={ID: generator.getID(), Type: 'knight', Color: 'black', row: 7, column: 6};
	Matrix[7][2]={ID: generator.getID(), Type: 'bishop', Color: 'black', row: 7, column: 2}; Matrix[7][5]={ID: generator.getID(), Type: 'bishop', Color: 'black', row: 7, column: 5};
	Matrix[7][3]={ID: generator.getID(), Type: 'queen', Color: 'black', row: 7, column: 3}; 
	Matrix[7][4]={ID: generator.getID(), Type: 'king', Color: 'black', row: 7, column: 4};
}

//�������� �����
function GenerateBoard() {
	var html = '';
	var squareColor = 'white';
	html += '<div class="board" style="width: ' + BoardSize + 'px; height: ' + BoardSize + 'px">\n';
	for (var i = 7; i >= 0; i--) {
		for (var j = 0; j < 8; j++) {
			html += '\t<div class="square" ' +
			'style="width: ' + SquareSize + 'px; height: ' + SquareSize + 'px; ' +
			'background-image: url(picture/'+(squareColor === 'white' ? 'WhiteSquare.JPG' : 'BlackSquare.JPG')+'); ' + 
			'float: left" ' +
			'data-row="' + i +'" data-column="' + j + '"></div>\n';
			
			squareColor = (squareColor === 'white' ? 'black' : 'white');
    }
    squareColor = (squareColor === 'white' ? 'black' : 'white');
  }
  html += '</div>'; 
  return html;
}

//���������� ����� (���������� � ������������ � ��������)
function RefreshBoard(){
	for(var i=0;i<8;i++){
		for(var j=0;j<8;j++){
			var square = $('div.board > div.square[data-row="'+i+'"][data-column="'+j+'"]');
			square.empty();
			if(!(Matrix[i][j]===undefined)){
				var newHtml='<div class="figure" '+
				'style="width: 80px; height: 80px; ' +
				'background-image: url(picture/figure/'+Matrix[i][j].Color+'/'+Matrix[i][j].Type+'.png); ' + 
				'float: center"></div>';
				square.html(newHtml);
			}
		}
	}
}

//���� �� ������ �����
function ClickOnSquare(){
	var r=parseInt(this.attributes['data-row'].value), c=parseInt(this.attributes['data-column'].value);
	Castling=false;
	
	if((SelectedFigure === undefined)){
		if((Matrix[r][c]===undefined) || !(Matrix[r][c].Color===NowMove) || !(Matrix[r][c].Color===MyColor)){
			return;
		}
		SelectedFigure = Matrix[r][c];
		
		//alert(ShowFigure(SelectedFigure));
	}
	else{
		if(CheckCorrectness(SelectedFigure,this,Matrix) && !KingUnderAttack(SelectedFigure,this,Matrix)){
			var newMove = {
				figure: SelectedFigure,
				rs: SelectedFigure.row,
				cs: SelectedFigure.column,
				rt: r,
				ct: c
			};
			HistoryMoves[HistoryMoves.length] = newMove;
			
			if(!(
				(SelectedFigure.Type=='pawn' && SelectedFigure.Color=='white' && r==7) ||
				(SelectedFigure.Type=='pawn' && SelectedFigure.Color=='black' && r==0)
			)){
				if(Castling){
					//����������� �-���������� ������� ������ ������ � ���������� ������� �����, ������� ���� ������� �� ������
					var castleX=c;
					if(castleX==6) castleX = 7;
					if(castleX==2) castleX = 0;
					
					socket.emit('turn_castling',{
						from: {
							x: CoordToSymbol(castleX),
							y: r+1
						}
					});
				}
				else{
					socket.emit('turn_move',{
						from: {
							x: CoordToSymbol(SelectedFigure.column),
							y: SelectedFigure.row+1
						},
						to: {
							x: CoordToSymbol(c),
							y: r+1
						}
					});
				}
			}
			
			Matrix[r][c]=SelectedFigure;
			Matrix[SelectedFigure.row][SelectedFigure.column]=undefined;
			SelectedFigure.row = r; SelectedFigure.column = c;
			//����������� �����
			if(
				(SelectedFigure.Type=='pawn' && SelectedFigure.Color=='white' && r==7) ||
				(SelectedFigure.Type=='pawn' && SelectedFigure.Color=='black' && r==0)
			){
				tmpFigure=SelectedFigure;
				RebuildSelectFigureWindow(SelectedFigure.Color);
				$('div.board > div.square').off('click');
				return;
			}
			ChangeMove();
			RefreshBoard();
			/*
			//���
			if(CheckMate(NowMove,Matrix)){
				var str=(NowMove === 'white' ? '�����' : '׸����');
				str+=' �������� ���.';
				alert(str);	
				GameOver((NowMove === 'white' ? 'black' : 'white'));
				return;
			}
			//���
			if(CheckToTheKing(NowMove,Matrix)){
				var str=(NowMove === 'white' ? '�����' : '׸����');
				str+=' �������� ���.';
				alert(str);	
			}
			//���
			if(CheckStalemate(NowMove,Matrix)){
				var str=(NowMove === 'white' ? '�����' : '׸����');
				str+=' �������� ���.';
				alert(str);	
				GameOver(undefined);
				return;
			}
			*/
		}
		else{
			alert('��� ����������!');
		}
		SelectedFigure=undefined;
	}
}

//����� ���������� � ���������� ������
function ShowFigure(fi){
	var str = '';
	if(fi.Type === 'pawn'){str += '�������� ����� ';}
	if(fi.Type === 'castle'){str += '�������� ����� ';}
	if(fi.Type === 'knight'){str += '������� ���� ';}
	if(fi.Type === 'bishop'){str += '������� ���� ';}
	if(fi.Type === 'queen'){str += '�������� �������� ';}
	if(fi.Type === 'king'){str += '������� ������ ';}
	
	if(fi.Color === 'white'){str += '�����.';}else{str += '������.';}
	return str;
}

//�������� ������������ ����
function CheckCorrectness(figure,target,Matrix){
	var rs=figure.row, cs=figure.column, 
	rt=parseInt(target.attributes['data-row'].value), ct=parseInt(target.attributes['data-column'].value);
	
	if(!(Matrix[rt][ct]==undefined) && Matrix[rt][ct].Color == figure.Color){
		return false;
	}
	
	if(figure.Type==='pawn'){
		return CheckCorrectness_Pawn(figure,target,Matrix);
	}
	if(figure.Type==='castle'){
		return CheckCorrectness_Castle(figure,target,Matrix);
	}
	if(figure.Type==='bishop'){
		return CheckCorrectness_Bishop(figure,target,Matrix)
	}
	if(figure.Type==='knight'){
		return CheckCorrectness_Knight(figure,target,Matrix)
	}
	if(figure.Type==='queen'){
		return CheckCorrectness_Queen(figure,target,Matrix)
	}
	if(figure.Type==='king'){
		return CheckCorrectness_King(figure,target,Matrix)
	}
	
	return true;
}

//�������� ������������ ���� ������
function CheckCorrectness_Pawn(pawn,target,Matrix){
	var rs=pawn.row, cs=pawn.column, 
	rt=parseInt(target.attributes['data-row'].value), ct=parseInt(target.attributes['data-column'].value);
	
	//��� ������ �� �������
	if(HistoryMoves.length>0){
		var m = HistoryMoves[HistoryMoves.length-1];
		if(m.figure.Type == 'pawn' && 
			Math.abs(m.rt-m.rs)==2 && 
			Math.abs(m.cs-cs)==1 && 
			m.cs==ct && 
			Math.abs(m.rt-rt)==1
		){
			if((pawn.Color=='white' && rs==4) || (pawn.Color=='black' && rs==3)){
				Matrix[m.rt][m.ct] = undefined;
				return true;
			}
		}
	}
	
	if(pawn.Color=='white'){
		if(rt-rs==1){
			if(	(ct==cs && Matrix[rt][ct]==undefined) || 
				(Math.abs(ct-cs)==1 && !(Matrix[rt][ct]==undefined))
			){return true;}
		}
		else{
			if((rs==1)&&(rt-rs==2)&&(ct==cs)&&(Matrix[rs+1][cs]==undefined)){
				return true;
			}
			else{
				return false;
			}
		}
	}
	else{
		if(rs-rt==1){
			if(	(ct==cs && Matrix[rt][ct]==undefined) || 
				(Math.abs(ct-cs)==1 && !(Matrix[rt][ct]==undefined))
			){return true;}
		}
		else{
			if((rs==6)&&(rs-rt==2)&&(ct==cs)&&(Matrix[rs-1][cs]==undefined)){
				return true;
			}
			else{
				return false;
			}
		}
	}
}

//�������� ������������ ���� ������
function CheckCorrectness_Castle(castle,target,Matrix){
	var rs=castle.row, cs=castle.column, 
	rt=parseInt(target.attributes['data-row'].value), ct=parseInt(target.attributes['data-column'].value);
	if(!(rs==rt)&&!(cs==ct)){
		return false;
	}
	
	if(rs==rt){
		if(cs<ct){
			for(var i = cs+1; i < ct; i++){
				if(!(Matrix[rs][i]==undefined)){
					return false;
				}
			}
			return true;
		}
		else{
			for(var i = ct+1; i < cs; i++){
				if(!(Matrix[rs][i]==undefined)){
					return false;
				}
			}
			return true;
		}
	}else{
		if(rs<rt){
			for(var i = rs+1; i < rt; i++){
				if(!(Matrix[i][cs]==undefined)){
					return false;
				}
			}
			return true;
		}
		else{
			for(var i = rt+1; i < rs; i++){
				if(!(Matrix[i][cs]==undefined)){
					return false;
				}
			}
			return true;
		}
	}
}

//�������� ������������ ���� ������
function CheckCorrectness_Bishop(bishop,target,Matrix){
	var rs=bishop.row, cs=bishop.column, 
	rt=parseInt(target.attributes['data-row'].value), ct=parseInt(target.attributes['data-column'].value);
	if(!(Math.abs(rt-rs)==Math.abs(ct-cs))){
		return false;
	}
	
	var diff = Math.abs(rt-rs);
	if(rt>rs&&ct>cs){
		for(var i = 1;i<diff;i++){
			if(!(Matrix[rs+i][cs+i]==undefined)){
				return false;
			}
		}
		return true;
	}
	if(rt<rs&&ct>cs){
		for(var i = 1;i<diff;i++){
			if(!(Matrix[rs-i][cs+i]==undefined)){
				return false;
			}
		}
		return true;
	}
	if(rt<rs&&ct<cs){
		for(var i = 1;i<diff;i++){
			if(!(Matrix[rs-i][cs-i]==undefined)){
				return false;
			}
		}
		return true;
	}
	if(rt>rs&&ct<cs){
		for(var i = 1;i<diff;i++){
			if(!(Matrix[rs+i][cs-i]==undefined)){
				return false;
			}
		}
		return true;
	}
}

//�������� ������������ ���� ����
function CheckCorrectness_Knight(knight,target,Matrix){
	var rs=knight.row, cs=knight.column, 
	rt=parseInt(target.attributes['data-row'].value), ct=parseInt(target.attributes['data-column'].value);
	
	if(
		(rt==rs+2&&ct==cs-1) ||
		(rt==rs+2&&ct==cs+1) ||
		(rt==rs-2&&ct==cs-1) ||
		(rt==rs-2&&ct==cs+1) ||
		(rt==rs+1&&ct==cs+2) ||
		(rt==rs-1&&ct==cs+2) ||
		(rt==rs+1&&ct==cs-2) ||
		(rt==rs-1&&ct==cs-2)
	){
		return true;
	}
	else{
		return false;
	}
}

//�������� ������������ ���� �����
function CheckCorrectness_Queen(queen,target,Matrix){
	return (CheckCorrectness_Bishop(queen,target,Matrix) || CheckCorrectness_Castle(queen,target,Matrix));
}

//�������� ������������ ���� ������
function CheckCorrectness_King(king,target,Matrix){
	var rs=king.row, cs=king.column, 
	rt=parseInt(target.attributes['data-row'].value), ct=parseInt(target.attributes['data-column'].value);
	
	var enemyColor = (king.Color == 'white' ? 'black' : 'white')
	var tmpMatr=Matrix.clone();
	tmpMatr[king.row][king.column]=undefined;
	if(UnderAttack(enemyColor,target,tmpMatr)){
		return false;
	}
	
	if(!(Matrix[rt][ct]==undefined)){
		if(UnderProtect(Matrix[rt][ct],Matrix)){
			return false;
		}
	}
	
	//���������...
	if(AllMoves(king).length==0){
		if(king.Color=='white'){
			if(rt==0 && !UnderAttack('black',$('div.board > div.square[data-row="0"][data-column="4"]')[0],Matrix)){
				if(ct==6 && !(Matrix[0][7]==undefined) && AllMoves(Matrix[0][7]).length==0){
					var ok=true;
					for(var i=5;i<7;i++){
						if(!(Matrix[0][i]==undefined) || UnderAttack('black',$('div.board > div.square[data-row="0"][data-column="'+i+'"]')[0],Matrix)){
							ok=false;
						}
					}
					if(!(SelectedFigure==king)){ok=false;}//�������
					if(ok){
						Matrix[0][5]=Matrix[0][7];
						Matrix[0][7]=undefined;
						Matrix[0][5].column=5;
						Castling=true;
						return true;
					}
				}
				if(ct==2 && !(Matrix[0][0]==undefined) && AllMoves(Matrix[0][0]).length==0){
					var ok=true;
					for(var i=1;i<4;i++){
						if(!(Matrix[0][i]==undefined) || UnderAttack('black',$('div.board > div.square[data-row="0"][data-column="'+i+'"]')[0],Matrix)){
							ok=false;
						}
					}
					if(!(SelectedFigure==king)){ok=false;}
					if(ok){
						Matrix[0][3]=Matrix[0][0];
						Matrix[0][0]=undefined;
						Matrix[0][3].column=3;
						Castling=true;
						return true;
					}
				}
			}
		}
		else{
			//alert('����� � �������');
			if(rt==7 && !UnderAttack('white',$('div.board > div.square[data-row="7"][data-column="4"]')[0],Matrix)){
				if(ct==6 && !(Matrix[7][7]==undefined) && AllMoves(Matrix[7][7]).length==0){
					//alert('����� �� �����');
					var ok=true;
					for(var i=5;i<7;i++){
						if(!(Matrix[7][i]==undefined) || UnderAttack('white',$('div.board > div.square[data-row="7"][data-column="'+i+'"]')[0],Matrix)){
							ok=false;
						}
					}
					if(!(SelectedFigure==king)){ok=false;}
					if(ok){
						Matrix[7][5]=Matrix[7][7];
						Matrix[7][7]=undefined;
						Matrix[7][5].column=5;
						Castling=true;
						return true;
					}
				}
				if(ct==2 && !(Matrix[7][0]==undefined) && AllMoves(Matrix[7][0]).length==0){
					var ok=true;
					for(var i=1;i<4;i++){
						if(!(Matrix[7][i]==undefined) || UnderAttack('white',$('div.board > div.square[data-row="7"][data-column="'+i+'"]')[0],Matrix)){
							ok=false;
						}
					}
					if(!(SelectedFigure==king)){ok=false;}
					if(ok){
						Matrix[7][3]=Matrix[7][0];
						Matrix[7][0]=undefined;
						Matrix[7][3].column=3;
						Castling=true;
						return true;
					}
				}
			}
		}
	}
	
	if(Math.abs(rs-rt)>1 || Math.abs(cs-ct)>1){
		return false;
	}
	else{
		return true;
	}
}

//�������� ����
function ChangeMove(){
	NowMove = (NowMove === 'white' ? 'black' : 'white');
}

//��������, ��������� �� ������� field ��� ���� ����� ������ ����� color
function UnderAttack(color,field,Matrix){
	var rs, cs, rt=parseInt(field.attributes['data-row'].value), ct=parseInt(field.attributes['data-column'].value);
	var king, pawn;
	//�������� ��� ����, ����� ������ (���� �� �����������)
	for(var i=0;i<8;i++){
		for(var j=0;j<8;j++){
			if(!(Matrix[i][j]==undefined) && (Matrix[i][j].Color==color)){
				
				if(Matrix[i][j].Type == 'king'){
					king=Matrix[i][j];
					continue;
				}
				
				if(Matrix[i][j].Type == 'pawn'){
					pawn = Matrix[i][j];
					rs=pawn.row; cs=pawn.column;
					if(pawn.Color=='white'){
						if(rt-rs==1 && Math.abs(ct-cs)==1){
							return true;
						}
					}
					else{
						if(rs-rt==1 && Math.abs(ct-cs)==1){
							return true;
						}
					}
					continue;
				}
				
				if(CheckCorrectness(Matrix[i][j],field,Matrix)){
					return true;
				}
			}
		}
	}
	
	//�������� ��� ������
	if(king==undefined){return false;}
	rs=king.row; cs=king.column;	
	if(Math.abs(rs-rt)>1 || Math.abs(cs-ct)>1){
		return false;
	}
	else{
		return true;
	}
}

//��������, ��������� �� ������ "��� �������" (<=> ��� ���� ����-�� �� �����)
function UnderProtect(figure,Matrix){
	//var tmp=figure;
	var tmpMatr=Matrix.clone();
	tmpMatr[figure.row][figure.column]=undefined;
	var ans=UnderAttack(figure.Color,$('div.board > div.square[data-row="'+figure.row+'"][data-column="'+figure.column+'"]')[0],tmpMatr);
	//Matrix[tmp.row][tmp.column]=tmp;
	return ans;
}

//��������� ������� ���� �����, ��������� ������� (�� �������)
function AllMoves(figure){
	var arr=HistoryMoves.filter(
		function(step){
			return (step.figure.ID == figure.ID);
		}
	);
	return arr;
}

//��������� ������� ���� ��������� ����� ������ (� ������ ������)
function AllTargets(figure,Matrix){
	var arr=[];
	for(var i=0;i<8;i++){
		for(var j=0;j<8;j++){
			var target=$('div.board > div.square[data-row="'+i+'"][data-column="'+j+'"]')[0];
			if(CheckCorrectness(figure,target,Matrix)){
				arr[arr.length]=target;
			}
		}
	}
	return arr;
}

//� ��� �������
function FindKing(color,Matrix){
	for(var i=0;i<8;i++){
		for(var j=0;j<8;j++){
			if(!(Matrix[i][j]==undefined)){
				if(Matrix[i][j].Color==color && Matrix[i][j].Type=='king'){
					return Matrix[i][j];
				}
			}
		}
	}
}

//����
function FindAllFigures(color,Matrix){
	var arr=[];
	for(var i=0;i<8;i++){
		for(var j=0;j<8;j++){
			if(!(Matrix[i][j]==undefined)){
				if(Matrix[i][j].Color==color){
					arr[arr.length]=Matrix[i][j];
				}
			}
		}
	}
	return arr;
}

//�������� ���� ������ ����� color
function CheckToTheKing(color,Matrix){
	var king = FindKing(color,Matrix);
	if(UnderAttack(
		(color === 'white' ? 'black' : 'white'),
		$('div.board > div.square[data-row="'+king.row+'"][data-column="'+king.column+'"]')[0],
		Matrix
	)){
		return true;
	}
	else{
		return false;
	}
}

//�������� ����, �� ��������� �� ����������� figure �� target ��� ���� ������ ������
function KingUnderAttack(figure,target,Matrix){
	if(figure.Type=='king'){
		return false;
	}
	
	var rs=figure.row, cs=figure.column, 
	rt=parseInt(target.attributes['data-row'].value), ct=parseInt(target.attributes['data-column'].value);
	
	var tmpMatr=Matrix.clone();
	tmpMatr[rs][cs]=undefined;
	tmpMatr[rt][ct]=figure;
	if(CheckToTheKing(NowMove,tmpMatr)){
		//alert('������ ��������� ������ ��� ������!');
		return true;
	}
	return false;
}

//�������� ���� ����� color
function CheckStalemate(color,Matrix){
	var allFigures=FindAllFigures(color,Matrix);
	var allTargets=new Array(allFigures.length);	
	for(var k=0;k<allFigures.length;k++){
		allTargets[k]=AllTargets(allFigures[k],Matrix);
	}
	
	for(var i=0;i<allFigures.length;i++){
		for(var j=0;j<allTargets[i].length;j++){
			if(!KingUnderAttack(allFigures[i],allTargets[i][j],Matrix)){
				return false;
			}
		}
	}
	
	return true;
}

//�������� ���� ����� color
function CheckMate(color,Matrix){
	if(CheckToTheKing(color,Matrix) && CheckStalemate(color,Matrix)){
		return true;
	}
	else{
		return false;
	}
}

//���������� ����
function GameOver(winner){
	var str='������ ����������� ';
	if(winner==undefined){
		str+='������. ';
	}
	else{
		str+='������� '+(winner === 'white' ? '�����. ' : '������. ');
	}
	str+='������� �� ����!';
	alert(str);
	$('div.board > div.square').off('click');
}

//����� �������� ������� � ���� �����
function ClickOnFigureInSelectFigureWindow(){	
	ControlSelectFigureWindow('none');
	var arr=$(this).css('background-image').split('/');
	var ftype = arr[arr.length-1].substring(0,arr[arr.length-1].length-6);
	var figure={ID: generator.getID(), Type: ftype, Color: tmpFigure.Color, row: tmpFigure.row, column: tmpFigure.column};
	Matrix[figure.row][figure.column]=figure;
	tmpFigure=undefined;
	
	socket.emit('turn_promotion',{
		from: {
			x: CoordToSymbol(HistoryMoves[HistoryMoves.length-1].cs),
			y: HistoryMoves[HistoryMoves.length-1].rs+1
		},
		to: {
			x: CoordToSymbol(figure.column),
			y: figure.row+1
		},
		newPiece: (ftype == 'castle' ? 'rook' : ftype)
	});
	$('div.board > div.square').click(ClickOnSquare);
	//����������� �� ClickOnSquare, ������ ����������� ����� ������ ����� �� ������
	ChangeMove();
	RefreshBoard();
	/*//���
	if(CheckMate(NowMove)){
		var str=(NowMove === 'white' ? '�����' : '׸����');
		str+=' �������� ���.';
		alert(str);	
		GameOver((NowMove === 'white' ? 'black' : 'white'));
		return;
	}
	//���
	if(CheckToTheKing(NowMove)){
		var str=(NowMove === 'white' ? '�����' : '׸����');
		str+=' �������� ���.';
		alert(str);	
	}
	//���
	if(CheckStalemate(NowMove)){
		var str=(NowMove === 'white' ? '�����' : '׸����');
		str+=' �������� ���.';
		alert(str);	
		GameOver(undefined);
		return;
	}*/
	SelectedFigure=undefined;
}

//���������� ������� ���� ������ ������, � ������� ����������� �����
function ControlSelectFigureWindow(state){
	$('div#wrap').css('display',state);
	$('div#selectFigureWindow').css('display',state);
}

//���������� ���� ������ ������, � ������� ����������� �����
function RebuildSelectFigureWindow(color){
	var sfw = $('div#selectFigureWindow');/*, w=$('div#wrap');
	w.css({"display": "block","opacity": "0.8","position": "fixed","left": "0","right": "0","top": "0","bottom": "0","padding": "16px","background-color": "rgba(1, 1, 1, 0.725)",
		"z-index": "100","overflow": "auto"})
	sfw.css({"width": "450px","height": "100px","margin": "50px auto","display": "block","background": "#fff","z-index": "200","position": "fixed","left": "0","right": "0",
	"top": "0","bottom": "0","padding": "16px"});*/
	sfw.empty();
	sfw.html('<b>�������� ������, � ������� ����������� ��������� �����!</b>');
	var fiTypes=['knight','bishop','castle','queen'];
	for(var i=0;i<fiTypes.length;i++){
		var newHtml='<div class="figure" '+
		'style="width: 80px; height: 80px; ' +
		'background-image: url(picture/figure/'+color+'/'+fiTypes[i]+'.png); ' + 
		'float: left"></div>';
		sfw.html(sfw.html()+newHtml);
	}	
	$('div#selectFigureWindow > div.figure').click(ClickOnFigureInSelectFigureWindow);
	ControlSelectFigureWindow('block');
}

//�������������� �...� � 0...7
function SymbolToCoord(s){
	return s.charCodeAt(0) - 65;
}

//�������������� 0...7 � �...� 
function CoordToSymbol(c){
	return String.fromCharCode(c + 65);
}

//���� �� ������ "����� ����"
function GameFindButton_click(){
	socket.emit('game_find');
	Document_state2();
}

//���� �� ������ "����������� �� �������� ������ ������"
function RoomsListButton_click(){
	socket.emit('roomsList_subscribe');
}

//���� �� ������ "���������� �����"
function StopFindingButton_click(){
	socket.emit('game_stopFinding');
	Document_state1();
}

//���� �� ������ "�������� ����"
function LeaveButton_click(){
	socket.emit('room_leave');
	Document_state1();
}
//���� �� ������ "�����" (���� � ������� ��� ��������� ����)
function RoomEnterButton_click(){
	Document_state3();
	$('div.board > div.square').off('click');
	socket.emit('room_enter', this.attributes['data-roomID'].value);
}

function RoomsListUnsubscribeButton_click(){
	socket.emit('roomsList_unsubscribe');
	Document_state1();
}

//���������� ��� �������� ��������
Main();