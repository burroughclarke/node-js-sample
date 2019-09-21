const express     = require('express')
const jwt         = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const exjwt       = require('express-jwt');

// const bodyParser = require('body-parser') // heroku doesn't like bodyparser ...

const mongo_uri    = "mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority"
const stopfalls_db = "stopfalls_db";
const jwt_key      = "secret_jwt_key";

// const jwtMW = exjwt({
//     secret: 'secret_jwt_key'
// });


var app = express()

app.set('view engine', 'pug')
app.set('port', (process.env.PORT || 5000))

// replacement for bodyparser
app.use(express.json());
app.use(bearerToken());
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  
  response.send('StopFalls Server. See <strong>https://github.cs.adelaide.edu.au/mobile-wireless-systems-2019-s2/stopfalls-beta/wiki/Server-API-%E2%80%93-21-9-19 </strong> for API');

  // obviously it is bad practice to need to have a block of code at the beginning
  // of each server path to validate the JWT - there is functionality for this, no
  // need to write your own. link: https://hptechblogs.com/using-json-web-token-for-authentication/

  // verify a token symmetric - synchronous
  var decoded = jwt.verify(request.token, jwt_key);
  console.log("decoded:", decoded); // bar

  response.end();
})

app.get('/home', function(request, response) {
  response.render('visual', { title: 'Hey', message: 'Hello there!' })
})

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + '-' + month + '-' + year + '-' + hour + '-' + min + '-' + sec ;
  return time;
}

app.get('/visual', function(request, response) {

  var username = request.query.username;
  var phone    = request.query.phone;

  console.log("retrieving activity data for username   [" + username + "]");
  console.log("retrieving activity data for old person [" + phone    + "]");

  myqry = { "phone": phone};
  response_string = "timestamp,accel-X,accel-Y,accel-Z\n";
  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      dbo.collection("stopfalls_activity").find(myqry).forEach(function(doc) {
          response_string += doc['timestamp'] + "," + doc['accelX'] + "," + doc['accelY'] + "," + doc['accelZ'] + "\n"
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error
          console.log("finished processing ... response_string = [" + response_string + "]");
          response.render('visual', { title: 'Activity Data for user [' + username + "] for old person [" + phone + "]", message: response_string, phone: phone })
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });
  });

})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

// Access the parse results as request.body
app.post('/activity_data', function(request, response){
	console.log("request.body:");
  console.log(request.body);

    // prints lots of data
    // console.log("request:");
    // console.log(request)

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    // var myJSON = { "name": "Chris", "age": "38" };
    response.send("accelerometer data received");

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
        var myobj = request.body;
        dbo.collection("stopfalls_activity").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("POST: 1 document inserted");
            db.close();
        });
    });

    // connection is taking far too long to close
    response.end();
    // will not reach here
});

// Access the parse results as request.body
app.post('/login', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    var mytoken = "error";

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    // 1. retrieve the 'username' and 'password' request body parameter
    MongoClient.connect(mongo_uri, function(err, db) {
        if (err) throw err;
        // var dbo = db.db(stopfalls_db);
        // dbo.collection("stopfalls_users").findOne({'password':"miow"}, function(err, result) {
        //   if (err) throw err;
        //   console.log("username matching password: " + result.name);
        //   db.close();
        // });
        console.log("request.body.username: [" + request.body.username + "] password [" + request.body.password + "]");

        var dbo = db.db(stopfalls_db);
        // 2. retrieve what the database stores about 'username' and 'password'
        dbo.collection('stopfalls_users').findOne({'username':request.body.username, 'password':request.body.password})
             .then(function(doc) {
                    if(!doc) {
                       var myJSON = {"description": "login failed"};
                       response.send(myJSON);
                    } else {
                        console.log("users doc:", doc);

                        dbo.collection("stopfalls_olds").find({'username':request.body.username}).toArray(function(err, result) {
                          if (err) throw err;
                          console.log(result);
                          response.send(result);
                          db.close();
                        });
                      
                    }
              });
    });

          // can't put this here, as it will trigger before the 'successful' one:
          // you can only have one 'response.send' in a function, as it will execute first
    // var myFailJson= {"description": "login failed","jwt": mytoken};
    // response.send(myFailJson);

    // // connection is taking far too long to close
    // response.end();
    // will not reach here
});

// Access the parse results as request.body
// (1) registration api : name, dob, user type, address, phone no, email id, 
app.post('/signup', function(request, response){

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        // var myobj = { name: "Company Inc", address: "Highway 37" };

        console.log("request.body:", request.body);
        console.log("username: ",     request.body.username);
        console.log("password: ",     request.body.password);
        console.log("client ip: ",    ip)
        
        var failureJSON = {"description": "login failed"};
        var successJSON = {"description": "signup successful for new user [" + request.body.username + "]"};

                  // TODO: filter for duplicate registrations

        // check the username is not already in use
        // dbo.collection('stopfalls_users').findOne({'username':request.body.username})
        //  .then(function(doc) {
        //         if(!doc) {
        //             if (err) throw err;
        //            console.log("failure: document error");
        //            response.send(failureJSON);
        //         } else {
        //             console.log("users doc:", doc);
        //             console.log("users doc[username]:", doc['username']);

        //             if (doc['username'] == request.body.username) {
        //                 console.log("failure: username already taken");
        //                 response.send(failureJSON);
        //                 response.end();
        //             }
        //             else {
                        var myobj = request.body;
                        dbo.collection("stopfalls_users").insertOne(myobj, function(err, res) {
                            if (err) throw err;
                            console.log("POST: 1 document inserted");
                            db.close();
                        });
                            response.send(successJSON);
                            response.end();
    //                 }
    //             }
    //       });
    });
    // will not reach here
});


// Access the parse results as request.body
// (1) registration api : name, dob, user type, address, phone no, email id, 
app.post('/update_user', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
        
        console.log("username: ",     request.body.username);
        console.log("password: ",     request.body.password);

        // define the records to update (though you are using 'updateOne')
        var myquery = { "username" : request.body.username};

        var myobj = request.body;
        dbo.collection("stopfalls_users").update(myquery, myobj, function(err, res) {
            if (err) throw err;
            console.log("POST: 1 document updated");
            db.close();
        });
    });
    // 1. submit the username and password into the database. 

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    var myJSON = { "response code": "200", 
                   "description": "user details updated for user [" + request.body.username + "]",
                 };
    response.send(myJSON);
    response.end();
    // will not reach here
});

app.post('/add_older', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };

        console.log("username: ", request.body.username);
        console.log("qrcode: ",   request.body.qrcode);

        var myobj = request.body;
        dbo.collection("stopfalls_olds").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("POST: 1 document inserted");
            db.close();
        });
    });
    // 1. submit the username and password into the database. 

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    var myJSON = { "response code": "200", 
                   "description": "old person added for carer [" + request.body.username + "]", 
                 };
    response.send(myJSON);
    response.end();
    // will not reach here
});


app.post('/clear_users', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);

        var myobj = request.body;
        dbo.collection("stopfalls_users").remove({}, function(err, res) {
            if (err) throw err;
            db.close();
        });
    });
    // 1. submit the username and password into the database. 

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    var myJSON = { "response code": "200", 
                   "description": "all user records removed", 
                 };
    response.send(myJSON);
    response.end();
    // will not reach here
});

app.post('/clear_activity', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);

        var myobj = request.body;
        dbo.collection("stopfalls_activity").remove({}, function(err, res) {
            if (err) throw err;
            db.close();
        });
    });
    // 1. submit the username and password into the database. 

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    var myJSON = { "response code": "200", 
                   "description": "all activity data removed", 
                 };
    response.send(myJSON);
    response.end();
    // will not reach here
});

// test that the mongodb is connecting correctly
const testdb = require('./testdb.js');

// replace the uri string with your connection string.

//           mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority
// const MongoClient = require('mongodb').MongoClient;
// MongoClient.connect(mongo_uri, function(err, client) {
//    if(err) {
//         console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
//    }
//    console.log('MongoDB Connected...');
//    const collection = client.db("stopfalls_db").collection("stopfalls_collection");

//    // perform actions on the collection object
   

//    client.close();
// });

const MongoClient = require('mongodb').MongoClient;

/* *********** Create ethereum accounts here ************** */
// var Web3 = require("web3");
// var web3 = new Web3('http://localhost:8545'); // your geth
// var account = web3.eth.accounts.create();
// console.log(account)




// ############################

// nodeJS-mongodb authorisation using JWTs:
// https://medium.com/quick-code/handling-authentication-and-authorization-with-node-7f9548fedde8

// mongodb has sample data in it: you should be able to pull data using 'get' first. 

// send data to server:
// curl -i -X POST -H "Content-Type: application/json" -d '{"userID":"1","time":"1567305876477","xAccel":"1.12345","yAccel":"2.12345","zAccel":"3.12345"}' http://localhost:5000

// login attempt (if successful, returns JWT):
// curl -i -X POST -H "Content-Type: application/json" -d '{"username":"mittens","password":"miow"}' http://localhost:5000/login

// signup
// curl -i -X POST -H "Content-Type: application/json" -d '{"username":"mittens","password":"miow"}' http://localhost:5000/signup

// send cookie through server
// curl http://localhost:5000 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im1pdHRlbnMiLCJpYXQiOjE1NjczMTY2NjF9.F8e1AqQyEBWCeCREk_g0xUrALXDzKJtKjXja_mYhDIk"


// TODOs
// – send android data to web app as JSON data
// - send web app data to mongodb as JSON data


// why undefined:
// - not including content-type header



