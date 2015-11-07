exports.convertDate = function(string) {
    var birthdate = string.split("-");
    var finalbirthdate = birthdate[1] + "/" + birthdate[2] + "/" + birthdate[0];
    return finalbirthdate;
}