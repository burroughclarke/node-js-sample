const express = require('express')
const jwt     = require('jsonwebtoken');
// const bodyParser = require('body-parser') // heroku doesn't like bodyparser ...

const mongo_uri = "mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority"
const stopfalls_db = "stopfalls_db"

var app = express()
app.set('port', (process.env.PORT || 5000))

// replacement for bodyparser
app.use(express.json());

app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('StopFalls Server');
  response.end();
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

// Access the parse results as request.body
app.post('/', function(request, response){
	console.log("request.body:");
    console.log(request.body);

    // prints lots of data
    // console.log("request:");
    // console.log(request)

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    var myJSON = { "name": "Chris", "age": "38" };
    response.send(myJSON);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
        var myobj = request.body;
        dbo.collection("stopfalls_collection").insertOne(myobj, function(err, res) {
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
                        jwt.sign({ username: 'mittens' }, "secret private key", function(err, token) {
                                
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
app.post('/signup', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
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

    var myJSON = { "response code": "200", "description": "signup successful" };
    response.send(myJSON);

    // connection is taking far too long to close
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

// TODOs
// – send android data to web app as JSON data
// - send web app data to mongodb as JSON data


// why undefined:
// - not including content-type header



