$(document).ready(function(){
	$('#add-room-form').ajaxForm({
		beforeSubmit: function() {$('#add-room-to').prop('disable',true);},
		success		: function() {
			$('#td-room-'+$('#add-room-to').val()).text('Created').css('color','green');
			$('#add-room-to option:selected').appendTo('#remove-room-to');
			$('#add-room-to').prop('disable',false);
		},
		error		: function(xhr, response) {
			modalError('Fail: '+xhr.responseText);
			console.log('Error: '+xhr.responseText);
			$('#add-room-to').prop('disable',false);
		}
	});
	$('#remove-room-form').ajaxForm({
		beforeSubmit: function() {$('#remove-room-to').prop('disable',true);},
		success		: function() {
			
			$('#td-room-'+$('#remove-room-to').val()).text('Deleted').css('color','red');
			$('#remove-room-to option:selected').appendTo('#add-room-to');
			$('#remove-room-to').prop('disable',false);
		},
		error		: function(xhr, response) {
			modalError('Fail: '+xhr.responseText);
			console.log('Error: '+xhr.responseText);
			$('#remove-room-to').prop('disable',false);
		}
	});
});