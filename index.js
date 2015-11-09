var express = require('express'),
    sendEmail = require('./routes/sendEmail.js'),
    passwordExpired = require('./routes/passwordExpired.js'),
    bodyParser = require('body-parser'),
    app = express(),
    dbConfig = require('./routes/db.js'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash = require('connect-flash'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    random = require("random-js"),
    user = require('./routes/user.js'),
    employee = require('./routes/employee.js'),
    agentDashboard = require('./routes/agentDashboard.js'),
    search = require('./routes/search.js');
    nodemailer = require('nodemailer'),
    mandrillTransport = require('nodemailer-mandrill-transport'),
    fdf = require('fdf'),
    fs = require('fs'),
    spawn = require('child_process').spawn;
    util = require('util');
    PDFDocument = require ('pdfkit');
    enforce = require('express-sslify');
    utility = require('./routes/utility.js');
    fdfgenerator = require('./routes/fdfdata.js');
    updateEmail = require('./routes/updateEmail.js');


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)

mongoose.connect(dbConfig.url);


require('./routes/passport')(passport);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// required for passport
app.use(session({ secret: 'qwdqwdqwdqwdrfergwefdwcwcqcqwdlkqwjmqwdi' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


/*used to enforce https on get requests
app.use('*', function(req,res,next){
    var requestedurl = req.protocol + '://' + req.get('Host') + req.url;
    if (requestedurl.indexOf('localhost') != -1){
        console.log("no https enforced");
        next();
        //dont enforce https
    }
    else {
        app.use(enforce.HTTPS({ trustProtoHeader: true }));
        console.log("https enforced");
        next();
    }
});
*/


//app.use(enforce.HTTPS({ trustProtoHeader: true })); //*****Enable for production to force https******

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/employee/pdf/generator/:employeeid', isLoggedIn, function(req, res)
{
    employee.findOne({_id: req.params.employeeid}, function (err, result) {
        if (result.signature) {
            var img = result.signature;
            // strip off the data: url prefix to get just the base64-encoded bytes
            var data = img.replace(/^data:image\/\w+;base64,/, "");
            var buf = new Buffer(data, 'base64');
            fs.writeFile(result._id + '.png', buf, function (err) {
                console.log("image produced");
                var doc = new PDFDocument;
                doc.pipe(fs.createWriteStream(result._id + 'stamp.pdf'));
                doc.image(result._id + '.png', 60, 432, {width: 160, height: 12});
                doc.end()
                var refreshIntervalId3 = setInterval(function() {
                    fs.stat(result._id + 'stamp.pdf', function(err, exists) {
                        if (exists) {
                            clearInterval(refreshIntervalId3);
                            spawn('cpdf', ['-stamp-on', result._id + 'stamp.pdf', './public/pdf/combinedpdf.pdf', '2', '-o', result._id + '.pdf']);
                        }
                    });
                }, 1000);
            });
        }
        else {
            res.redirect(req.get('referer'));
        }
        var data = fdfgenerator.generate(result);
        fs.writeFile(result._id + '.fdf', data, function (err) {
        });
        var refreshIntervalId2 = setInterval(function() {
            fs.stat(result._id + '.pdf', function(err, exists) {
                if (exists) {
                    clearInterval(refreshIntervalId2);
                    spawn('pdftk', [result._id + '.pdf', 'fill_form', result._id + ".fdf", 'output', result._id + 'final.pdf', 'flatten']);
                }
            });
        }, 1000);
        var refreshIntervalId = setInterval(function() {
            fs.stat(result._id + 'final.pdf', function(err, exists) {
                if (exists) {
                    clearInterval(refreshIntervalId);
                    res.redirect('/pdf/' + result.id);
                }
            });
        }, 1000);
    });
});

app.get('/pdf/:employeeid', isLoggedIn, function(request, response){
    var emp = request.params.employeeid;
    var tempFile= request.params.employeeid + "final.pdf";
    fs.readFile(tempFile, function (err,data){
        response.contentType("application/pdf");
        response.send(data);
    });
    response.on('finish', function() {
    fs.unlink(emp + '.fdf', function(err) {
        fs.unlink(emp + '.pdf', function(err) {
            fs.unlink(emp + '.png', function(err) {
                fs.unlink(emp + 'stamp.pdf', function(err) {
                    fs.unlink(emp + 'final.pdf', function(err) {
                        console.log("All files successfully removed");
                    });
                });
            });
        });
    });
    });
});

app.get('/passwordExpired', function(req, res){
    console.log(req.session.email);
    emailAddress = req.session.email;
    res.render('pages/passwordExpired', {emailAddress : emailAddress, message : ''});
});

app.post('/passwordExpired', function(req, res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log("error");
        }
        if (req.body.password != req.body.passwordverify)
        {
            res.render('pages/passwordExpired', {emailAddress : emailAddress, message : "Passwords are not the same" });
        }
        else
        {
            employee.findOne({_id: req.session.employee}, function (err, result) {
                var mongo = new employee();
                result.password = mongo.generateHash(req.body.password);
                result.passwordIsExpired = "FALSE";
                result.save(function (err) {
                    res.redirect('/information');
                });
            });
        }  
    });
});

app.get('/quote', function(request, response) {
  response.render('pages/quote');
});

app.post('/submitContactForm', function(request, response) {
    var firstName = request.body.firstName
    var lastName = request.body.lastName
    var companyName = request.body.companyName
    var emailAddress = request.body.emailAddress
    var phoneNumber = request.body.phoneNumber
    var comments = request.body.comments
    
//    sendEmail.sendQuote(firstName, lastName, streetAddress, city, state, zipCode, phoneNumber, emailAddress, comments, function(statusCode, result) {
//        console.log("Email sent...");
//    })
    response.render('pages/success');
});


app.get('/success', function(request, response) {
  response.render('pages/success');
});

app.get('/smallbusiness', function(request, response) {
    response.render('pages/smallbusiness');
    console.log("Rendering small business tab");
});

app.get('/healthplan', function(request, response) {
    response.render('pages/healthplan');
    console.log("Rendering health plan tab");
});

app.get('/contact', function(request, response) {
    response.render('pages/contact');
    console.log("Rendering contact us tab");
});

app.get('/loginindex', function(request, response) {
    response.render('pages/loginindex');
    console.log("Rendering loginindex tab");
});

app.get('/agentLogin', function(req, res) {
    res.render('pages/login',{ message: req.flash('loginMessage') });
    console.log("Rendering login tab");
});

app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('pages/signup', { message: req.flash('signupMessage') });
});

/*app.get('/profile', isLoggedIn, function(req, res) {
    res.render('pages/profile', {
        user : req.user // get the user out of session and pass to template
    });
});*/

app.get('/agentDashboard', isLoggedIn, function(req, res) {
    res.render('pages/agentDashboard', {
        user : req.user // get the user out of session and pass to template
    });
});

app.post('/search', isLoggedIn, function(req, res) {
    console.log(req.body.search);
    employee.find(
        { $text : { $search : req.body.search } },
        { score : { $meta: "textScore" } }
    )
        .sort({ score : { $meta : 'textScore' } })
        .exec(function(err, results) {
            if (err) {
                res.redirect('/agentDashboard');
            }
            else if (results) {
                res.render('pages/search', {
                    user: req.user, search: results // get the user out of session and pass to template
                });
            }
            else {
                res.redirect('/agentDashboard');
            }
    });
});


app.get('/logout', function(req, res) {
    req.logout();
    req.session.employee = null;
    res.redirect('/');
});


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/agentDashboard', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

// process the login form
app.post('/agentLogin', passport.authenticate('local-login', {
    successRedirect : '/agentDashboard', // redirect to the secure agentDashboard section
    failureRedirect : '/agentLogin', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

//add a new case
app.get('/profile/case', isLoggedIn, function(req, res)
{
    res.render('pages/case', {
        user : req.user // get the user out of session and pass to template
    });
});

//post employer info and ref it to corresponding agent
app.post('/profile/case', isLoggedIn,function (req, res, next){
    var a = req.user;
    user.findByIdAndUpdate(
        a._id,
        {$push: {"employer": {  empname: req.body.empname,
                                streetaddress: req.body.streetaddress,
                                city: req.body.city,
                                state: req.body.state,
                                zipcode: req.body.zipcode,
                                phonenumber: req.body.phonenumber,
                                email: req.body.email,
                                contact: req.body.contact,
                                altemail: req.body.altemail,
                                altcontact: req.body.altcontact,
                                comments: req.body.comments,
                                payroll: req.body.payroll,
                                dental: req.body.dental,
                                cashadvantage: req.body.cashadvantage,
                                vision: req.body.vision
        }}},
        {safe: true, upsert: true, new : true},
        function(err, model)
        {
            console.log(err);
            return res.redirect('/agentDashboard');
            /*return res.render('pages/profile', {
                user : req.user // get the user out of session and pass to template
            });*/
        }
    );
});

app.get('/:employer/sendemail/:id/:eid/:employeremail/:altemail', isLoggedIn, function(req, res) {
    var transport = nodemailer.createTransport(mandrillTransport({
        auth: {
            apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
        }
    }));
    transport.sendMail({
        from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
        to: req.params.employeremail,
        cc: req.params.altemail,
        subject: 'ACA Insurance Employee Registration Link',
        html: '<p>Dear ' + req.params.employer + ',</p><p>Please forward the below link to your employees in order to register for ACA coverage:</p><p>' + req.protocol + '://' + req.get("host") + '/signup/' + req.params.id + '/' + req.params.eid + '</p><br/><p>Thank you,</p><p>ACA Insurance Group</p>'
    }, function(err, info) {
        if (err) {
            console.error(err);
        } else {
            console.log('Message sent: ' + info.response);
            res.redirect('/agentDashboard');
        }
    });
});


app.get('/:id/:eid', isLoggedIn, function(req, res)
{
    //var a = req.user;
    var signupUrl = req.protocol + '://' + req.get('host') + '/signup'  + req.originalUrl;
    var url = req.originalUrl;
    var eid = url.substr(url.lastIndexOf('/')+1);
    var id = url.substr(1, url.indexOf(eid) - 2);
    req.session.empid = eid;
    console.log(req.session.empid);
    //user.findOne({ id: id, eid: eid }, function (err, post) {
    //   if (err) { throw(err); }
    //    console.log("test");
    //    res.render('pages/employer', {user : req.user, page : eid/*, title: post.title, url: post.URL */});
    //});
    employee.find({}, function(err, docs){
        if(err)res.json(err);
    res.render('pages/employer', {user : req.user, page : eid, emp : docs, url: signupUrl/*, title: post.title, url: post.URL */});
    });
});


app.get('/delete', isLoggedIn, function(req, res) {
    var a = req.user;
    //var url = req.originalUrl;
    //var eid = url.substr(url.lastIndexOf('/')+1);
    var eid = req.session.empid;
    console.log(eid);
    console.log(mongoose.Types.ObjectId.isValid(eid));
    var isvalid = mongoose.Types.ObjectId.isValid(eid)
    if (isvalid === true) {
        employee.remove({employerid: eid}, function (err) {
            if (!err) {
                console.log("Successfully removed corresponding employee accounts");
            }
        });
        a.employer.pull(eid)
            a.save(function (err) {
                req.session.empid = null;
                res.redirect('/agentDashboard');
            });
    }
});

app.post('/update/employer/:employerid', isLoggedIn, function(req, res){
    var a = req.user;
    var id = req.params.employerid;
    user.update({"_id" : a._id, "employer._id" : id},{$set : {
        "employer.$.empname": req.body.empname,
        "employer.$.contact": req.body.contact,
        "employer.$.altemail": req.body.altemail,
        "employer.$.altcontact": req.body.altcontact,
        "employer.$.streetaddress": req.body.streetaddress,
        "employer.$.city": req.body.city,
        "employer.$.state": req.body.state,
        "employer.$.zipcode": req.body.zipcode,
        "employer.$.phonenumber": req.body.phonenumber,
        "employer.$.email": req.body.email,
        "employer.$.comments": req.body.comments
    }}, function(err, docs) {
        if (err) console.log(err);
        else if (docs) console.log(docs);
        else console.log("failure");
    });
    res.redirect('/' + a._id + '/' + id);
});

app.get('/signup/:agentid/:employerid', function(req,res){
    req.session.agentid = req.params.agentid;
    req.session.employerid = req.params.employerid;
    user.findOne({'_id' : req.params.agentid }, function(err, docs) {
        if (err) res.redirect('/');
        else if(docs == null) res.redirect('/');
        else {
            user.find({
                '_id': { $in: [
                    req.params.employerid
                ]}
            }, function(err, docs){
                console.log(docs);
                if (docs != undefined)
                res.render('pages/signup2', {message: ""});
                else res.redirect('/');
            });
        }
    });
});

app.post('/signup2', function(req,res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log("error");
        }
        if (user) {
            res.render('pages/signup2', {message : "Email already taken" });
        }
        else if (req.body.password != req.body.passwordverify)
        {
            res.render('pages/signup2', {message : "Passwords are not the same" });
        }
        else
        {
            var newuser = new employee();
            newuser.email = req.body.email;
            newuser.password = newuser.generateHash(req.body.password);
            newuser.agentid = req.session.agentid;
            newuser.employerid = req.session.employerid;
            newuser.save(function (err) {
                req.session.employee = newuser._id;
                res.redirect('/information');
            });
        }
    });
});

app.get('/login', function(req,res){
    res.render('pages/login2', {message : "" });
});

app.post('/login', function(req,res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log(err);
        // if no user is found, return the message
        } else if (!user) {
            res.render('pages/login2', {message : "No user exists" });
        // if the user is found but the password is wrong
        } else if (!user.validPassword(req.body.password)) {
            res.render('pages/login2', {message : "Invalid Password" });
        // if the user's password is expired
        } else if (user.passwordIsExpired == "TRUE") {
            console.log("Password is expired.")
            req.session.email = req.body.email;
            req.session.employee = user._id
            res.redirect('/passwordExpired');
        // all is well, return successful user
        } else {
            req.session.employee = user._id;
            res.redirect('/information');
        }
    });
});

app.get('/recovery', function(req, res){
    res.render('pages/recovery');
});

app.post('/recovery', function(req, res){
    
    var optionsRadios = req.body.optionsRadios;
    
    if (optionsRadios == 'option1') {
        sendEmail.passwordReset(req, function(string){
            res.render('pages/login2', {message : string});
        });
    } else if (optionsRadios == 'option2') {
        sendEmail.forgotEmail(req, function(string) {
            res.render('pages/login2', {message : string});
        });
    } else if (optionsRadios == 'option3') {
        console.log("option3 not setup.");
    }
    

});

app.get('/information', function(req,res){
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            var agentid = result.agentid;
            var employerid = result.employerid;
            user.findOne({'_id': agentid}, function (err, docs) {
                res.render('pages/information', {employee: result, user: docs, employerid: employerid});
            });
        });
    }
    else{
        res.redirect('/');
    }
});

app.post('/information', function(req,res){
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            updateEmail.update(req, result, function(message) {
                console.log(message);
                if (req.body.signatureid) {
                    result.signature = req.body.signatureid;
                }
                result.firstname = req.body.FirstName;
                result.lastname = req.body.LastName;
                result.maritalstatus = req.body.MaritalStatus;
                result.spousefirstname = req.body.SpouseFirstName;
                result.spouselastname = req.body.SpouseLastName;
                result.phonenumber = req.body.PhoneNumber;
                result.altphonenumber = req.body.AlternatePhoneNumber;
                result.address = req.body.Address;
                result.city = req.body.City;
                result.state = req.body.State;
                result.zip = req.body.Zip;
                result.email = req.body.Email;
                result.birthdate = req.body.BirthDate;
                result.coveragenumber = req.body.NumberofPeopleThatNeedCoverage;
                result.ss = req.body.PrimarySocialSecurity;
                result.gender = req.body.Gender;
                result.d1firstname = req.body.Dependent1FirstName;
                result.d1lastname = req.body.Dependent1LastName;
                result.d1birthdate = req.body.Dependent1BirthDate;
                result.d1ss = req.body.Dependent1SocialSecurity;
                result.d1gender = req.body.Dependent1Gender;
                result.d1coverage = req.body.Dependent1NeedsCoverage;
                result.d2firstname = req.body.Dependent2FirstName;
                result.d2lastname = req.body.Dependent2LastName;
                result.d2birthdate = req.body.Dependent2BirthDate;
                result.d2ss = req.body.Dependent2SocialSecurity;
                result.d2gender = req.body.Dependent2Gender;
                result.d2coverage = req.body.Dependent2NeedsCoverage;
                result.d3firstname = req.body.Dependent3FirstName;
                result.d3lastname = req.body.Dependent3LastName;
                result.d3birthdate = req.body.Dependent3BirthDate;
                result.d3ss = req.body.Dependent3SocialSecurity;
                result.d3gender = req.body.Dependent3Gender;
                result.d3coverage = req.body.Dependent3NeedsCoverage;
                result.d4firstname = req.body.Dependent4FirstName;
                result.d4lastname = req.body.Dependent4LastName;
                result.d4birthdate = req.body.Dependent4BirthDate;
                result.d4ss = req.body.Dependent4SocialSecurity;
                result.d4gender = req.body.Dependent4Gender;
                result.d4coverage = req.body.Dependent4NeedsCoverage;
                result.employername = req.body.employer;
                result.employerphone = req.body.employerphone;
                result.income = req.body.income;
                result.physician = req.body.physician;
                result.physicianspecialty = req.body.physicianspecialty;
                result.ailment1 = req.body.ailment1;
                result.ailment2 = req.body.ailment2;
                result.ailment3 = req.body.ailment3;
                result.prescription1 = req.body.prescription1;
                result.prescription2 = req.body.prescription2;
                result.prescription3 = req.body.prescription3;
                result.dosage1 = req.body.dosage1;
                result.dosage2 = req.body.dosage2;
                result.dosage3 = req.body.dosage3;
                result.save(function (err) {
                    res.redirect('/information');
                });
            });
        });
    }
    else{
        res.redirect('/');
    }
});

//app.get('/employee/pdf/generator/:employeeid', isLoggedIn, function(req, res)
//{
//    employee.findOne({_id: req.params.employeeid}, function (err, result) {
//        var data = fdf.generate({
//            "Applicants Name": result.firstname,
//            "Last": result.lastname
//        });
//        fs.writeFile(result._id + '.fdf', data, function (err) {
//            console.log('done');
//            //res.redirect('/');
//        });
//        spawn('pdftk', ['test3.pdf', 'fill_form', result._id + '.fdf', 'output', result.id + '.pdf', 'flatten']);
//        res.redirect('/pdf/' + result.id);
//    })
//});
// 
//app.get('/pdf/:employeeid', isLoggedIn, function(request, response){
//    var tempFile= request.params.employeeid + ".pdf";
//    fs.readFile(tempFile, function (err,data){
//        response.contentType("application/pdf");
//        response.send(data);
//    });
//});


/*
app.get('/employee', isLoggedIn, function(req,res, next)
{
    console.log(req.session.empid);
    var a = req.user;
    var eid = req.session.empid;
    var isvalid = mongoose.Types.ObjectId.isValid(eid)
    if (isvalid === true) {
        // create the employee
        var newemployee = new employee();

        // set the employee's local credentials
        newemployee.agentid = a._id;
        newemployee.employerid = eid;
        newemployee.editkey = null;

        // save the employee
        newemployee.save(function (err) {
            if (err)
                throw err;

        res.render('pages/employee', {
            user: a, emp: eid // get the user out of session and pass to template
        });
        });
    }
    else
    {
        res.redirect('/profile');
    }
    req.session.empid = null;
});

app.get('/:employeeid', function(req,res) {
    employee.findOne({'_id': req.params.employeeid}, function(err, data){
        if (err)
            res.redirect('/');
        else{
            try {
                req.session.employeeid = req.params.employeeid;
                req.session.employerid = data.employerid;
                res.render('pages/confirm');
            }
            catch(err) {
                console.log(err);
                res.redirect('/');
            }
        }
    });
});

app.post('/confirm', function(req, res){
    if(req.body.password == req.session.employerid)
    {
        employee.findOne({'_id': req.session.employeeid}, function(err, data) {
            var exists = data.editkey;
            if(exists != null) {
                res.render('pages/information', {editkey: "already assigned for this account"});
            }
            else {
                var randomstring = "";
                var random = new random(random.engines.mt19937().autoSeed());
                for (var i = 0; i < 4; i++) {
                    var value = random.integer(0, 9);
                    randomstring += value.toString();
                }
                    data.editkey = randomstring;
                    data.save(function (err) {
                        res.render('pages/information', {editkey: randomstring});
                    });
            }
            });
    }
    else
    {
        res.redirect('/');
    }
});
*/

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
