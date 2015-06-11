//This client is the medic (moderator)
var imMedic = false;
var eventStatus = 'unknown';
var video_constraints;
//if(localStorage['hires']=='false')
	video_constraints = {mandatory: {
		maxFrameRate:30,
		/*maxHeight: 240,*/
	    /*maxWidth: 340*/ },
		optional: [ ]
	};	
/*else
	video_constraints = {mandatory: {
		maxFrameRate:30
		},
		optional: [ ]};*/


/*maxHeight: screen.height,
maxWidth: screen.width,*/
	
$('#sendImageBtn').click(function(){$('#sendImage').click();});

function handleImageSend(evt) {
    var file = evt.target.files[0];

    // Only process image files.
    if (!file.type.match('image.*')) {
    	modalError('Not a image file');
    	return false;
    }
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
    	//return function(e) {
    		localStream.sendData({cmd:'IMAGE', data:this.result});
    	//};
    });
    reader.readAsDataURL(file);
}
$('#sendImage').change(handleImageSend);

var localStream = Erizo.Stream({audio: true, video: true, data: (yourId==medicId), attributes: {uid:yourId, event:eventId}});
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
	var tokenobj = JSON.parse(L.Base64.decodeBase64(token));
	if(tokenobj.secure){
		tokenobj.host=tokenobj.host.split(':');
		if(tokenobj.host.length == 2)
			tokenobj.host[1]++;
		tokenobj.host=tokenobj.host.join(':');
		token=L.Base64.encodeBase64(JSON.stringify(tokenobj));
	}
		
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
			//participantSuscribed(localStream);
		});

		room.addEventListener("stream-subscribed", function(streamEvent) {
			var stream = streamEvent.stream;
			participantSuscribed(stream);
		});

		room.addEventListener("stream-added", function (streamEvent) {
			var streams = [];
			streams.push(streamEvent.stream);
			subscribeToStreams(streams);
			if(streamEvent.stream.getAttributes().uid == yourId)
				participantSuscribed(localStream);
		});

		room.addEventListener("stream-removed", function (streamEvent) {
			var stream = streamEvent.stream;
			if (typeof unpublishedCallback == 'function')
			    unpublishedCallback(stream);

			var uid = stream.getAttributes().uid;
			$("#tab-"+uid).removeClass("connected");
			$('#control-volume-'+uid).unbind("click");
			$('#controls-'+uid).unbind("click");
			$('#name-'+uid).unbind("click");
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
				break;
			case 'IMAGE':
				addNotification({type:'image',data:evt.msg.data});
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
	$("#"+div+">label").text($("#name-"+uid).text());
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


//File  L.Base64.js from erizoClient:
var L = L || {};
L.Base64 = (function (L) {
    "use strict";
    var END_OF_INPUT, base64Chars, reverseBase64Chars, base64Str, base64Count, i, setBase64Str, readBase64, encodeBase64, readReverseBase64, ntos, decodeBase64;

    END_OF_INPUT = -1;

    base64Chars = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
        'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
        'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z', '0', '1', '2', '3',
        '4', '5', '6', '7', '8', '9', '+', '/'
    ];

    reverseBase64Chars = [];

    for (i = 0; i < base64Chars.length; i = i + 1) {
        reverseBase64Chars[base64Chars[i]] = i;
    }

    setBase64Str = function (str) {
        base64Str = str;
        base64Count = 0;
    };

    readBase64 = function () {
        var c;
        if (!base64Str) {
            return END_OF_INPUT;
        }
        if (base64Count >= base64Str.length) {
            return END_OF_INPUT;
        }
        c = base64Str.charCodeAt(base64Count) & 0xff;
        base64Count = base64Count + 1;
        return c;
    };

    encodeBase64 = function (str) {
        var result, inBuffer, lineCount, done;
        setBase64Str(str);
        result = '';
        inBuffer = new Array(3);
        lineCount = 0;
        done = false;
        while (!done && (inBuffer[0] = readBase64()) !== END_OF_INPUT) {
            inBuffer[1] = readBase64();
            inBuffer[2] = readBase64();
            result = result + (base64Chars[inBuffer[0] >> 2]);
            if (inBuffer[1] !== END_OF_INPUT) {
                result = result + (base64Chars [((inBuffer[0] << 4) & 0x30) | (inBuffer[1] >> 4)]);
                if (inBuffer[2] !== END_OF_INPUT) {
                    result = result + (base64Chars [((inBuffer[1] << 2) & 0x3c) | (inBuffer[2] >> 6)]);
                    result = result + (base64Chars[inBuffer[2] & 0x3F]);
                } else {
                    result = result + (base64Chars[((inBuffer[1] << 2) & 0x3c)]);
                    result = result + ('=');
                    done = true;
                }
            } else {
                result = result + (base64Chars[((inBuffer[0] << 4) & 0x30)]);
                result = result + ('=');
                result = result + ('=');
                done = true;
            }
            lineCount = lineCount + 4;
            if (lineCount >= 76) {
                result = result + ('\n');
                lineCount = 0;
            }
        }
        return result;
    };

    readReverseBase64 = function () {
        if (!base64Str) {
            return END_OF_INPUT;
        }
        while (true) {
            if (base64Count >= base64Str.length) {
                return END_OF_INPUT;
            }
            var nextCharacter = base64Str.charAt(base64Count);
            base64Count = base64Count + 1;
            if (reverseBase64Chars[nextCharacter]) {
                return reverseBase64Chars[nextCharacter];
            }
            if (nextCharacter === 'A') {
                return 0;
            }
        }
    };

    ntos = function (n) {
        n = n.toString(16);
        if (n.length === 1) {
            n = "0" + n;
        }
        n = "%" + n;
        return unescape(n);
    };

    decodeBase64 = function (str) {
        var result, inBuffer, done;
        setBase64Str(str);
        result = "";
        inBuffer = new Array(4);
        done = false;
        while (!done && (inBuffer[0] = readReverseBase64()) !== END_OF_INPUT && (inBuffer[1] = readReverseBase64()) !== END_OF_INPUT) {
            inBuffer[2] = readReverseBase64();
            inBuffer[3] = readReverseBase64();
            result = result + ntos((((inBuffer[0] << 2) & 0xff)| inBuffer[1] >> 4));
            if (inBuffer[2] !== END_OF_INPUT) {
                result +=  ntos((((inBuffer[1] << 4) & 0xff) | inBuffer[2] >> 2));
                if (inBuffer[3] !== END_OF_INPUT) {
                    result = result +  ntos((((inBuffer[2] << 6)  & 0xff) | inBuffer[3]));
                } else {
                    done = true;
                }
            } else {
                done = true;
            }
        }
        return result;
    };

    return {
        encodeBase64: encodeBase64,
        decodeBase64: decodeBase64
    };
}(L));