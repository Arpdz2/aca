function checkLoginSession() {
    if(document.cookie == "login=True") {
        document.getElementById("status").className ="btn btn-danger";
        document.getElementById("status").innerHTML = "Logout";
        document.getElementById("status").href="/logout";
        document.getElementById("status").onclick= removeLoginSession;
        console.log(document.cookie);
    }
    else {
        document.getElementById("status").className ="btn btn-success";
        document.getElementById("status").innerHTML = "Login";
        document.getElementById("status").href="/login";
        console.log(document.cookie);
    }
}

window.onload = checkLoginSession;