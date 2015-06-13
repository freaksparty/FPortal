var pageOwn = 0, page = 0;

$(document).ready(function(){
	$('#btn-filter-own .btn').click(changeFilterOwn);
	$('#btn-filter .btn').click(changeFilter);
});

function changeFilterOwn(){
	var filterOwn;
	$('#btn-filter-own .btn').removeClass('active');
	pageOwn=0;
	switch($(this).attr('id')){
		case 'btn-filter-active':filterOwn='Created';break;
		case 'btn-filter-closed':filterOwn='Closed';break;
		case 'btn-filter-cancelled':filterOwn='Cancelled';
	}
	updateTable('table-body-own', 'me', pageOwn, filterOwn, false);
	$(this).addClass('active');
}

function changeFilter(){
	var filter;
	$('#btn-filter .btn').removeClass('active');
	page=0;
	switch($(this).attr('id')){
		case 'btn-filter-active':filter='Created';break;
		case 'btn-filter-closed':filter='Closed';
	}
	updateTable('table-body-invited', 0, page, filter, true);
	$(this).addClass('active');
}

function updateTable(bodyId, owner, page, filter, showMedic){
	var body = $('#'+bodyId);
	var url = '/api/events/'+page+'/'+owner+'/'+filter;
	$.ajax({
		type: 'GET',
		url: url,
		dataType: "json",
		success: function(data){
			body.empty();
			console.log(data);
			$.each(data, function(idx, row){
				var participants = '';
				if(showMedic)participants='<p>'+row.medic+' (Medic)</p>';
				$.each(row.participants, function(idx, p){
					var color = '';
					if(row.participantAssistance[idx]==='Confirmed')color='green';
					else if(row.participantAssistance[idx]==='WontCome')color='red';

					participants+='<p class="'+color+'">'+p;
					if(p===row.patient) participants+='(Patient)';
					participants+='</p>';
				});
				if(row.comments == null)
					row.comments = '';
				
				
				body.append('<tr><td><a href="/eventform/'+row._id+'/"></a><span>'+formatDate(row.start)+'</span></td>' +
						'<td>'+row.duration+' min</td>'+
						'<td>'+participants+'</td><td>'+row.comments+'</td></tr>');
			});
			autolink();
		},
		error: function(){modalError('Error getting events');}
	});
}

function formatDate(date){
	var year = date.split(' ')[0].split('-').reverse().join('/');
	var hour = date.split(' ')[1].slice(0,-3);
	return year+' '+hour;
}