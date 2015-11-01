function setLoginSession() {
    var d = new Date();
    //set 15 minute sessions
    d.setMinutes(d.getMinutes() + 315);
    document.cookie="login=True; expires=" + d.toString() + ";";
    checkLoginSession();
}

window.onload = setLoginSession;