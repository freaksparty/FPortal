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
function showJoin(){
	$('#status').text('Please, click on the Join button to start the event');
	$('.form-actions').fadeOut();
	$('#btn-join').show();
	$('.form-actions').fadeIn();	
}
function checkStatus(){
	$.ajax('./status', {
		cache	: false,
		statusCode : {
			404	: function(xhr){
				modalError(xhr.responseText, '/events');
			},
			410 : function(xhr){
				$('#status').text(xhr.responseText);
			},
			500 : function() {
				modalError('A critical error has occurred', '/events');
			},
			200 : function(xhr) {
				$('#status').text(xhr);
				setTimeout(checkStatus, 1000*60);
			},
			201 : showJoin,
			202 : showJoin			
		}
	});
}