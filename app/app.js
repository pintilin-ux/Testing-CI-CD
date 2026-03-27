// Import express.js
const express = require("express");

// Get the models
const { Student } = require("./models/student");

const programmes = require("./models/programmes");

const { User } = require("./models/user");

// Create express app
var app = express();

// Set the sessions
var session = require('express-session');
app.use(session({
  secret: 'secretkeysdfjsflyoifasd',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.urlencoded({ extended: true }));


// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Create a route for root


// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
//app.get("/", function(req, res) {
//res.send("Hello EDi!");
//});



// Create a route for root - /
app.get("/", function(req, res) {
    console.log(req.session);
    if (req.session.uid) {
		res.send('Welcome back, ' + req.session.uid + '!');
	} else {
		res.send('Please login to view this page!');
	}
	res.end();
});

// Task 2 display a formatted list of students
app.get("/all-students-formatted", function(req, res) {
    var sql = 'select * from test_table';
    db.query(sql).then(results => {
    	    // Send the results rows to the all-students template
    	    // The rows will be in a variable called data
        res.render('all-student', {data: results});
    });
});


app.get("/roehampton", function(req, res) {
    console.log(req.url)
    let path = req.url;
    res.send(path.substring(0,4))
});


app.get("/student/:name/:id", function(req, res) {

    const name = req.params.name;
    const id = req.params.id;

    res.send(`
        <html>
        <head>
            <title>Student Info</title>
            <style>
                table { border-collapse: collapse; width: 300px; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h2>Student Details</h2>
            <table>
                <tr>
                    <th>Name</th>
                    <th>ID</th>
                </tr>
                <tr>
                    <td>${name}</td>
                    <td>${id}</td>
                </tr>
            </table>
        </body>
        </html>
    `);
});




// Create a route for testing the db
app.get("/db_test/:id", function(req, res) {

    // 1️⃣ Capture the id parameter from the URL
    const id = req.params.id;

    // 2️⃣ SQL query with WHERE clause
    const sql = "SELECT name FROM test_table WHERE id = ?";

    // 3️⃣ Run query with parameter (prevents SQL injection)
    db.query(sql, [id]).then(results => {

        if (results.length === 0) {
            res.send("<h2>No record found</h2>");
            return;
        }

        const name = results[0].name;

        // 4️⃣ Output formatted HTML
        res.send(`
            <html>
            <head>
                <style>
                    body { font-family: Arial; text-align: center; margin-top: 40px; }
                    .card {
                        display: inline-block;
                        padding: 20px;
                        border-radius: 10px;
                        background: #f4f4f4;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Student Record</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>ID:</strong> ${id}</p>
                </div>
            </body>
            </html>
        `);

    }).catch(err => {
        console.error(err);
        res.send("Database error");
    });
});





// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});



// Single student page, using MVC pattern
app.get("/single-student/:id", async function (req, res) {
    var stId = req.params.id;
    console.log(req.params.id);
    // Create a student class with the ID passed
    var student = new Student(stId);
    await student.getStudentDetails();
    await student.getStudentProgramme();
    await student.getStudentModules();
    resultProgs = await programmes.getAllProgrammes();
    console.log(student);
    res.render('student', {'student':student, 'programmes':resultProgs});
});


// A post route to recieve new data for a students' programme
app.post('/allocate-programme', function (req, res) {
    params = req.body;
    var student = new Student(params.id)
    // Adding a try/catch block which will be useful later when we add to the database
    try {
        student.updateStudentProgramme(params.programme).then(result => {
            res.send('Programme allocated successfully');
        })
     } catch (err) {
         console.error(`Error while adding programme `, err.message);
     }
});



// Videos page
app.get("/videos", function(req, res) {
    res.render("videos");
});

app.get("/about", function(req, res) {
    res.render("about");
});


// Register
app.get('/register', function (req, res) {
    res.render('register');
});

// Login
app.get('/login', function (req, res) {
    res.render('login');
});


app.post('/set-password', async function (req, res) {
    params = req.body;
    var user = new User(params.email);
    try {
        uId = await user.getIdFromEmail();
        if (uId) {
            // If a valid, existing user is found, set the password and redirect to the users single-student page
            await user.setUserPassword(params.password);
            console.log(req.session.id);
            res.send('Password set successfully');
        }
        else {
            // If no existing user is found, add a new one
            newId = await user.addUser(params.email);
            res.send('Perhaps a page where a new user sets a programme would be good here');
        }
    } catch (err) {
        console.error(`Error while adding password `, err.message);
    }
});

// Check submitted email and password pair
app.post('/authenticate', async function (req, res) {
    params = req.body;
    var user = new User(params.email);
    try {
        uId = await user.getIdFromEmail();
        if (uId) {
            match = await user.authenticate(params.password);
            if (match) {
                req.session.uid = uId;
                req.session.loggedIn = true;
                console.log(req.session.id);
                res.redirect('/student-single/' + uId);
            }
            else {
                // TODO improve the user journey here
                res.send('invalid password');
            }
        }
        else {
            res.send('invalid email');
        }
    } catch (err) {
        console.error(`Error while comparing `, err.message);
    }
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');
  });



// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});


app.post('/add-note', async function (req, res) {
    params = req.body;
    // Adding a try/catch block which will be useful later when we add to the database
    var student = new Student(params.id);
    try {
         await student.addStudentNote(params.note);
         res.send('form submitted');
        }
     catch (err) {
         console.error(`Error while adding note `, err.message);
     }
     // Just a little output for now
    res.redirect('/student-single/' + params.id);

});

