$(document).ready(function(){
	var nameList = [];
	var patients = [];
	$.each(userNames, function(k,v){if(k){nameList.push(k);isMedic(v)?{}:patients.push(k);};});
	$.each(userUsers, function(k,v){if(k){nameList.push(k);isMedic(v)?{}:patients.push(k);};});
	
	$('.user').each(function(){
		$(this).text(nameOfId($(this).text()));	
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

function bindTable() {
	$('#table-participants>tr').unbind("click").click(function(){
		that = $(this);
		collaborators = $.grep(collaborators, function(value) {return value != that.prop('id');});
		relatives = $.grep(relatives, function(value) {return value != that.prop('id');});
		that.remove();
	});
}
function validEvent(){
	var rtn = true;
	var pat = $('#txt-patient').val();
	
	if(isEmpty(pat)){
		rtn = false;
		tooltip_error('#txt-patient','The patient name is mandatory');		
	} else 
	if(!idOfName(pat)){
		rtn = false;
		tooltip_error('#txt-patient','Unknown patient name.');
	}
	if($('#txt-date').val()===''){
		rtn = false;
		tooltip_error('#txt-date','Date is required');
	}
	if($('#txt-hour').val()===''){
		rtn = false;
		tooltip_error('#txt-hour','Hour is required');
	} else if(!(/^[0-5]?[0-9]\:[0-5][0-9]$/.test($('#txt-hour').val()))) {
		rtn = false;
		tooltip_error('#txt-hour','Specified hour is not valid');
	}		
	return rtn;
}