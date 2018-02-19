var requestSent = false;
var uploadTemplate;
$.get("/public/templates/upload-template.html", function (data) {
	uploadTemplate = data;
});

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

				if (uploads.length > 0 && uploadTemplate != undefined) {
					var bodyHTML = '';
					for (var i = 0; i < uploads.length; i++) {
						bodyHTML += ejs.render(uploadTemplate, uploads[i]);
					}
					
					$('#uploads-table-body').html(bodyHTML);
					$('#upload-page-content').css('display', 'block');
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