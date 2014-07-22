//This client is the medic (moderator)
var imMedic = false;
var eventStatus = 'unknown';
var video_constraints;
//if(localStorage['hires']=='false')
	video_constraints = {mandatory: {
		maxFrameRate:30,
		/*maxHeight: 240,*/
	    maxWidth: 340 },
		optional: [ ]
	};	
/*else
	video_constraints = {mandatory: {
		maxFrameRate:30
		},
		optional: [ ]};*/


/*maxHeight: screen.height,
maxWidth: screen.width,*/

var localStream = Erizo.Stream({audio: true, video: video_constraints, data: (yourId==medicId), attributes: {uid:yourId, event:eventId}});
var myselfVideo;
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
				$('#loader-message').text('Waiting video autorization...');
				joinRoom(xhr);
			}
		}
	});
}

function joinRoom(token){
	room = Erizo.Room({token:token});
	
	localStream.addEventListener("access-accepted", function () {
		/*myselfVideo = Erizo.Stream({audio: false, video: video_constraints, data: false, attributes: {}});
		myselfVideo.init();*/
		
		$('#loader').fadeOut();
		$('#room').delay(750).fadeIn();
		$('#background').removeClass('hide');//¿not fadeIn()? Yes, whe are firing css3 transition :/
		setTimeout(onResize,750);

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
			var stream = streamEvent.stream;
			if (typeof unpublishedCallback == 'function')
			    unpublishedCallback(stream);

			var uid = stream.getAttributes().uid;
			$("#tab-"+uid).removeClass("connected");
			//$("#controls-"+uid).fadeOut();
			$("#controls-"+uid+" .circle").prop('class','circle red');
			stream.close();
			$("#mini-video-"+uid+">div").remove();
			userStreams[uid] = undefined;
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

function changeLocalStream(hires) {
	localStorage['hires']=hires;
	window.location.reload();
}

//Receiving command
function receiveData(evt){
	var cmd = evt.msg.cmd;
	if(cmd != undefined){
		cmd = cmd.split(' ');
		switch(cmd[0]){
			case 'VIEW':
				if(cmd[1]=='RIGHT')
					changeMainVideo("vidMainRight", userStreams[parseInt(cmd[2])]);
				else
					changeMainVideo("vidMainLeft", userStreams[parseInt(cmd[2])]);
				break;
			case 'KICKUSER':
				if(cmd[1]==yourId)
					window.location='/';
				break;
			case 'KICKSTREAM':
				if(cmd[1]==localStream.getID())
					window.location='/';
				break;
			case 'VOLUME':
				var uid = cmd[2];
				if(cmd[1]=='ON') {
					userStreams[parseInt(cmd[2])].stream.getAudioTracks()[0].enabled = true;
					$('#control-volume-'+uid).removeClass('icon-volume-off').addClass('icon-volume-on');
				} else {
					userStreams[parseInt(cmd[2])].stream.getAudioTracks()[0].enabled = false;
					$('#control-volume-'+uid).removeClass('icon-volume-on').addClass('icon-volume-off');
				}
		}
	}
}

function volumeUser(uid) {
	var audio = userStreams[uid].stream.getAudioTracks()[0];
	if(audio.enabled) {
		if(imMedic)
			localStream.sendData({cmd : "VOLUME OFF "+uid});
		audio.enabled = false;
		$('#control-volume-'+uid).removeClass('icon-volume-on').addClass('icon-volume-off');
	} else {
		if(imMedic)
			localStream.sendData({cmd : "VOLUME ON "+uid});
		audio.enabled = true;
		$('#control-volume-'+uid).removeClass('icon-volume-off').addClass('icon-volume-on');
	}
}

function changeMainVideo(div, stream) {
	//Clear previous video if present
	$("#"+div+">div").hide(); //TODO: fix workarround

	var uid = stream.getAttributes().uid;
	stream.show(div);
	$("#"+div+">label").text($("#tab-"+uid+">.name").text());
	if(imMedic &&(div=="vidMainRight")){
		localStream.sendData({cmd:"VIEW RIGHT "+uid});
	}
}

$(document).ready(function(){
	checkStatus();
	window.onresize = onResize;
	imMedic = (medicId == yourId);
	//$('.controls').hide();
	if($('#countdown').length > 0 ){
		setInterval(function(){$('#countdown').text($('#countdown').text()-1);}, 60000);
	}
	$('#chk-hires').click(function(){
		changeLocalStream($('#chk-hires').prop('checked'));
	});
});