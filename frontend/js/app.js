

var myApp = angular.module('myApp', []);

/* Dependency injection for socket */
myApp.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});

// User logic
myApp.controller('UserCtrl', ['$scope', 'socket', function($scope, socket) {
	$scope.user_set = false;
	$scope.users = [];
  $scope.scores = {};

	$scope.doo = function() {
		if(nameOkay()) {
			$scope.user_set = true;
			socket.emit('server:add user', $scope.textbox);
		}
	};

	var nameOkay = function() {
    var regex = /^[0-9A-Za-z_ ]+$/;

    if(!regex.test($scope.textbox)) {
      alert("Enter a valid name!");
      return false;
    }
		return $scope.textbox.length >= 3 && $scope.users.indexOf($scope.textbox) == -1;
	};

	socket.on('client:user info', function(data) {
		$scope.users = data.users;
		console.log(data);
	});

  socket.on('scores', function(data) {
    $scope.scores = [];
    for(var key in data.scores) {
      $scope.scores.push({name: key, score: data.scores[key]});
    }
    $scope.scores.sort(function(a,b) {
      return b.score - a.score;
    });
  });

  socket.on('time', function(data) {
    $scope.time_left = data.key;
  });

}]);

// Game Logic
myApp.controller('GameCtrl', ['$scope', 'socket', function($scope, socket) {
  $scope.submitAnswer = function() {
    if($scope.user_answer == $scope.answer) {
      socket.emit('user:answer', {
        answer: $scope.user_answer
      });
    } else {
      count = 0;
    }
    $('#qanswer').val('');

  };

  socket.on('question', function(data) {
    $scope.question = data.question;
    $scope.answer = data.answer;
    console.log(data);
  });

}]);

// Blink Logic - this could probably be done a lot cleaner...
count = 2;

function initBlink()
{

    var state = false;
    setInterval(function()
        {
            if(count < 2) {
                state = !state;
                var color = (state?'red':'white');
                document.body.style.backgroundColor=color;
                count++;
            }
        }, 100);
}

initBlink();


