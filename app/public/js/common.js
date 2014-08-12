//Convert first a link into all row link
function autolink(){
$('tbody.autolink>tr').click(function(){
    window.location = $(this).find('a').attr('href');
});
}autolink();

$('#notif-hide').click(function(){
	$('#notif-div').slideUp();
	$('#notif-navbar').fadeIn();
});
$('#notif-navbar').click(function(){
	$('#notif-div').slideDown();
	$('#notif-navbar').fadeOut();
});

function tooltip_right(parent, text){
	parent = $(parent);
	// .position() uses position relative to the offset parent, 
	var pos = parent.position();
	// .outerWidth() takes into account border and padding.
	var width = parent.outerWidth(true);
	var divId = parent.attr('id')+'-ttr';

	if($('#'+divId).length === 0){
		parent.parent().append('<div id="' +
				divId + '" class="tooltip-form">'+
				text + '</div>');
	}
	$('#'+divId).text(text);

	return $('#'+divId).css({
		position: "absolute",
		top: pos.top + "px",
		left: (pos.left + width + 15) + "px",
	}).fadeIn();
}
function tooltip_error(parent, text) {
	var tt = tooltip_right(parent, text).css("border-color", "red");
	var preBorder = $(parent).css("border-color");
	$(parent).css("border-color", "red").focus(function(){
		$(parent).css("border-color", preBorder);
		tt.fadeOut();
	});
}
function hideModal() {
	$('#modal-background').slideUp();
	$('#modal').fadeOut();
}
function modalConfirmAction(text, yesAction, urlNo) {
	if(yesAction)
		$('#modal #modalSubmit').unbind('click');
		if(typeof yesAction == 'string')
			$('#modal #modalSubmit').click(function(){window.location = yesAction;});
		else if (typeof yesAction == 'function')
			$('#modal #modalSubmit').click(yesAction);
	else
		$('#modal #modalSubmit').click(hideModal);
	$('#modal #modalSubmit').text('Yes');
	if(urlNo)
		$('#modal .cancel').click(function(){window.location = urlNo;});
	else
		$('#modal .cancel').click(hideModal);
	$('#modal .cancel').text('Cancel');
	$('#modal #modalSubmit').show();
	$('#modal p').text(text);
	$('#modal-background').slideDown();
	$('#modal').fadeIn();		
}
function modalError(text, url){
	if(url)
		$('#modal .cancel').click(function(){window.location = url;});
	else
		$('#modal .cancel').click(hideModal).text('OK');
	$('#modal #modalSubmit').hide();
	$('#modal p').text(text);
	$('#modal-background').slideDown();
	$('#modal').fadeIn();
}
function modalRedirection(text, url){
	$('#modal .cancel').click(function(){window.location = url;})
		.text('Continue');
	$('#modal #modalSubmit').hide();
	$('#modal p').text(text);
	$('#modal-background').slideDown();
	$('#modal').fadeIn();
}
function showError(text){
	$('#response-panel').css({'border-color' : 'red', 'color': 'red'});
	$('#response-panel').text(text).fadeIn(200).fadeOut(150).fadeIn();				
}
function showSucess(text) {
	$('#response-panel').css({'border-color' : 'green', 'color': 'green'});
	$('#response-panel').text(text).fadeIn();				
}
/**/
function isEmpty(s){return(!s||0===s.length);}
function numericInput(s){s.keyup(function(){s.val(s.val().replace(/\D/g,''));});}