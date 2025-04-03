const express = require('express');
const path = require('path');
const app = express();

// Constants
const port = 3001;

// View Engine (optional, if you still use EJS templates)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cross-Origin headers (for features like audio processing)
app.use((req, res, next) =>
{
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Content-Security-Policy",
        "default-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://code.jquery.com; " +
        "img-src 'self' data: blob: https://comp4537-project-5ddxc.ondigitalocean.app;"
    );
    next();
});


// Middleware to parse requests and serve frontend files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));

// Route
app.use('/', require('./public/js/home'));

// 404 fallback
app.get('*', (req, res) => res.status(404).render('404'));

// Start server
app.listen(port, () => console.log(`Client running at http://localhost:${port}`));
