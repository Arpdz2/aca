var express = require('express');
var user = require('./user.js');
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');

exports.update = function(req, result, callback) {
    user.findOne({_id: result.agentid}, function (err, doc) {
        if (doc) {
            var update = ["<table style='width:100%'>", "<tr><td><b>Field</b></td><td><b>New</b></td><td><b>Old</b></td><tr>"];
            if (result.firstname !== req.body.FirstName)                                 {update.push("<tr><td>First Name</td><td>" +  req.body.FirstName + "</td><td>" + result.firstname + "</td>")};
            if (result.lastname !== req.body.LastName)                                   {update.push("<tr><td>Last Name</td><td>" +  req.body.LastName + "</td><td>" + result.lastname + "</td>")};
            if (result.maritalstatus !== req.body.MaritalStatus)                         {update.push("<tr><td>Marital Status</td><td>" +  req.body.MaritalStatus + "</td><td>" + result.maritalstatus + "</td>")};
            if (result.spousefirstname !== req.body.SpouseFirstName)                     {update.push("<tr><td>Spouse First Name</td><td>" +  req.body.SpouseFirstName + "</td><td>" + result.spousefirstname + "</td>")};
            if (result.spouselastname !== req.body.SpouseLastName)                       {update.push("<tr><td>Spouse Last Name</td><td>" +  req.body.SpouseLastName + "</td><td>" + result.spouselastname + "</td>")};
            if (result.phonenumber !== req.body.PhoneNumber)                             {update.push("<tr><td>Phone Number</td><td>" +  req.body.PhoneNumber + "</td><td>" + result.phonenumber + "</td>")};
            if (result.altphonenumber !== req.body.AlternatePhoneNumber)                 {update.push("<tr><td>Alternate Phone Number</td><td>" +  req.body.AlternatePhoneNumber + "</td><td>" + result.altphonenumber + "</td>")};
            if (result.address !== req.body.Address)                                     {update.push("<tr><td>Address</td><td>" +  req.body.Address + "</td><td>" + result.address + "</td>")};
            if (result.city !== req.body.City)                                           {update.push("<tr><td>City</td><td>" +  req.body.City + "</td><td>" + result.city + "</td>")};
            if (result.state !== req.body.State)                                         {update.push("<tr><td>State</td><td>" +  req.body.State + "</td><td>" + result.state + "</td>")};
            if (result.zip !== req.body.Zip)                                             {update.push("<tr><td>Zip Code</td><td>" +  req.body.Zip + "</td><td>" + result.zip + "</td>")};
            if (result.email !== req.body.Email)                                         {update.push("<tr><td>Email</td><td>" +  req.body.Email + "</td><td>" + result.email + "</td>")};
            if (result.birthdate !== req.body.BirthDate)                                 {update.push("<tr><td>Birth Date</td><td>" +  req.body.BirthDate + "</td><td>" + result.birthdate + "</td>")};
            if (result.coveragenumber !== req.body.NumberofPeopleThatNeedCoverage)       {update.push("<tr><td># of people receiving coverage</td><td>" +  req.body.NumberofPeopleThatNeedCoverage + "</td><td>" + result.coveragenumber + "</td>")};
            if (result.ss !== req.body.PrimarySocialSecurity)                            {update.push("<tr><td>SSN</td><td>" +  req.body.PrimarySocialSecurity + "</td><td>" + result.ss + "</td>")};
            if (result.gender !== req.body.Gender)                                       {update.push("<tr><td>Gender</td><td>" +  req.body.Gender + "</td><td>" + result.gender + "</td>")};
            if (result.d1firstname !== req.body.Dependent1FirstName)                     {update.push("<tr><td>Dependent 1 First Name</td><td>" +  req.body.Dependent1FirstName + "</td><td>" + result.d1firstname + "</td>")};
            if (result.d1lastname !== req.body.Dependent1LastName)                       {update.push("<tr><td>Dependent 1 Last Name</td><td>" +  req.body.Dependent1LastName + "</td><td>" + result.d1lastname + "</td>")};
            if (result.d1birthdate !== req.body.Dependent1BirthDate)                     {update.push("<tr><td>Dependent 1 Birth Date</td><td>" +  req.body.Dependent1BirthDate + "</td><td>" + result.d1birthdate + "</td>")};
            if (result.d1ss !== req.body.Dependent1SocialSecurity)                       {update.push("<tr><td>Dependent 1 Social Security</td><td>" +  req.body.Dependent1SocialSecurity + "</td><td>" + result.d1ss + "</td>")};
            if (result.d1gender !== req.body.Dependent1Gender)                           {update.push("<tr><td>Dependent 1 Gender</td><td>" +  req.body.Dependent1Gender + "</td><td>" + result.d1gender + "</td>")};
            if (result.d1coverage !== req.body.Dependent1NeedsCoverage)                  {update.push("<tr><td>Dependent 1 Coverage</td><td>" +  req.body.Dependent1NeedsCoverage + "</td><td>" + result.d1coverage + "</td>")};
            if (result.d2firstname !== req.body.Dependent2FirstName)                     {update.push("<tr><td>Dependent 2 First Name</td><td>" +  req.body.Dependent2FirstName + "</td><td>" + result.d2firstname + "</td>")};
            if (result.d2lastname !== req.body.Dependent2LastName)                       {update.push("<tr><td>Dependent 2 Last Name</td><td>" +  req.body.Dependent2LastName + "</td><td>" + result.d2lastname + "</td>")};
            if (result.d2birthdate !== req.body.Dependent2BirthDate)                     {update.push("<tr><td>Dependent 2 Birth Date</td><td>" +  req.body.Dependent2BirthDate + "</td><td>" + result.d2birthdate + "</td>")};
            if (result.d2ss !== req.body.Dependent2SocialSecurity)                       {update.push("<tr><td>Dependent 2 Social Security</td><td>" +  req.body.Dependent2SocialSecurity + "</td><td>" + result.d2ss + "</td>")};
            if (result.d2gender !== req.body.Dependent2Gender)                           {update.push("<tr><td>Dependent 2 Gender</td><td>" +  req.body.Dependent2Gender + "</td><td>" + result.d2gender + "</td>")};
            if (result.d2coverage !== req.body.Dependent2NeedsCoverage)                  {update.push("<tr><td>Dependent 2 Coverage</td><td>" +  req.body.Dependent2NeedsCoverage + "</td><td>" + result.d2coverage + "</td>")};
            if (result.d3firstname !== req.body.Dependent3FirstName)                     {update.push("<tr><td>Dependent 3 First Name</td><td>" +  req.body.Dependent3FirstName + "</td><td>" + result.d3firstname + "</td>")};
            if (result.d3lastname !== req.body.Dependent3LastName)                       {update.push("<tr><td>Dependent 3 Last Name</td><td>" +  req.body.Dependent3LastName + "</td><td>" + result.d3lastname + "</td>")};
            if (result.d3birthdate !== req.body.Dependent3BirthDate)                     {update.push("<tr><td>Dependent 3 Birth Date</td><td>" +  req.body.Dependent3BirthDate + "</td><td>" + result.d3birthdate + "</td>")};
            if (result.d3ss !== req.body.Dependent3SocialSecurity)                       {update.push("<tr><td>Dependent 3 Social Security</td><td>" +  req.body.Dependent3SocialSecurity + "</td><td>" + result.d3ss + "</td>")};
            if (result.d3gender !== req.body.Dependent3Gender)                           {update.push("<tr><td>Dependent 3 Gender</td><td>" +  req.body.Dependent3Gender + "</td><td>" + result.d3gender + "</td>")};
            if (result.d3coverage !== req.body.Dependent3NeedsCoverage)                  {update.push("<tr><td>Dependent 3 Coverage</td><td>" +  req.body.Dependent3NeedsCoverage + "</td><td>" + result.d3coverage + "</td>")};
            if (result.d4firstname !== req.body.Dependent4FirstName)                     {update.push("<tr><td>Dependent 4 First Name</td><td>" +  req.body.Dependent4FirstName + "</td><td>" + result.d4firstname + "</td>")};
            if (result.d4lastname !== req.body.Dependent4LastName)                       {update.push("<tr><td>Dependent 4 Last Name</td><td>" +  req.body.Dependent4LastName + "</td><td>" + result.d4lastname + "</td>")};
            if (result.d4birthdate !== req.body.Dependent4BirthDate)                     {update.push("<tr><td>Dependent 4 Birth Date</td><td>" +  req.body.Dependent4BirthDate + "</td><td>" + result.d4birthdate + "</td>")};
            if (result.d4ss !== req.body.Dependent4SocialSecurity)                       {update.push("<tr><td>Dependent 4 Social Security</td><td>" +  req.body.Dependent4SocialSecurity + "</td><td>" + result.d4ss + "</td>")};
            if (result.d4gender !== req.body.Dependent4Gender)                           {update.push("<tr><td>Dependent 4 Gender</td><td>" +  req.body.Dependent4Gender + "</td><td>" + result.d4gender + "</td>")};
            if (result.d4coverage !== req.body.Dependent4NeedsCoverage)                  {update.push("<tr><td>Dependent 4 Coverage</td><td>" +  req.body.Dependent4NeedsCoverage + "</td><td>" + result.d4coverage + "</td>")};
            if (result.employername !== req.body.employer)                               {update.push("<tr><td>Employer Name</td><td>" +  req.body.employer + "</td><td>" + result.employername + "</td>")};
            if (result.employerphone !== req.body.employerphone)                         {update.push("<tr><td>Employer Phone</td><td>" +  req.body.employerphone + "</td><td>" + result.employerphone + "</td>")};
            if (result.income !== req.body.income)                                       {update.push("<tr><td>Household Income</td><td>" +  req.body.income + "</td><td>" + result.income + "</td>")};
            if (result.physician !== req.body.physician)                                 {update.push("<tr><td>Physician</td><td>" +  req.body.physician + "</td><td>" + result.physician + "</td>")};
            if (result.physicianspecialty !== req.body.physicianspecialty)               {update.push("<tr><td>Physician Specialty</td><td>" +  req.body.physicianspecialty + "</td><td>" + result.physicianspecialty + "</td>")};
            if (result.ailment1 !== req.body.ailment1)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment1 + "</td><td>" + result.ailment1 + "</td>")};
            if (result.ailment2 !== req.body.ailment2)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment2 + "</td><td>" + result.ailment2 + "</td>")};
            if (result.ailment3 !== req.body.ailment3)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment3 + "</td><td>" + result.ailment3 + "</td>")};
            if (result.prescription1 !== req.body.prescription1)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription1 + "</td><td>" + result.prescription1 + "</td>")};
            if (result.prescription2 !== req.body.prescription2)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription2 + "</td><td>" + result.prescription2 + "</td>")};
            if (result.prescription3 !== req.body.prescription3)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription3 + "</td><td>" + result.prescription3 + "</td>")};
            if (result.dosage1 !== req.body.dosage1)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage1 + "</td><td>" + result.dosage1 + "</td>")};
            if (result.dosage2 !== req.body.dosage2)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage2 + "</td><td>" + result.dosage2 + "</td>")};
            if (result.dosage3 !== req.body.dosage3)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage3 + "</td><td>" + result.dosage3 + "</td>")};
            update.push("</table>");

            if (update.length > 3) {
                var data = "";
                for (var i = 0; i < update.length; i++) {
                    data += update[i];
                }
            var transport = nodemailer.createTransport(mandrillTransport({
                auth: {
                    apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
                }
            }));

            transport.sendMail({
                from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                to: doc.local.email,
                subject: 'ACA Employee Updated Information',
                html: result.firstname + ' ' + result.lastname + ' employed at ' + result.employername  + ' has changed their information:<br><br>'
                + data
                ,
            }, function(err, info) {
                if (err) {
                    console.error(err);
                } else {
                    callback("email sent");
                }
            });
                }
            else {callback("no update");}
            }
    });
}