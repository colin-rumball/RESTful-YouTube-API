$(function() {
	$('#shutdown-menu-item').click(function(e) {
		e.preventDefault();
		$.ajax({
			url: '/shutdown',
			type: 'POST'
		});
	});
});