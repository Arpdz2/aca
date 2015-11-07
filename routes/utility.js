exports.convertDate = function(string) {
    if (string.indexOf("-") > -1) {
        var birthdate = string.split("-");
        var finalbirthdate = birthdate[1] + "/" + birthdate[2] + "/" + birthdate[0];
        return finalbirthdate;
    }
}