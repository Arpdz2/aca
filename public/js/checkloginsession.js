function checkLoginSession() {
    var x = document.cookie.split(";");
    for (var i = 0; i < x.length ; i++) {
        str = x[i].replace(/\s+/g, '');
        console.log(str);
        if(str == "login=True") {
            document.getElementById("status").className ="btn btn-danger";
            document.getElementById("status").innerHTML = "Logout";
            document.getElementById("status").href="/logout";
            document.getElementById("status").onclick= removeLoginSession;
            console.log(document.cookie);
            break;
        }
        else {
            document.getElementById("status").className ="btn btn-success";
            document.getElementById("status").innerHTML = "Login";
            document.getElementById("status").href="/login";
            console.log(document.cookie);
        }
    }
}

window.onload = checkLoginSession;