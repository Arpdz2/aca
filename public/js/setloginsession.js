function setLoginSession() {
    document.cookie="login=True";
    checkLoginSession();
}

window.onload = setLoginSession;