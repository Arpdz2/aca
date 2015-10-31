function checkLoginSession() {
    if(document.cookie == "login=True") {
        document.getElementById("status").class="btn btn-success";
        document.getElementById("demo").innerHTML = "Logout";
        document.getElementById("status").href="/logout";
    }
    else {
        document.getElementById("status").class="btn btn-danger";
        document.getElementById("demo").innerHTML = "Login";
        document.getElementById("abc").href="/login";
    }
}

window.onload = checkLoginSession;