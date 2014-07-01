$(document).ready(function(){	
	$('#getemail-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if ($('#txt-pass').val().length <= 6){
				tooltip_error('#txt-pass','The password must have at least 6 characters');
				return false;
			} if($('#txt-pass').val() !== $('#txt-passRetype').val()){
				tooltip_error('#txt-passRetype','Both passwords are differente, please, type them again to prevent typos')
				return false;
			} else {
				return true;
			}
		},
		success	: function(){ modalError('The password was set, you can try to log into your account now.', '/'); },
		error : function(e){modalError('Error updating your password, please contact the administtation');}
	});
});