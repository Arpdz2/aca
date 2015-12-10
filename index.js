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
    userFunctions = require('./routes/userFunctions.js'),
    nodemailer = require('nodemailer'),
    mandrillTransport = require('nodemailer-mandrill-transport'),
    fdf = require('fdf'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    util = require('util'),
    PDFDocument = require ('pdfkit'),
    enforce = require('express-sslify'),
    utility = require('./routes/utility.js'),
    fdfgenerator = require('./routes/fdfdata.js'),
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

app.use(function (req, res, next) {
  res.locals.login = req.isAuthenticated();
  next();
});


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

app.use(enforce.HTTPS({ trustProtoHeader: true })); //*****Enable for production to force https******

app.get('/', function(req, res) {
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            res.render('pages/index', { user: null, employee: result });
        });
    } else {
        res.render('pages/index', { user: req.user, employee: null });
    }
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
                var writeStream = fs.createWriteStream(result._id + 'stamp.pdf');
                doc.pipe(writeStream);
                doc.image(result._id + '.png', 60, 432, {width: 160, height: 12});
                doc.end();
                writeStream.on('finish', function () {
                console.log("stamp pdf");
                    var stamped = spawn('cpdf', ['-stamp-on', result._id + 'stamp.pdf', './public/pdf/combinedpdf.pdf', '2', '-o', result._id + '.pdf']);
                    stamped.on('close', function(code){
                    console.log("stamped pdf");
                        fdfgenerator.generate(result, function(fdfdata){
                        var data = fdfdata;
                        fs.writeFile(result._id + '.fdf', data, function (err) {
                        console.log("fdf");
                            var final = spawn('pdftk', [result._id + '.pdf', 'fill_form', result._id + ".fdf", 'output', result._id + 'final.pdf', 'flatten']);
                            final.on('close', function(code){
                                console.log("final pdf");
                                    res.redirect('/pdf/' + result.id + "/employee.pdf");
                                    console.log("redirect");
                            });
                        });
                    });
                });
            });
        });
    }
        else {
        res.redirect(req.get('referer'));
        }
    });
});

app.get('/pdf/:employeeid/employee.pdf', isLoggedIn, function(req, res){
    var emp = req.params.employeeid;
    var tempFile= req.params.employeeid + "final.pdf";
    fs.readFile(tempFile, function (err,data){
        res.contentType("application/pdf");
        res.send(data);
        console.log("pdf load")
        res.on('finish', function() {
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
});

app.get('/passwordExpired', function(req, res){
    console.log(req.session.email);
    var emailAddress = req.session.email;
    res.render('pages/passwordExpired', {emailAddress : emailAddress, message : '', user: req.user, employee: null });
});

app.post('/passwordExpired', function(req, res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log("error");
        }
        if (req.body.password != req.body.passwordverify)
        {
            res.render('pages/passwordExpired', {emailAddress : emailAddress, message : "Passwords are not the same", user: req.user, employee: null });
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

app.get('/quote', function(req, res) {
  res.render('pages/quote', { user: req.user, employee: null });
});

app.post('/submitContactForm', function(req, res) {
    var firstName = req.body.firstName
    var lastName = req.body.lastName
    var companyName = req.body.companyName
    var emailAddress = req.body.emailAddress
    var phoneNumber = req.body.phoneNumber
    var comments = req.body.comments
    
//    sendEmail.sendQuote(firstName, lastName, streetAddress, city, state, zipCode, phoneNumber, emailAddress, comments, function(statusCode, result) {
//        console.log("Email sent...");
//    })
    res.render('pages/success', { user: req.user, employee: null });
});


app.get('/success', function(req, res) {
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            res.render('pages/success', { user: null, employee: result });
        });
    } else {
        res.render('pages/success', { user: req.user, employee: null });
    }
});

app.get('/smallbusiness', function(req, res) {
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            res.render('pages/smallbusiness', { user: null, employee: result });
        });
    } else {
        res.render('pages/smallbusiness', { user: req.user, employee: null });
    }
});

app.get('/healthplan', function(req, res) {
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            res.render('pages/healthplan', { user: null, employee: result });
        });
    } else {
        res.render('pages/healthplan', { user: req.user, employee: null });
    }
});

app.get('/contact', function(req, res) {
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            res.render('pages/contact', { user: null, employee: result });
        });
    } else {
        res.render('pages/contact', { user: req.user, employee: null });
    }
});

app.get('/agentLogin', function(req, res) {
    res.render('pages/login', { message: req.flash('loginMessage'), user: req.user, employee: null });
    console.log("Rendering login tab");
});

app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('pages/signup', { message: req.flash('signupMessage'), user: req.user, employee: null });
});

app.get('/agentDashboard', isLoggedIn, function(req, res) {
    res.render('pages/agentDashboard', { user : req.user, employee: null });
});

app.get('/adminDashboard', isLoggedIn, function(req, res) {
    userFunctions.list(function (err, data) {
        res.render('pages/adminDashboard', { user : req.user, employee: null, users : data });
    });
});

app.get('/hc', isLoggedIn, function(req, res) {
    res.render('pages/hc', { user: req.user, employee: null });
});

app.get('/back', isLoggedIn, function(req, res) {
    
    if (req.user.local.role == "agent") {
        res.redirect('/agentDashboard');
    } else if (req.user.local.role == "admin") {
        res.redirect('/adminDashboard');
    }
    
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
                    user: req.user, employee: null, search: results // get the user out of session and pass to template
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
    
    if (req.isAuthenticated()) {
        // if user is authenticated in the session, carry on
        return next();
    } else {
        // if they aren't redirect them to the home page
        res.redirect('/');
    }
}

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/agentDashboard', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.post('/agentLogin',
         passport.authenticate('local-login', { failureRedirect : '/agentLogin', failureFlash : true }),
        function(req, res) {
            console.log(req.user.local.role);
            if (req.user.local.role == "agent") {
                res.redirect('/agentDashboard');
            } else if (req.user.local.role == "admin") {
                res.redirect('/adminDashboard');
            }
        }
);

//add a new case
app.get('/profile/case', isLoggedIn, function(req, res)
{
    res.render('pages/case', {
        user : req.user, employee: null // get the user out of session and pass to template
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
        }
    );
});

app.get('/:employer/sendemail/:id/:eid/:employeremail/:altemail', isLoggedIn, function(req, res) {
    var agentEmail = req.user.local.email;
    var transport = nodemailer.createTransport(mandrillTransport({
        auth: {
            apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
        }
    }));
    transport.sendMail({
        from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
        to: req.params.employeremail,
        cc: req.params.altemail + ", " + agentEmail,
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
    var eid = req.params.eid;
    var id = req.params.id;
    req.session.empid = eid;
    console.log(req.session.empid);
    user.findOne({'_id' : req.params.id }, function (err, user) {
        if (err) {
            throw(err);
        }
        console.log("User:" + user);
        employee.find({}, function(err, docs){
            if(err) {
                throw(err);
            }
            res.render('pages/employer', {user : req.user, employee: null, id : user, page : eid, emp : docs, url: signupUrl/*, title: post.title, url: post.URL */});
        });
    });
});

app.get('/:id/:eid/:firstName/:lastName', isLoggedIn, function(req, res)
{
    var url = req.originalUrl;
    var eid = req.params.eid;
    var id = req.params.id;
    req.session.empid = eid;
    console.log(req.session.empid);
    employee.find({}, function(err, docs){
        if(err) {
            res.json(err);
        }
        res.render('pages/adminEmployee', { user: req.user, employee: null });
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

app.post('/update/:id/:employerid', isLoggedIn, function(req, res){
    //var a = req.user;
    var a = req.params.id;
    var id = req.params.employerid;
    //user.update({"_id" : a._id, "employer._id" : id},{$set : {
    user.update({"employer._id" : id},{$set : {
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
    //res.redirect('/' + a._id + '/' + id);
    res.redirect('/' + a + '/' + id);
});

app.get('/signup/:agentid/:employerid', function(req,res){
    req.session.agentid = req.params.agentid;
    req.session.employerid = req.params.employerid;
    user.findOne({'_id' : req.params.agentid }, function(err, docs) {
        if (err) res.redirect('/', { user: req.user, employee: null });
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
    res.render('pages/login2', {message : "", user: req.user, employee: null });
});

app.post('/login', function(req,res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log(err);
        // if no user is found, return the message
        } else if (!user) {
            res.render('pages/login2', {message : "No user exists", user: req.user, employee: null });
        // if the user is found but the password is wrong
        } else if (!user.validPassword(req.body.password)) {
            res.render('pages/login2', {message : "Invalid Password", user: req.user, employee: null });
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
    res.render('pages/recovery', { user: req.user, employee: null });
});

app.post('/recovery', function(req, res){
    
    var optionsRadios = req.body.optionsRadios;
    
    if (optionsRadios == 'option1') {
        sendEmail.passwordReset(req, function(string){
            res.render('pages/login2', {message : string, user: null, employee: null});
        });
    } else if (optionsRadios == 'option2') {
        sendEmail.forgotEmail(req, res, function(string) {
            res.render('pages/login2', {message : string, user: null, employee: null});
        });
    } else if (optionsRadios == 'option3') {
        console.log("option3 not setup.");
    }
    

});

app.get('/information', function(req, res){
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            console.log(result.email);
            var agentid = result.agentid;
            var employerid = result.employerid;
            user.findOne({'_id': agentid}, function (err, docs) {
                res.render('pages/information', {employee: result, user: null, docs: docs, employerid: employerid});
            });
        });
    }
    else{
        res.redirect('/');
    }
});

app.post('/information', function(req, res){
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
                    res.redirect('/information?=saved');
                });
            });
        });
    }
    else{
        res.redirect('/');
    }
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
