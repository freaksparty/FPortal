$(document).ready(function(){
	var nameList = [];
	var patients = [];
	$.each(userNames, function(k,v){if(k){nameList.push(k);isMedic(v)?{}:patients.push(k);};});
	$.each(userUsers, function(k,v){if(k){nameList.push(k);isMedic(v)?{}:patients.push(k);};});
	
	$('.user').each(function(){
		$(this).text(nameOfId($(this).text()));	
	});
	checkStatus();
	$('#btn-wontcome').click(function() {
		$.ajax({
			  type: "POST",
			  url: "./assistance",
			  data: {setStatus: "WontCome"},
			  success: function(){
				  $('#btn-wontcome').attr('disabled',"");
				  $('#btn-confirm').removeAttr('disabled');
				  $('#participation-status').text('You have checked you are not comming');
			  },
			  error: function(xhr, response){showError('Fail: '+xhr.responseText);}
			});
	});
	$('#btn-confirm').click(function() {
		$.ajax({
			  type: "POST",
			  url: "./assistance",
			  data: {setStatus: "Confirmed"},
			  success: function(){
				  $('#btn-wontcome').removeAttr('disabled');
				  $('#btn-confirm').attr('disabled',"");
				  $('#participation-status').text('Assistance confirmed');
			  },
			  error: function(xhr, response){showError('Fail: '+xhr.responseText);}
			});
	});
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
	$('#event-status').text('Please, click on the Join button to start the event');
	$('.form-actions').fadeOut();
	$('#btn-join').show();
	$('.form-actions').fadeIn();	
}
function checkStatus(){
	$.ajax('./status', {
		cache	: false,
		statusCode : {
			403 : function() {
				$('#event-status').text('The event was cancelled');
				$('#form-container .form-actions').hide();
			},
			404	: function(xhr){
				modalError(xhr.responseText, '/events');
			},
			410 : function(xhr){
				$('#event-status').text(xhr.responseText);
				$('#form-container .form-actions').hide();
			},
			500 : function() {
				modalError('A critical error has occurred', '/events');
			},
			200 : function(xhr) {
				$('#event-status').text(xhr);
				setTimeout(checkStatus, 1000*60);
			},
			201 : showJoin,
			202 : showJoin			
		}
	});
}