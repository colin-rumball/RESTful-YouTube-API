var logTemplate;
$.get("/public/templates/log-template.html", function (data) {
	logTemplate = data;
});

$(function() {
    $('#delete-logs-button').click(function(e) {
        $.ajax({
            url: '/logs',
            type: 'DELETE',
            success: function(err) {
                $('#logs-table-body').html('');
            }
        });
    });
});