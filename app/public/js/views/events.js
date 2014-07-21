var pageOwn = 0, page = 0;
var filterOwn = filter = 'Created';
$(document).ready(function(){
	$('#btn-filter-own .btn').click(changeFilterOwn);
	$('#btn-filter .btn').click(changeFilter);
});
function changeFilterOwn(){
	$('#btn-filter-own .btn').removeClass('active');
	pageOwn=0;
	switch($(this).attr('id')){
		case 'btn-filter-active':filterOwn='Created';
		case 'btn-filter-closed':filterOwn='Closed';
		case 'btn-filter-cancelled':filterOwn='Cancelled';
	}
	updateTable('table-body-own', 'me', pageOwn);
	$(this).addClass('active');
}
function changeFilter(){
	$('#btn-filter-own .btn').removeClass('active');
	page=0;
	switch($(this).attr('id')){
		case 'btn-filter-active':filter='Created';
		case 'btn-filter-closed':filter='Closed';
		case 'btn-filter-cancelled':filter='Cancelled';
	}
	//updateTable()
	$(this).addClass('active');
}
function updateTable(bodyId, owner, page){
	var url = '/api/events/'+page+'/'+owner+'/'+filterOwn;
	$.ajax({
		url: url,
		success: function(data){console.log('data');},
		error: function(){modalError('Error getting events');}
	});
}