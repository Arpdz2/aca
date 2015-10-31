function setLoginSession() {
    document.cookie="login=True";
}

window.onload = setLoginSession;