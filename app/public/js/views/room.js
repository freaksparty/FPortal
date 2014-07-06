var eventStatus = 'unknown';
var video_constraints = {mandatory: {
	maxFrameRate:30
	},
	optional: [ ]
};
var localStream = Erizo.Stream({audio: true, video: video_constraints, data: (yourId==medicId), attributes: {uid:yourId}});
var userStreams = {};
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
	room1 = Erizo.Room({token:token});
	room1.connect();
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
			room.publish(localStream, {maxVideoBW: 150});
			subscribeToStreams(roomEvent.streams);
			participantSuscribed(localStream);
		});

		room.addEventListener("stream-subscribed", function(streamEvent) {
			var stream = streamEvent.stream;
			participantSuscribed(stream);
		});

		room.addEventListener("stream-added", function (streamEvent) {
			var streams = [];
			streams.push(streamEvent.stream);
			subscribeToStreams(streams);
		});

		room.addEventListener("stream-removed", function (streamEvent) {
			// Remove stream from DOM
			var stream = streamEvent.stream;
			var uid = stream.getAttributes().uid;
			$("#tab-"+uid).removeClass("connected");
			$("#controls-"+uid).fadeOut();
			stream.close();
			$("#mini-video-"+uid+">div").remove();
			userStreams[uid] = undefined;
			if (stream.elementID !== undefined) {
				var element = document.getElementById(stream.elementID);
				document.body.removeChild(element);
			}
		});
		
		//room.addEventListener("stream-data", receiveData);

		room.connect();
		localStream.show("vidYourself");
		//localStream.show("mini-video-"+yourId);
		
	});
	localStream.init();
}

function onResize(){
	$('.tab').each(function(i, o){
		o=$(o);
		o.width(o.height()*1.5);
		var uid=parseInt(o.attr('id').substring(4));
	});
	$('#vidYourself').each(function(i, o){
		o=$(o);
		var rat = o.height()/o.width();
		var w = o.parent().width();
		var h = Math.round(w*rat);
		o.width(w);
		o.height(h);
	});
	$('.mini-video').each(function(i, o){
		o=$(o);
		var p = o.parent();
		o.height(p.height());
	});
}