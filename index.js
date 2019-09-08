const express     = require('express')
const jwt         = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const exjwt       = require('express-jwt');

// const bodyParser = require('body-parser') // heroku doesn't like bodyparser ...

const mongo_uri    = "mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority"
const stopfalls_db = "stopfalls_db";
const jwt_key      = "secret_jwt_key";

const jwtMW = exjwt({
    secret: 'secret_jwt_key'
});

var app = express()
app.set('port', (process.env.PORT || 5000))

// replacement for bodyparser
app.use(express.json());
app.use(bearerToken());
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  
  response.send('StopFalls Server. Your authentication token is: ' + request.token);

  // obviously it is bad practice to need to have a block of code at the beginning
  // of each server path to validate the JWT - there is functionality for this, no
  // need to write your own. link: https://hptechblogs.com/using-json-web-token-for-authentication/

  // verify a token symmetric - synchronous
  var decoded = jwt.verify(request.token, jwt_key);
  console.log("decoded:", decoded); // bar

  response.end();
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
        console.log("request.body.username: [" + request.body.username + "]")

        var dbo = db.db(stopfalls_db);
        // 2. retrieve what the database stores about 'username' and 'password'
        dbo.collection('stopfalls_users').findOne({'username':request.body.username})
             .then(function(doc) {
                    if(!doc) {
                       throw new Error('No record found.....');
                       var myJSON = {"description": "login failed","jwt": "error"};
                       response.send(myJSON);
                    } else {
                        console.log("doc:", doc);
                        // 3. if they match, sign and send back a JWT token for future requests
                        jwt.sign({ username: 'mittens' }, jwt_key, function(err, token) {
                                
                              if (err) {
                                console.log(err);
                              }

                              mytoken = token;

                              console.log("token:", token);
                              var myJSON = {"description": "login successful","jwt": token};
                              response.send(myJSON);
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
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
        
        console.log("username: ",     request.body.username);
        console.log("d-o-b: ",        request.body.dob);
        console.log("user type: ",    request.body.user_type);
        console.log("address: ",      request.body.address);
        console.log("phone number: ", request.body.phone);
        console.log("email id: ",     request.body.email);
        console.log("password: ",     request.body.password);

        var myobj = request.body;
        dbo.collection("stopfalls_users").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("POST: 1 document inserted");
            db.close();
        });
    });
    // 1. submit the username and password into the database. 

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    var myJSON = { "response code": "200", 
                   "description": "signup successful for new user [" + request.body.username + "]",
                 };
    response.send(myJSON);
    response.end();
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
        console.log("d-o-b: ",        request.body.dob);
        console.log("user type: ",    request.body.user_type);
        console.log("address: ",      request.body.address);
        console.log("phone number: ", request.body.phone);
        console.log("email id: ",     request.body.email);
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

        console.log("username: ",     request.body.username);
        console.log("password: ",     request.body.password);
        console.log("email: ",        request.body.email);
        console.log("phone number: ", request.body.phone);

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



const MongoClient = require('mongodb').MongoClient;

// replace the uri string with your connection string.

//           mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority
MongoClient.connect(mongo_uri, function(err, client) {
   if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('MongoDB Connected...');
   const collection = client.db("stopfalls_db").collection("stopfalls_collection");

   // perform actions on the collection object
   

   client.close();
});



/* *********** Create ethereum accounts here ************** */
var Web3 = require("web3");

var web3 = new Web3('http://localhost:8545'); // your geth
var account = web3.eth.accounts.create();

console.log(account)




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



