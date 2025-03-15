require('dotenv').config();
const express = require('express');
const app = express();
const session = require("express-session");
const MongoStore = require('connect-mongo');
const passport = require("passport");
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
const User = require("./js/user.js");
const Timer = require('./js/timerSchema.js');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use("/js", express.static("./webapp/public/js"));
app.use("/css", express.static("./webapp/public/css"));
app.use("/img", express.static("./webapp/public/img"));
app.use("/scenario", express.static("./scenario"));


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function ensureAuthNoRed(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.sendStatus(204);
}
// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
    cookie: { maxAge: 3600000 }
}));

mongoose.connect(process.env.MONGO_URL)
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
require('./js/passport')(passport);

// Routes
app.use('/', require('./js/home'));

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
