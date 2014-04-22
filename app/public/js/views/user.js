function hideConfirm() {
	$('#modal-background').slideUp();
	$('#modal-confirm').fadeOut();
}

function deleteUser() {
	$.ajax({
		url: window.location.href,
		type: 'DELETE',
		success: function(data){
			location.href = '/admin';
		},
		error: function(jqXHR){
			console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			showError('Could not delete user: '+jqXHR.responseText);
		}
	});
}

function showError(text){
	$(document).ready(function(){
		$('#response-panel').css({'border-color' : 'red', 'color': 'red'});
		$('#response-panel').text(text).fadeIn(200).fadeOut(150).fadeIn();		
	});		
}
function showSucess(text) {
	$(document).ready(function(){
		$('#response-panel').css({'border-color' : 'green', 'color': 'green'});
		$('#response-panel').text(text).fadeIn();		
	});		
}

function validUser(){
	var rtn = true;
	$('#response-panel').hide();
	
	var remail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if(!(remail.test($('#email-tf').val()))){
		rtn = false;
		tooltip_error('#email-tf','Please insert a valid email');
	}
	if($('#user-tf').val().length === 0){
		rtn = false;
		tooltip_error('#user-tf','Please provide a username (nick)');
	}
	return rtn;
}

$(document).ready(function(){
	$('#modal-confirm .cancel').click(hideConfirm);
	$('#user-btn-del').click(function(){
		$('#modal-background').slideDown();
		$('#modal-confirm').fadeIn();
		$('#modal-confirm p').text('Are you sure to delete this user?');
		$('#modal-confirm .submit').click(function(){
			deleteUser();
			hideConfirm();
		});
	});
	$('#user-form').ajaxForm({
		beforeSubmit	: validUser,
		statusCode		: {
			200 : function() {showSucess('User data updated');},
			201 : function() {window.location.href = '/admin';},
		},
		error			: function(xhr, response) {
			showError('Fail: '+xhr.responseText);
		}
	});
});