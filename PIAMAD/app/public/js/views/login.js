$(document).ready(function(){
	$('#modal .cancel').click(hideModal).text('OK');
	$('#modal #modalSubmit').hide();
	
	$('#login-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if ($('#user-tf').val().length === 0){
				tooltip_error('#user-tf','Please, insert your user to login');
				return false;
			} else if ($('#pass-tf').val().length === 0) {
				tooltip_error('#pass-tf','Empty passwords are not allowed');
				return false;
			} else {
				// append 'remember-me' option to formData to write local cookie //
				formData.push({name:'remember-me', value:$("input:checkbox:checked").length == 1});
				return true;
			}
		},
		success	: function(){ window.location.href = '/'; },
		error : function(e){
            //lv.showLoginError('Login Failure', 'Please check your username and/or password');
			modalError('Please check your username and/or password');
		}
	});
});

/**/