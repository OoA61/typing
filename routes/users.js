const { query } = require('express');
const express = require('express');
const router = express.Router();
let mysql = require('mysql');


let db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Blue4524.',
    database: 'keyboardApp'
});

db.connect(function(err){
    if(err) {
        return console.error('error: ' + err.message);
    }
    console.log('Connected to the MySql server.');
})

router.post('/add', (req, res) => {
    if (req.body.password === req.body.password1 && req.body.password.length >= 8)
    {
        db.query(
            'SELECT username FROM users WHERE username = ?',
            [req.body.username],
            (error,results) => {
                if (error) {
                    console.log(error);
                }
                if (results.length > 0) {
                    console.log("username already exists")
                    res.redirect('/register')
                }
                else {
                    let sql = 'INSERT INTO users(username, password) VALUES (?);'
                    let values = [req.body.username, req.body.password];
                    db.query(sql, [values], function (err, result) {
                        if (err) throw err;
                        console.log("Number of records inserted: " + result.affectedRows);
                    });
                    res.redirect('/login');
                    console.log("New user has been added");
                }
            }
        )
    }
})

router.post('/login', (req, res) => {
    username = req.body.username;
    password = req.body.password;
    db.query(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        (error, results) => {
            if (error) {
                console.log(error);
            }
            if (results.length > 0) {
                req.session.isAuth = true;
                req.session.user = username;
                res.redirect('/dashboard');
                console.log('login successful');
                console.log("user route" + req.session.user)
                req.session.save
            } else {
                console.log('login failed');
            }
        }    
    )
});

module.exports = router;
