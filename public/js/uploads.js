var requestSent = false;
$(document).ready(function (e) {
	$('#refresh-uploads-btn').on('click', function() {
		$('#no-uploads-message').css('display', 'none');
		$('#uploads-loader').css('display', 'block');
		checkUploads();
	});

	checkUploads();
});

var checkUploads = function() {
	var intervalId = setInterval(function () {
		if (!requestSent) {
			$.getJSON(window.location.pathname + '.json', function (uploads) {
				requestSent = false;

				if (uploads.length > 0) {
					var bodyHTML = '';
					for (var i = 0; i < uploads.length; i++) {
						bodyHTML += '<tr id="' + uploads[i].uid + '">' +
							'<td id="uid">' + uploads[i].uid + '</td>' +
							'<td id="status">' + uploads[i].status + '</td>' +
							'<td id="filename">' + uploads[i].filename + '</td>' +
							'<td id="fileSize">' + uploads[i].fileSize + '</td>' +
							'<td id="progress">' +
							'<div class="progress" style="height: 20px;">' +
							'<div class="progress-bar" role="progressbar" style="width: ' +
							uploads[i].progress + '%;" aria-valuenow="' +
							uploads[i].progress + '" aria-valuemin="0" aria-valuemax="100">' +
							uploads[i].progress + '%</div>' +
							'</div>' +
							'</td>' +
							'</tr>';
					}
					$('#uploads-table-body').html(bodyHTML);
					$('#upload-table-container').css('display', 'block');
					$('#no-uploads-container').remove();
				} else {
					clearInterval(intervalId);
					$('#no-uploads-message').css('display', 'block');
					$('#uploads-loader').css('display', 'none');
				}
			});
			requestSent = true;
		}
	}, 1000);
};