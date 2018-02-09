$(function() {
	$('#add-token-form').submit(function(e) {
		e.preventDefault();

		var tokenName = $('#name').val();
		var tokenCode = $('#code').val();

		$.ajax({
			url: '/tokens',
			type: 'POST',
			data: {
				name: tokenName,
				code: tokenCode
			},
			success: function() {
				$('body').append('success');
			}
		})
	});
});