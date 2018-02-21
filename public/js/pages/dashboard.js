$(function () {
	$('input[type=checkbox]').each(function() {
		$(this).click(function() {
			sendNewConfig();
		});
	});

	$('#cs-file-input').on('change', function (e) {
		var fileName = '';

		if (e.target.value) {
			fileName = e.target.value.split('\\').pop();
		}

		if (fileName) {
			$('#cs-file-title').html(fileName);
			$('#cs-form-submit').prop('disabled', false);
		}
	});

	$('.token-delete-button').each(function(button) {
		$(this).click(function(e) {
			var url = `/dashboard/tokens/${e.currentTarget.parentElement.id}`;
			$.ajax({
				url: url,
				type: 'DELETE',
				success: function (response) {
					window.location.href = '/dashboard';
				}
			});
		});
	});

	$('.list-group-item').each(function(token) {
		$(this).click(function(e) {
			var url = `/dashboard/tokens/${e.currentTarget.id}`;
			$.ajax({
				url: url,
				type: 'PATCH',
				success: function (response) {
					window.location.href = '/dashboard';
				}
			});
		});
	});

	$('#cs-file-label-container').click(function(e) {
		$('#cs-file-input').click();
	});

	$('#cs-uploadForm').submit(function (e) {
		e.preventDefault();
		readFileAndSend($('#cs-file-input')[0]);
		$('#cs-form-submit').remove();
	});

	$('#newTokenBtn').click(function(e) {
		$.ajax({
			url: '/dashboard/token-url',
			type: 'GET',
			success: function(response) {
				$('#token-authentication-url').attr('href', response.url);
			}
		});
	});

	$('#add-token-form').submit(function (e) {
		e.preventDefault();

		var tokenName = $('#name').val();
		var tokenCode = $('#code').val();

		$.ajax({
			url: '/dashboard/tokens',
			type: 'POST',
			data: {
				name: tokenName,
				code: tokenCode
			},
			success: function () {
				window.location.href = '/dashboard';
			}
		})
	});
});

function readFileAndSend(file) {
	var reader = new FileReader();

	reader.onload = function (e) {
		$.ajax({
			type: 'POST',
			url: '/dashboard/client-secret',
			data: JSON.parse(e.target.result),
			success: function () {
				$('#client-secret-uploader').append('Upload Successful!');
			},
			error: function () {
				console.error('Unable to post new client secret');
			}
		});

		$('#cs-uploadForm').remove();
	}

	reader.readAsText(file.files[0]);
}

var sendNewConfig = function() {
	var servicesEnabled = {};

	$('input[type=checkbox]').each(function () {
		var key = $(this).attr('id');
		var value = $(this).prop('checked');
		servicesEnabled[key] = {
			enabled: value
		};
	});

	$.ajax({
		type: 'POST',
		url: '/dashboard/services',
		data: servicesEnabled,
		success: function() {
			requestNewConfig();
		},
		error: function() {
			console.error('Unable to post new services enabled');
		}
	});
};

var updateConfig = function(updatedConfig) {
	$('#config').text(JSON.stringify(updatedConfig, undefined, 2));
}

var requestNewConfig = function() {
	$.ajax({
		type: 'GET',
		url: '/config.json',
		success: function (config) {
			$('#config').text(JSON.stringify(config, undefined, 2));
		},
		error: function () {
			console.error('Unable to get config');
		}
	});
};