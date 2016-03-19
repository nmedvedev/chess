var Columns = 'abcdefgh'.split('');
var SquareSize = 80;
var BoardSize = 8*SquareSize;
var Matrix;
var NowMove = 'white';
var SelectedFigure = undefined;
var HistoryMoves = [];
var generator;
var tmpFigure = undefined;//для превращения пешки

function IDGenerator(){
	this.num = 1;
	this.getID = function(){
		return this.num++;
	}

} 

Object.prototype.clone = function() {
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

//Вызывается при загрузке страницы
function Main(){
	generator = new IDGenerator();
	document.write(GenerateBoard());
	GenerateFigures();
	RefreshBoard();
	$('div.board > div.square').click(ClickOnSquare);
	document.write('<div id="wrap"></div> <div id="selectFigureWindow"></div>');
}

//Создание пустой матрицы
function GenerateMatrix(){
	Matrix=new Array(8);
	for(var i = 0; i < 8; i++){
		Matrix[i] = new Array(8);
		for(var j = 0; j < 8; j++){
			Matrix[i][j] = undefined;
		}
	}
}

//Создание матрицы и расстановка фигур на стартовые позиции
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

//Создание доски
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

//Обновление доски (приведение в соответствие с матрицей)
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

//Клик по клетке доски
function ClickOnSquare(){
	var r=parseInt(this.attributes['data-row'].value), c=parseInt(this.attributes['data-column'].value);
	
	if((SelectedFigure === undefined)){
		if((Matrix[r][c]===undefined) || !(Matrix[r][c].Color===NowMove)){
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
			
			Matrix[r][c]=SelectedFigure;
			Matrix[SelectedFigure.row][SelectedFigure.column]=undefined;
			SelectedFigure.row = r; SelectedFigure.column = c;
			//Превращение пешки
			if(
				(SelectedFigure.Type=='pawn' && SelectedFigure.Color=='white' && r==7) ||
				(SelectedFigure.Type=='pawn' && SelectedFigure.Color=='black' && r==0)
			){
				tmpFigure=SelectedFigure;
				RebuildSelectFigureWindow(SelectedFigure.Color);
				return;
			}
			ChangeMove();
			RefreshBoard();
			//Мат
			if(CheckMate(NowMove,Matrix)){
				var str=(NowMove === 'white' ? 'Белым' : 'Чёрным');
				str+=' объявлен мат.';
				alert(str);	
				GameOver((NowMove === 'white' ? 'black' : 'white'));
				return;
			}
			//Шах
			if(CheckToTheKing(NowMove,Matrix)){
				var str=(NowMove === 'white' ? 'Белым' : 'Чёрным');
				str+=' объявлен шах.';
				alert(str);	
			}
			//Пат
			if(CheckStalemate(NowMove,Matrix)){
				var str=(NowMove === 'white' ? 'Белым' : 'Чёрным');
				str+=' объявлен пат.';
				alert(str);	
				GameOver(undefined);
				return;
			}
		}
		else{
			alert('Ход невозможен!');
		}
		SelectedFigure=undefined;
	}
}

//Показ информации о выделенной фигуре
function ShowFigure(fi){
	var str = '';
	if(fi.Type === 'pawn'){str += 'Выделена пешка ';}
	if(fi.Type === 'castle'){str += 'Выделена ладья ';}
	if(fi.Type === 'knight'){str += 'Выделен конь ';}
	if(fi.Type === 'bishop'){str += 'Выделен слон ';}
	if(fi.Type === 'queen'){str += 'Выделена королева ';}
	if(fi.Type === 'king'){str += 'Выделен король ';}
	
	if(fi.Color === 'white'){str += 'белых.';}else{str += 'чёрных.';}
	return str;
}

//Проверка корректности хода
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

//Проверка корректности хода пешкой
function CheckCorrectness_Pawn(pawn,target,Matrix){
	var rs=pawn.row, cs=pawn.column, 
	rt=parseInt(target.attributes['data-row'].value), ct=parseInt(target.attributes['data-column'].value);
	
	//для взятия на проходе
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

//Проверка корректности хода ладьей
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

//Проверка корректности хода слоном
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

//Проверка корректности хода конём
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

//Проверка корректности хода ферзём
function CheckCorrectness_Queen(queen,target,Matrix){
	return (CheckCorrectness_Bishop(queen,target,Matrix) || CheckCorrectness_Castle(queen,target,Matrix));
}

//Проверка корректности хода королём
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
	
	//Рокировка...
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
					if(!(SelectedFigure==king)){ok=false;}//костыль
					if(ok){
						Matrix[0][5]=Matrix[0][7];
						Matrix[0][7]=undefined;
						Matrix[0][5].column=5;
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
						return true;
					}
				}
			}
		}
		else{
			//alert('Зашло в черного');
			if(rt==7 && !UnderAttack('white',$('div.board > div.square[data-row="7"][data-column="4"]')[0],Matrix)){
				if(ct==6 && !(Matrix[7][7]==undefined) && AllMoves(Matrix[7][7]).length==0){
					//alert('Дошло до цикла');
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
						return true;
						Matrix[7][5].column=5;
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

//Передача хода
function ChangeMove(){
	NowMove = (NowMove === 'white' ? 'black' : 'white');
}

//Проверка, находится ли квадрат field под боем любой фигуры цвета color
function UnderAttack(color,field,Matrix){
	var rs, cs, rt=parseInt(field.attributes['data-row'].value), ct=parseInt(field.attributes['data-column'].value);
	var king, pawn;
	//Проверка для всех, кроме короля (чтоб не провалиться)
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
	
	//Проверка для короля
	if(king==undefined){return false;}
	rs=king.row; cs=king.column;	
	if(Math.abs(rs-rt)>1 || Math.abs(cs-ct)>1){
		return false;
	}
	else{
		return true;
	}
}

//Проверка, находится ли фигура "под защитой" (<=> под боем кого-то из своих)
function UnderProtect(figure,Matrix){
	//var tmp=figure;
	var tmpMatr=Matrix.clone();
	tmpMatr[figure.row][figure.column]=undefined;
	var ans=UnderAttack(figure.Color,$('div.board > div.square[data-row="'+figure.row+'"][data-column="'+figure.column+'"]')[0],tmpMatr);
	//Matrix[tmp.row][tmp.column]=tmp;
	return ans;
}

//Получение массива всех ходов, сделанных фигурой (из истории)
function AllMoves(figure){
	var arr=HistoryMoves.filter(
		function(step){
			return (step.figure.ID == figure.ID);
		}
	);
	return arr;
}

//Получение массива всех возможных ходов фигуры (в данный момент)
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

//И так понятно
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

//Тоже
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

//Проверка шаха королю цвета color
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

//Проверка того, не подставит ли перемещение figure на target под удар своего короля
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
		//alert('Нельзя оставлять короля под атакой!');
		return true;
	}
	return false;
}

//Проверка пата цвету color
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

//Проверка мата цвету color
function CheckMate(color,Matrix){
	if(CheckToTheKing(color,Matrix) && CheckStalemate(color,Matrix)){
		return true;
	}
	else{
		return false;
	}
}

//Завершение игры
function GameOver(winner){
	var str='Партия закончилась ';
	if(winner==undefined){
		str+='ничьей. ';
	}
	else{
		str+='победой '+(winner === 'white' ? 'белых. ' : 'чёрных. ');
	}
	str+='Спасибо за игру!';
	alert(str);
	$('div.board > div.square').off('click');
}

//Самая паршивая функция в этом файле
function ClickOnFigureInSelectFigureWindow(){	
	ControlSelectFigureWindow('none');
	var arr=$(this).css('background-image').split('/');
	var ftype = arr[arr.length-1].substring(0,arr[arr.length-1].length-6);
	var figure={ID: generator.getID(), Type: ftype, Color: tmpFigure.Color, row: tmpFigure.row, column: tmpFigure.column};
	Matrix[figure.row][figure.column]=figure;
	tmpFigure=undefined;
	
	//Скопировано из ClickOnSquare, должно выполняться после замены пешки на фигуру
	ChangeMove();
	RefreshBoard();
	//Мат
	if(CheckMate(NowMove)){
		var str=(NowMove === 'white' ? 'Белым' : 'Чёрным');
		str+=' объявлен мат.';
		alert(str);	
		GameOver((NowMove === 'white' ? 'black' : 'white'));
		return;
	}
	//Шах
	if(CheckToTheKing(NowMove)){
		var str=(NowMove === 'white' ? 'Белым' : 'Чёрным');
		str+=' объявлен шах.';
		alert(str);	
	}
	//Пат
	if(CheckStalemate(NowMove)){
		var str=(NowMove === 'white' ? 'Белым' : 'Чёрным');
		str+=' объявлен пат.';
		alert(str);	
		GameOver(undefined);
		return;
	}
	SelectedFigure=undefined;
}

//Управление показом окна выбора фигуры, в которую превратится пешка
function ControlSelectFigureWindow(state){
	$('div#wrap').css('display',state);
	$('div#selectFigureWindow').css('display',state);
}

//Построение окна выбора фигуры, в которую превратится пешка
function RebuildSelectFigureWindow(color){
	var sfw = $('div#selectFigureWindow');
	sfw.empty();
	sfw.html('<b>Выберите фигуру, в которую превратится прошедшая пешка!</b>');
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

//Выполнится при загрузке страницы
Main();