var eventStatus = 'unknown';
var localStream = Erizo.Stream({audio: true, video: true, data: false});
var room;

function checkStatus(){
	$.ajax('status', {
		cache	: false,
		statusCode : {
			404	: function(xhr){
				modalError(xhr.responseText, '/events');
			},
			200 : function(xhr){
				$('#loader-message').text(xhr);
				setTimeout(checkStatus, 5000);
			},
			202: function(xhr) {
				$('#loader-message').fadeOut().text(xhr).fadeIn();
				setTimeout(checkStatus, 1500);
			},
			410 : function(xhr){
				modalError(xhr.responseText, '/events');
			},
			500 : function() {
				modalError('A critical error has occurred', '/events');
			},
			201 : function(xhr) {
				$('#loader-message').text('Joining room...');
				$('#loader').fadeOut();
				$('#room').fadeIn();
				joinRoom(xhr);
			}
		}
	});
}

function joinRoom(token){
	room = Erizo.Room({token:token});
	onResize();//initial
	
	localStream.addEventListener("access-accepted", function () {

		var subscribeToStreams = function (streams) {
			for (var index in streams) {
				var stream = streams[index];
				if (localStream.getID() !== stream.getID()) {
					room.subscribe(stream);
				} 
			}
		};

		room.addEventListener("room-connected", function (roomEvent) {
			room.publish(localStream);
			subscribeToStreams(roomEvent.streams);
		});

		room.addEventListener("stream-subscribed", function(streamEvent) {
			var stream = streamEvent.stream;
			var div = document.createElement('div');
			//div.setAttribute("style", "width: 320px; height: 240px;");
			div.setAttribute("id", "test" + stream.getID());

			document.body.appendChild(div);
			stream.show("test" + stream.getID());
		});

		room.addEventListener("stream-added", function (streamEvent) {
			var streams = [];
			streams.push(streamEvent.stream);
			subscribeToStreams(streams);
		});

		room.addEventListener("stream-removed", function (streamEvent) {
			// Remove stream from DOM
			var stream = streamEvent.stream;
			if (stream.elementID !== undefined) {
				var element = document.getElementById(stream.elementID);
				document.body.removeChild(element);
			}
		});

		room.connect();
		localStream.show("vidYourself");		
		
	});
	localStream.init();
}

function onResize(){
	$('.video').each(function(i, o){
		o=$(o);
		var rat = o.height()/o.width();
		var w = o.parent().width();
		var h = Math.round(w*rat);
		o.width(w);
		o.height(h);
	});
}

$(document).ready(function(){
	checkStatus();
	window.onresize = onResize;
});