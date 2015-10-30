function forceHttps() {
    var string = window.location.toString();
    if (window.location.protocol == 'https:' || string.indexOf("localhost") != -1) {
    }
    else {
        window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
    }
}
window.onload = forceHttps;