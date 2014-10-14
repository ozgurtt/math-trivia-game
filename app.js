var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/frontend'));
app.set('view engine', 'jade');
app.locals.pretty = true;


/* Express Routing */
app.get('/', function(req, res) {
	res.render('index.jade');
});


/* Helper vars */

var i = 0;
var _question = "";
var _answer = 0;
var scores = {};


var updateQuestion = function() {
	var ops = ["+", "-"];
	var a = Math.floor((Math.random() * 20) + 1);
	var b = Math.floor((Math.random() * 20) + 1);
	var e = Math.floor((Math.random() * ops.length));

	_question = a.toString() + ops[e]+ b.toString();
	_answer = eval(_question);

};

var users = (function() {
	var _names = [];

	var addName = function(name) {
		if(_names.indexOf(name) === -1) {
			_names.push(name);
			return 0;
		} else {
			return 1;

		}
	};

	var getNames = function() {
		return _names;
	};

	var removeName = function(name) {
		var i = _names.indexOf(name);
		delete _names[i];
	};

	return {
		add: addName,
		remove: removeName,
		get: getNames
	};

}());

var sockets = (function() {
	var _sockets = {};

	var updateName = function(socket, name) {
		_sockets[socket.id] = name;
	};

	var deleteSocket = function(socket) {
		delete _sockets[socket.id];
	};

	var getName = function(socket) {
		console.log("getting " + socket.id + " as " + sockets[socket.id]);
		return _sockets[socket.id];
	};

	return {
		update: updateName,
		remove: deleteSocket,
		get: getName
	};

}());

updateQuestion();


/* Socket IO Events */
io.on('connection', function(socket) {
	console.log('new connection - ' + socket.id);
	sendUserInfo(socket);
	sendQuestion(socket);

	socket.on('server:add user', function(name) {
		// TODO validate user name...
		users.add(name);
		sockets.update(socket, name);
		console.log("socket " + socket.id + " updated with name " + name);
		sendUserInfo(io);
		sendScores(socket);
	});

	socket.on('disconnect', function() {
		var nameToRemove = sockets.get(socket);
		users.remove(nameToRemove);
		sockets.remove(socket);
		sendUserInfo(io);
	});

	socket.on('user:answer', function(data) {
		console.log(data.answer + " | " + _answer);
		if(data.answer == _answer) {
			var name = sockets.get(socket);
			incrementScore(name);
			sendScores(io);
			updateQuestion();
			sendQuestion(io);
		}
	});

});

var sendData = function(recip, event, data) {
	recip.emit(event, data);
};

var sendUserInfo = function(recip) {
	recip.emit('client:user info', {
		users: users.get()
	});
};

var sendQuestion = function(recip) {
	recip.emit('question', {
		question: _question,
		answer: _answer
	});
};

var sendScores = function(recip) {
	recip.emit('scores', {
		scores: scores
	});
};

var sendData = function(recip, event, data) {
	recip.emit('time', {
		key: data
	});
};

var incrementScore = function(key) {
	if(isNaN(scores[key])) {
		scores[key] = 1;
	} else {
		scores[key]++;
	}
};


/* Game Logic */

http.listen(port, function() {
	console.log('listening on ' + port);
});

count = 120;
setInterval(function() {
	if(count < 0) {
		scores = {};
		sendScores(io);
		console.log("clearing scores list");
		count = 120;
	} else {
		sendData(io, "time", count);
		count--;
	}
	
}, 1000);

