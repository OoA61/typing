const express = require('express');
const bodyParser = require('body-parser');
const app = express()
const path = require("path"); 
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
let mysql = require('mysql');

//middleware for bodyparse
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

//middleware for EJS view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));

//middleware for creating user sessions
const options = {
    host: 'localhost',
    user: 'root',
    password: 'Blue4524.',
    database: 'keyboardApp'
};
const db = mysql.createConnection(options);
const sessionStore = new MySQLStore({}, db);
app.use(session({
        secret: '1234',
        resave: false,
        saveUninitialized: false,
        store: sessionStore
    })
);

//creates authorization requirement to access page
const isAuth = (req, res, next) => {
    if(req.session.isAuth) {
        next()
    }
    else {
        res.redirect("/login")
    }
};


app.get('/', isAuth, (req, res) => {
    console.log("not logged in");
})

app.get('/register', (req, res) => {
    res.render('register');
})


app.get('/dashboard', isAuth, (req, res) => {
    var passage = "iaculis varius morbi scelerisque et sem et fringilla etiam turpis metus eleifend ut nulla sit amet pellentesque viverra tellus ut aliquet bibendum facilisis viamus a rhoncus dui ut eros nisi pulvinar quis porta sed pulvinar eget arcu duis tincidunt nunc eget odio hendrerit consectetur sit amet vel nisi. Pellentesque ut lobortis dolor, vel pretium sapien. Donec lobortis condimentum massa nec dapibus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur luctus quam in ex facilisis varius. Praesent non vehicula tortor, non sollicitudin elit. Curabitur mattis, metus eget condimentum pellentesque, metus est fermentum libero, non feugiat sapien justo nec lectus. Proin rutrum, quam vel tristique suscipit, metus justo congue purus, in accumsan sem sapien et felis."
    //creates an array of all the words, but we need a dictionary where 1 = array of characters in word 
    var words = passage.split(" ")
    //need to figure our a way to create an object where words are in order and each have definition of their characters
    var characters = {}
    for(let i = 0 ; i < words.length; i++){
        characters[i] = words[i].split("")
    }
    const count = words.length
    console.log(characters)
    console.log(count)
    res.render('dashboard', {passage : passage, count : count, characters : characters});
})

app.get('/addfriends', isAuth, (req, res) => {
    res.render('addfriend');
})

//renders login page
app.get('/login', (req, res) => {
    res.render('login')
})

//logout by destorying session 
app.post('/logout', (req,res) => {
    req.session.destroy((err) => {
        if(err) throw err;
        res.redirect('/');
    })
})


const userRouter = require('./routes/users.js');
const { count } = require('console');
app.use('/users', userRouter)


app.listen(5010, () => {
    console.log('server is running on localhost:5005');
})

