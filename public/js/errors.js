var errorTemplate;
$.get("/public/templates/error-template.html", function (data) {
	errorTemplate = data;
});

$(function() {
    $('#delete-errors-button').click(function(e) {
        $.ajax({
            url: '/errors',
            type: 'DELETE',
            success: function(err) {
                $('#errors-table-body').html('');
            }
        });
    });
});