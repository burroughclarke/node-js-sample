var express    = require('express')
// var bodyParser = require('body-parser')

var app = express()

const mongo_uri = "mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority"

app.set('port', (process.env.PORT || 5000))

// heroku doesn't like bodyparser ...

// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }))

// replacement for bodyparser
app.use(express.json());

// parse application/json
// app.use(bodyParser.json())
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
        var dbo = db.db("stopfalls_db");
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

// TODOs
// – send android data to web app as JSON data
// - send web app data to mongodb as JSON data


// why undefined:
// - not including content-type header



