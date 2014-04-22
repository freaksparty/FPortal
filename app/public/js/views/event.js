var participants = [];

$(document).ready(function(){
	$('#txt-date').datepicker({
		changeMonth: true,
		changeYear: true,
		numberOfMonths: 2,
		dateFormat: "dd/mm/yy",
		minDate: 0,
		showAnim: "fadeIn"
	});

	var nameList = [];
	$.each(userNames, function(k,v){k?nameList.push(k):{};});
	$.each(userUsers, function(k,v){k?nameList.push(k):{};});

	$('#add-participant').autocomplete({source: nameList});
	$('#btn-add-participant').css('cursor','pointer').click(function(){
		var txt = $('#add-participant');
		if(txt.val() === '')
			tooltip_error(txt,'Please, write the name or user of the participant');
		else {
			var usId = userNames[txt.val()];
			if(!usId){
				usId = userUsers[txt.val()];
				if(usId){
					$.each(userNames, function(k,v){
						if(v===usId)
							txt.val(k);
					});
				}
			}
			if(!usId)
				tooltip_error(txt,'User not found, please check speeling');
			else {
				participants.push(usId);
				$('#table-participants').append('<tr id="'+usId+'"><td>'+txt.val()+'</td></tr>');
				txt.val('');
				bindTable();
			}
		}
	});

	$('#event-form').ajaxForm({
		beforeSubmit	: function (formData, formObject, formOptions){
			$.each(participants, function(i,p){
				formData.push({name:"participants[]", value:p});
			});
			return validEvent();
		},
		statusCode		: {
			200 : function() {showSucess('User data updated');},
			201 : function() {window.location.href = '/admin';},
		},
		error			: function(xhr, response) {
			showError('Fail: '+xhr.responseText);
		}
	});
	bindTable();
});

function bindTable() {
	$('#table-participants>tr').unbind("click").click(function(){
		that = $(this);
		participants = jQuery.grep(participants, function(value) {
			  return value != that.prop('id');
		});
		that.remove();
	});
}
function validEvent(){
	var rtn = true;
	$('#participants').val(participants);
	$('#response-panel').hide();
	
	if(participants.length < 1){
		rtn = false;
		tooltip_error('#add-participant','At least 1 participant needed');
	}
	if($('#txt-date').val()===''){
		rtn = false;
		tooltip_error('#txt-date','Date is required');
	}
	if($('#txt-hour').val()===''){
		rtn = false;
		tooltip_error('#txt-hour','Hour is required');
	} else if(!(/^[0-9]+\:[0-5][0-9]$/.test($('#txt-hour').val()))) {
		rtn = false;
		tooltip_error('#txt-hour','Specified hour is not valid');
	}		
	return rtn;
}