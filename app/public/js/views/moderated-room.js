//This client is the medic (moderator)
var imMedic = false;



//Receiving command
function receiveData(evt){
	var cmd = evt.msg.cmd;
	if(cmd != undefined){
		var cmd=cmd.split(' ');
		switch(cmd[0]){
			case 'VIEW':
				if(cmd[1]=='RIGHT')
					changeMainVideo("vidMainRight", userStreams[parseInt(cmd[2])]);
				else
					changeMainVideo("vidMainLeft", userStreams[parseInt(cmd[2])]);
				break;
			case 'KICK':
				if(cmd[1]==yourId)
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

function quickUser(uid) {
	localStream.sendData({cmd:"KICK "+uid});
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

function participantSuscribed(stream){
	var uid = stream.getAttributes().uid;
	userStreams[uid] = stream;
	$("#tab-"+uid).addClass('connected');
	stream.show("mini-video-"+uid);
	$("#tab-"+uid).addClass("connected");
	if(uid==medicId) {
		changeMainVideo("vidMainLeft", stream);
		stream.addEventListener("stream-data", receiveData);
	} else if(uid==patientId) {
		changeMainVideo("vidMainRight", stream);
	}
	if(imMedic) {
		$('#control-kick-'+uid).removeClass('hide').click(function() {quickUser(uid);});
		$('#control-volume-'+uid).click(function() {volumeUser(uid);});
		$('#tab-'+uid).click(function(){
			if(userStreams[uid] !== undefined){
				changeMainVideo("vidMainRight", userStreams[uid]);
			}
		});
	}
	$('#controls-'+uid).fadeIn();
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