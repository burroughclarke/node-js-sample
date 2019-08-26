var express = require('express')
var app = express()

app.set('port', (process.env.PORT || 5000))
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

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    response.send("data received.");

    // connection is taking far too long to close
    response.end();
});

const MongoClient = require('mongodb').MongoClient;

// replace the uri string with your connection string.
const uri = "mongodb+srv://burrough:mittens@cluster0-neprh.mongodb.net/test?retryWrites=true&w=majority"
MongoClient.connect(uri, function(err, client) {
   if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('MongoDB Connected...');
   const collection = client.db("test").collection("devices");
   // perform actions on the collection object
   
   client.close();
});

// send data to server:
// curl --data "param1=value1&param2=value2" https://stopfalls.herokuapp.com/

// TODOs
// – send android data to web app as JSON data
// - send web app data to mongodb as JSON data



