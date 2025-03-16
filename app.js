require('dotenv').config();

// Dependencies
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require('bcrypt');
const joi = require('joi');

// Constants
const port = process.env.PORT || 3001;
const app = express();

// EJS 
app.set('view engine', 'ejs');
const path = require('path');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
    cookie: { maxAge: 3600000 }
}));

// Mongoose
Mongoose.connect(process.env.MONGO_URL)
    .then(async () => {
        console.log("MongoDB connected successfully");
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });

// Passport
app.use(passport.initialize());
app.use(passport.session());
require('./public/js/passport.js')(passport);
// Routes
app.use('/', require('./public/js/home'));


app.post('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send('Error logging out');
            }
            res.redirect('/');
        });
    });
});

app.post('/checkAuth', (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({ success: true });
    }
    res.json({ success: false });
});

app.get("*", (req, res) => {
    res.status(404);
    res.render("404");
});

// Start the server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
