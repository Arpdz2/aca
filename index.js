var express = require('express'),
    sendEmail = require('./routes/sendEmail.js'),
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

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/test', function(req, res){
    console.log(spawn('ls'));
    spawn('chmod', ['+x', '/app/cpdf/cpdf']);
    spawn('cpdf');
    console.log("done");
    res.redirect('/');
})


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
                            spawn('cpdf', ['-stamp-on', result._id + 'stamp.pdf', './public/pdf/ClientInformation.pdf', '2', '-o', result._id + '.pdf']);
                        }
                    });
                }, 1000);
            });
        }
        else {
            res.redirect(req.get('referer'));
        }
        var single = "Off";
        var married = "Off";
        var spousefirst = result.spousefirstname;
        var spouselast = result.spouselastname;
        var datetime = new Date();
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
            "Birth date" : result.birthdate,
            "Number of People" : result.coveragenumber,
            "Primary Social Security" : result.ss
        });

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
    var tempFile= request.params.employeeid + "final.pdf";
    fs.readFile(tempFile, function (err,data){
        response.contentType("application/pdf");
        response.send(data);
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
    res.render('pages/search', {
        user : req.user // get the user out of session and pass to template
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

app.get('/:employer/sendemail/:id/:eid/:employeremail', isLoggedIn, function(req, res) {
    var transport = nodemailer.createTransport(mandrillTransport({
        auth: {
            apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
        }
    }));
    transport.sendMail({
        from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
        to: 'brenden.mckamey@gmail.com',
//        to: req.params.employeremail,
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

app.get('/recovery', function(req,res){
    res.render('pages/recovery');
});

app.post('/recovery', function(req, res){
    var optionsRadios = req.body.optionsRadios
    
    if (optionsRadios == 'option1') {
        employee.findOne({ 'email' :  req.body.email }, function(err, user) {
            if (err) {
                console.log("error");
            } else if (user) {
                var transport = nodemailer.createTransport(mandrillTransport({
                    auth: {
                        apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
                    }
                }));
                transport.sendMail({
                    from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                    to: 'brenden.mckamey@gmail.com',
            //        to: user.email,
                    subject: 'ACA Insurance Credentials',
                    html: '<p>Dear ' + user.firstname + ',<br/>Your temporary password for ACA Insurance is below. Your username will be sent in a separate email. Please use the link below to login.<br/><b>Password: </b>' + user.password + '<br/><b>Link to site: </b>' + req.protocol + '://' + req.get("host") + '<br/>If you have any questions or issues regarding access to ACA Insurance, please e-mail EMAILHERE or call TEAMHERE at NUMBERHERE.</p><p>Thank you,<br/>ACA Insurance Group</p>'
                }, function(err, info) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });
                transport.sendMail({
                    from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                    to: 'brenden.mckamey@gmail.com',
            //        to: user.email,
                    subject: 'ACA Insurance Credentials',
                    html: '<p>Dear ' + user.firstname + ',<br/>Your username for ACA Insurance is below. Your temporary password will be sent in a separate email. Please use the link below to login.<br/><b>Username: </b>' + user.email + '<br/><b>Link to site: </b>' + req.protocol + '://' + req.get("host") + '<br/>If you have any questions or issues regarding access to ACA Insurance, please e-mail EMAILHERE or call TEAMHERE at NUMBERHERE.</p><p>Thank you,<br/>ACA Insurance Group</p>'
                }, function(err, info) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });
            }
        });
    } else if (optionsRadios == 'option2') {
        console.log("option2 not setup.");
    } else if (optionsRadios == 'option3') {
        console.log("option3 not setup.");
    }
    
    res.redirect("/");
});

app.post('/login', function(req,res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err)
            console.log(err);
        // if no user is found, return the message
        else if (!user)
            res.render('pages/login2', {message : "No user exists" });
        // if the user is found but the password is wrong
        else if (!user.validPassword(req.body.password))
            res.render('pages/login2', {message : "Invalid Password" });
        // all is well, return successful user
        else {
            req.session.employee = user._id;
            res.redirect('/information');
        }
});
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
            if (req.body.signatureid) {result.signature = req.body.signatureid;}
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
            result.save(function (err) {
                res.redirect('/information');
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

