function checkLoginSession() {
    if(document.cookie == "login=True") {
        document.getElementById("status").class="btn btn-success";
        document.getElementById("status").innerHTML = "Logout";
        document.getElementById("status").href="/logout";
        document.getElementById("status").onclick= removeLoginSession;

    }
    else {
        document.getElementById("status").class="btn btn-danger";
        document.getElementById("status").innerHTML = "Login";
        document.getElementById("status").href="/login";
    }
}

window.onload = checkLoginSession;