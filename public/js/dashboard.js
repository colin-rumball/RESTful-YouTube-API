$(function () {
	$('#newTokenBtn').click(function () {
		window.location.href = '/addToken';
	});

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

	$('#cs-file-label-container').click(function(e) {
		$('#cs-file-input').click();
	});

	$('#cs-uploadForm').submit(function (e) {
		e.preventDefault();
		readFileAndSend($('#cs-file-input')[0]);
		$('#cs-form-submit').remove();
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

	console.log(config);
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