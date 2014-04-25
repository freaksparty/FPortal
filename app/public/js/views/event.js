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