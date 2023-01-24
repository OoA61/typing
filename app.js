const express = require('express');
const bodyParser = require('body-parser');
const app = express()
const path = require("path"); 
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
let mysql = require('mysql');
const async = require('async')



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

app.get('/',(req, res) => {
    res.redirect('/login')
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
    res.render('dashboard', {passage : passage, count : count, characters : characters});
})

app.get('/friendslist', isAuth, async (req, res) => {
    var requestedUsernames = [];
    var count = 0; 
    let currentUsername = req.session.user;
    let user_id;
    let friendRequests;
    let friendsList;
    let friends = [];
    let friendsListNames = [];
    await getUserId(currentUsername);
    await getFriendRequests(user_id);

    for (let i = 0; i < friendRequests.length; i++){
        requestedUsernames[i] = await getUserNames(friendRequests[i].user_first_id);
    }

    await getFriendsList(user_id);

    for (let i = 0; i < friendsList.length; i++){
        if (friendsList[i].user_first_id == user_id) {
            friends[i] = friendsList[i].user_second_id;
        }
        else if (friendsList[i].user_second_id == user_id){
            friends[i] = friendsList[i].user_first_id;
        }
    }

    for (let i = 0; i < friends.length; i++){
        let name = await getUserNames(friends[i])
        let wpm = await getWPM(friends[i])
        friendsListNames.push({username: name, wpm: wpm})
    }
    

    console.log(friendsListNames)
    console.log(friends)

    function getUserId(currentUsername){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT user_id FROM users WHERE username = ?',
                [currentUsername],
                function (err, result){
                    if (err){
                        reject(err);
                    } else {
                        resolve(user_id = result[0].user_id)
                    }
                }
            )
        })
    }


    function getFriendRequests(user_id){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT * FROM friends WHERE (user_second_id = ?) AND (type = ?);',
                [user_id, 'user12'],
                function(err, result){
                    if(err){
                        reject(err);
                    } else {
                        resolve(friendRequests = result);
                    }
                }
            )
        })
    }

    function getFriendsList(user_id){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT * FROM friends WHERE (user_first_id = ? OR user_second_id = ?) AND (type = ?);',
                [[user_id], [user_id], 'friends'],
                function(err, result){
                    if(err){
                        reject(err)
                    } else {
                        resolve(friendsList = result)
                    }
                }
            )
        })
    }

    function getUserNames(friendRequests){
        return new Promise ((resolve, reject) => {
                db.query(
                    'SELECT username FROM users WHERE user_id = ?;',
                    [friendRequests],
                    function(err, result){
                        if(err){
                            reject (err)
                        } else {
                            resolve(result[0].username)
                        }
                    }
                )
            })
    }

    function getWPM(user_id){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT wpm FROM users WHERE user_id = ?',
                [user_id],
                function(err, result){
                    if(err){
                        reject(err)
                    } else {
                        resolve(result[0].wpm)
                    }
                }
            )
        })
    }
    console.log(friendsList)
    count = requestedUsernames.length;
    friendListCount = friendsListNames.length
    res.render('friendslist', {requestedUsernames : requestedUsernames, count : count, friendsListNames : friendsListNames, friendListCount : friendListCount})
    console.log('pageloaded')
})

app.post('/sendfriendrequest', isAuth, (req, res) => {
    //Need to fine a way to get the current user's userID

    //1: norelation = not friends
    //2: friends = they are friends
    //3: user12 = user 1 sent user 2 a request
    //4: user21 = user 2 sent user 1 a request
    //5: user1!2 = user 1 has blocked user 2
    //6: user2!1 = user 2 has blocked user 1 
    let types = ['norelation', 'friends', 'user12', 'user21', 'user1!2', 'user2!1']

    //username for the currently logged in user. 
    let currentUsername = [req.session.user];
    
    //user input for the name of desired friend
    let friendRequestName = req.body.friendRequestName;

    //user ID numbers
    let currentUserId, friendRequestId;
    
    //Sending Friend Request
    db.query(
        'SELECT user_id FROM users WHERE username = ?;',
        [currentUsername],
        function (err, result) {
            if (err) throw err; 
            currentUserId = result[0].user_id;
            console.log("current user ID: " + currentUserId)
            db.query(
                'SELECT user_id FROM users WHERE username = ?;',
                [friendRequestName],
                function (err, result){
                    if (err) throw err;
                    if (result.length == 0){
                        console.log('user does not exist')
                    }
                    else if (result.length > 0) {
                        friendRequestId = result[0].user_id;
                        console.log("friend user ID: " + friendRequestId)
                        db.query(
                            'SELECT type FROM friends WHERE user_second_id = ? AND user_first_id = ? OR user_first_id = ? AND user_second_id = ?;', 
                            [[currentUserId], [friendRequestId], [currentUserId],[friendRequestId]],
                            function (err, result, field){
                                if (err) throw err;
                                if (result.length == 0){
                                    console.log("doesnt exist")
                                    //Procedure of adding new relationship data to the friends database table
                                    db.query(
                                        'INSERT INTO friends VALUES (?);',
                                        [[currentUserId, friendRequestId, 'user12']]
                                    )
                                }
                                else if (result.length > 0){
                                    let friendType = result[0].type;
                                    if (friendType == 'friends'){
                                        console.log('Already Friends')
                                    }
                                    else if(friendType == 'user12' || friendType == 'user21'){
                                        console.log('Pending Friend Request')
                                    }
                                    else if (friendType == 'norelation'){
                                        console.log('No longer friends')
                                    }
                                }
                            }
                        )
                    }
                }
            )
        }
    )
           
    //db.query(
        //'SELECT * FROM friends WHERE user_first_id OR user_second_id = ?', [22], function(err, result, fields){
            //if (err) throw err;
            //let x = [];
            //for (let i = 0; i < result.length; i++){
                //x[i] = result[i].type;
            //}
            //console.log(x);
        //}
    //)
    res.redirect('/friendslist')
})

app.post('/friendslist/acceptFriendRequest', async (req,res) => {
    const username = [req.body.username, req.session.user];
    console.log(username);
    let user_id = [];
    for (let i = 0; i < username.length; i++){
        user_id[i] = await getUserId(username[i]);
    }
    await update(user_id);

    function getUserId(username){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT user_id FROM users WHERE username = ?',
                [username],
                function(err, result){
                    if(err){
                        reject(err);
                    } else {
                        resolve(result[0].user_id)
                    }
                }
            )
        })
    };

    function update(user_id){
        return new Promise ((resolve, reject) => {
            db.query(
                'UPDATE friends SET type = ? WHERE (user_first_id = ? AND user_second_id = ?)',
                ['friends', user_id[0], user_id[1]],
                function (err) {
                    if (err){
                        reject(err);
                    } else {
                        console.log('updated')
                        resolve();
                    }
                }
            )
        })
    }
    console.log(user_id[0], user_id[1])
    res.redirect('/friendslist')
    console.log('refreshing page')
})

app.post('/friendslist/deleteFriend', async (req, res) => {
    const username = [req.body.username, req.session.user];
    console.log(username);
    let user_id = [];

    for (let i = 0; i < username.length; i++){
        user_id[i] = await getUserId(username[i]);
    }
    await update(user_id);


    function getUserId(username){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT user_id FROM users WHERE username = ?',
                [username],
                function(err, result){
                    if(err){
                        reject(err);
                    } else {
                        resolve(result[0].user_id)
                    }
                }
            )
        })
    };
    function update(user_id){
        return new Promise ((resolve, reject) => {
            db.query(
                'DELETE FROM friends WHERE (user_first_id = ? AND user_second_id = ?) OR (user_first_id = ? AND user_second_id = ?)',
                [user_id[0], user_id[1], user_id[1], user_id[0]],
                function (err) {
                    if (err){
                        reject(err);
                    } else {
                        console.log('updated')
                        resolve();
                    }
                }
            )
        })
    }

})

app.post('/friendslist/rejectFriendRequest', async (req,res) => {
    const username = [req.body.username, req.session.user];
    console.log(username);
    let user_id = [];
    for (let i = 0; i < username.length; i++){
        user_id[i] = await getUserId(username[i]);
    }
    await deleteRequest(user_id);

    function getUserId(username){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT user_id FROM users WHERE username = ?',
                [username],
                function(err, result){
                    if(err){
                        reject(err);
                    } else {
                        resolve(result[0].user_id)
                    }
                }
            )
        })
    };

    function deleteRequest(user_id){
        return new Promise ((resolve, reject) => {
            db.query(
                'DELETE FROM friends WHERE (user_first_id = ? AND user_second_id = ?)',
                [user_id[0], user_id[1]],
                function(err, result){
                    if(err){
                        reject(err)
                    } else {
                        console.log('deleted')
                        resolve();
                    }
                }
            )
        })
    }
    console.log(user_id[0], user_id[1])
    res.redirect('/friendslist')
    console.log('refreshing page')
})

app.post('/dailyTrial', async (req, res) => {
    let username = req.session.user;
    let user_id = await getUserId(username);
    await updateDailyTrial(user_id);
    console.log(username)

    function getUserId(username){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT user_id FROM users WHERE username = ?',
                [username],
                function(err, result){
                    if(err){
                        reject(err);
                    } else {
                        resolve(result[0].user_id)
                    }
                }
            )
        })
    };

    function updateDailyTrial(user_id){
        return new Promise((resolve, reject) => {
            db.query(
                'UPDATE users SET DailyTrial = 1 WHERE user_id = ?',
                [user_id],
                function(err){
                    if(err){
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            )
        })
    }
    console.log(user_id)
})

app.post('/updateWPM', async (req, res) => {
    let username = req.session.user;
    let right = req.body.right;
    console.log(right)

    let user_id = await getUserId(username);

    await updateWPM(user_id, right);
    console.log(username, right)

    function getUserId(username){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT user_id FROM users WHERE username = ?',
                [username],
                function(err, result){
                    if(err){
                        reject(err);
                    } else {
                        resolve(result[0].user_id)
                    }
                }
            )
        })
    };

    function updateWPM(user_id, right){
        return new Promise ((resolve, reject) => {
            db.query(
                'UPDATE users SET wpm = ? WHERE user_id = ?',
                [right, user_id],
                function(err){
                    if (err) {
                        reject(err)
                    } else {
                        console.log('updated wpm in database')
                        resolve();
                    }
                }
            )
        })
    }
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
const { devNull } = require('os');
const { callbackify } = require('util');
const e = require('express');
const { rejects } = require('assert');
const { request } = require('express');
const { waitForDebugger } = require('inspector');
app.use('/users', userRouter)

const port = process.env.port || 3000;
app.listen(port, () => {
    console.log(`server is running on localhost:${port}`);
})

