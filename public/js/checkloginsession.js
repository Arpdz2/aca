src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"

$(document).ready(function() {
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
            document.getElementById("status").removeAttribute("href");
            document.getElementById("status").onclick= addDropDown;
            console.log(document.cookie);
        }
    }
});

function addDropDown(){
    var style = document.getElementById("dropdown").style.display;
    if (style == "block"){
        document.getElementById("dropdown").style.display = 'none';
    }
    else {
        document.getElementById("dropdown").style.display = 'block';
    }
}

function removeLoginSession(){
    document.cookie = "login=;  path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
}

