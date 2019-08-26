var express = require('express')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('StopFalls Server')
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
});
