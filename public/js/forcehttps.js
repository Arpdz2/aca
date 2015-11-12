src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"

$(document).ready(function() {
    var string = window.location.toString();
    if (window.location.protocol == 'https:' || string.indexOf("localhost") != -1) {
        console.log("Https in effect");
    }
    else {
        window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);

    }
});
