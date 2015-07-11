$(document).ready(function(){	
	$('#getemail-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if ($('#txt-email').val().length === 0){
				tooltip_error('#txt-email','Please, insert your email.');
				return false;
			} else {
				return true;
			}
		},
		success	: function(){ modalRedirection('The email was sent, check your inbox to get the change password instructions.', '/'); },
		error : function(e){modalError('Email not found in our database');}
	});
});