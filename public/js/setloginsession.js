src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"

$(document).ready(function() {
    var d = new Date();
    //set 15 minute sessions
    d.setMinutes(d.getMinutes() + 375);
    document.cookie="login=True; expires=" + d.toString() + ";";
});

