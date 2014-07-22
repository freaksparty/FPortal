function kickUser(uid) {localStream.sendData({cmd:"KICKUSER "+uid});}

function participantSuscribed(stream){
	var uid = stream.getAttributes().uid;
	if(uid==yourId && userStreams[yourId]!=undefined)
		window.location='/';
	if(imMedic){
		if(stream.getAttributes().event !== eventId)
			localStream.sendData({cmd:"KICKSTREAM "+stream.getID()});
	}
	
	userStreams[uid] = stream;	
	
	$("#tab-"+uid).addClass('connected');
	//stream.show("mini-video-"+uid);
	$("#tab-"+uid).addClass("connected");
	$("#controls-"+uid+" .circle").prop('class','circle green');
	
	if(uid==medicId) {
		changeMainVideo("vidMainLeft", stream);
		stream.addEventListener("stream-data", receiveData);
	} else if(uid==patientId) {
		changeMainVideo("vidMainRight", stream);
	}
	if(imMedic) {
		$('#control-kick-'+uid).removeClass('hide').click(function() {kickUser(uid);});
		$('#control-volume-'+uid).click(function() {volumeUser(uid);});
		$('#name-'+uid).click(function(){
			if(userStreams[uid] !== undefined){
				changeMainVideo("vidMainRight", userStreams[uid]);
			}
		});
	}
	$('#controls-'+uid).fadeIn();
}