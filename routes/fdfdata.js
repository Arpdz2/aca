var fdf = require('fdf')
utility = require('./utility.js');

exports.generate = function(result) {
    var single = "Off";
    var married = "Off";
    var spousefirst = result.spousefirstname;
    var spouselast = result.spouselastname;
    var datetime = new Date().toDateString();
    if (result.maritalstatus == 'Single') {single = "Yes"; spousefirst = ""; spouselast = "";}
    if (result.maritalstatus == 'Married') {married = "Yes";}
    var data = fdf.generate({
        "first name": result.firstname,
        "last name": result.lastname,
        "agent_id": result.agentid,
        "Agent Date": datetime,
        "single" : single,
        "married" : married,
        "spousefirstname" : spousefirst,
        "spouselastname" : spouselast,
        "Phone" : result.phonenumber,
        "ALT" : result.altphonenumber,
        "Address" : result.address,
        "City" : result.city,
        "State" : result.state,
        "Zip" : result.zip,
        "Email" : result.email,
        "Birth date" : utility.convertDate(result.birthdate),
        "Number of People" : result.coveragenumber,
        "Primary Social Security" : result.ss
    });
    return data;
}