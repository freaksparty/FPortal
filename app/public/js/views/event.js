$(document).ready(function(){
	var nameList = [];
	var patients = [];
	$.each(userNames, function(k,v){if(k){nameList.push(k);isMedic(v)?{}:patients.push(k);};});
	$.each(userUsers, function(k,v){if(k){nameList.push(k);isMedic(v)?{}:patients.push(k);};});
	
	$('.user').each(function(){
		$(this).text(nameOfId($(this).text()));	
	});
	checkStatus();
});

function idOfName(n){
	var id = userNames[n];
	if(!id)id=userUsers[n];
	return id;
}
function nameOfId(id){
	var rtn = '';
	$.each(userNames, function(k,v){
		if(v===id)
			rtn = k;
	});
	if(isMedic(id))
		rtn += ' (Medic)';
	return rtn;
}
function isMedic(id){
	var rtn = $.inArray(id,medics);
	return (rtn !== -1);
}
function checkStatus(){
	$.ajax('./status', {
		cache	: false,
		statusCode : {
			404	: function(xhr){
				modalError(xhr.responseText, '/events');
			},
			409 : function(xhr){
				$('#status-data').text(xhr.responseText);
				setTimeout(checkStatus, 1000*60);
			},
			410 : function(xhr){
				$('#status-data').text(xhr.responseText);
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