$(document).ready(function (e) {
	$('.page-selector').each(function() {
		$(this).on('click', function() {
			window.location.href = '/' + $(this).attr('id');
		});
	});
});