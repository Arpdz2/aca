var fdf = require('fdf')
utility = require('./utility.js');

exports.generate = function(result, callback) {
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
        "Primary Social Security" : result.ss,
        "d1firstname" : result.d1firstname,
        "d1lastname" : result.d1lastname,
        "d1birthdate" : utility.convertDate(result.d1birthdate),
        "d1ss" : result.d1ss,
        "d1gender" : result.d1gender,
        "d1gendercigna" : result.d1gender,
        "d1coverage" : result.d1coverage,
        "d2firstname" : result.d2firstname,
        "d2lastname" : result.d2lastname,
        "d2birthdate" : utility.convertDate(result.d2birthdate),
        "d2ss" : result.d2ss,
        "d2gender" : result.d2gender,
        "d2gendercigna" : result.d2gender,
        "d2coverage" : result.d2coverage,
        "d3firstname" : result.d3firstname,
        "d3lastname" : result.d3lastname,
        "d3birthdate" : utility.convertDate(result.d3birthdate),
        "d3ss" : result.d3ss,
        "d3gender" : result.d3gender,
        "d3gendercigna" : result.d3gender,
        "d3coverage" : result.d3coverage,
        "d4firstname" : result.d4firstname,
        "d4lastname" : result.d4lastname,
        "d4birthdate" : utility.convertDate(result.d4birthdate),
        "d4ss" : result.d4ss,
        "d4gender" : result.d4gender,
        "d4gendercigna" : result.d4gender,
        "d4coverage" : result.d4coverage,
        "employername" : result.employername,
        "employerphone" : result.employerphone,
        "income" : result.income,
        "physician" : result.physician,
        "specialty" : result.physicianspecialty,
        "ailment1" : result.ailment1,
        "ailment2" : result.ailment2,
        "ailment3" : result.ailment3,
        "prescription1" : result.prescription1,
        "prescription2" : result.prescription2,
        "prescription3" : result.prescription3,
        "dosage1" : result.dosage1,
        "dosage2" : result.dosage2,
        "dosage3" : result.dosage2,
        "gender" : result.gender
    });
    callback(data);
}