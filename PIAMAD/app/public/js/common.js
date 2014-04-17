//Convert first a link into all row link
$('tbody>tr').click( function() {
    window.location = $(this).find('a').attr('href');
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
	$(parent).css("border-color", "red").click(function(){
		$(parent).css("border-color", preBorder);
		tt.fadeOut();
	});
}
function hideModal() {
	$('#modal-background').slideUp();
	$('#modal').fadeOut();
}
function modalError(text){
	$('#modal p').text(text);
	$('#modal-background').slideDown();
	$('#modal').fadeIn();
}