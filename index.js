var express    = require('express')
var bodyParser = require('body-parser')

var app = express()

app.set('port', (process.env.PORT || 5000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
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

    // connection is taking far too long to close
    response.end();
});

const MongoClient = require('mongodb').MongoClient;

// replace the uri string with your connection string.

//           mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority
const uri = "mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority"
MongoClient.connect(uri, function(err, client) {
   if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('MongoDB Connected...');
   const collection = client.db("test").collection("devices");
   // perform actions on the collection object
   
   client.close();
});




// ############################

// send data to server:
// curl --data "param1=value1&param2=value2" https://stopfalls.herokuapp.com/

// TODOs
// – send android data to web app as JSON data
// - send web app data to mongodb as JSON data


// why undefined:
// - not including content-type header



