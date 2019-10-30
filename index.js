const express     = require('express')
const jwt         = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const exjwt       = require('express-jwt');
// const flatten     = require('flat')   // heroku server crash but not on localhost

// const bodyParser = require('body-parser') // heroku doesn't like bodyparser ...

const mongo_uri    = "mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority"
const stopfalls_db = "stopfalls_db";
const jwt_key      = "secret_jwt_key";

// test that the mongodb is connecting correctly
const testdb = require('./testdb.js');

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



// raw activity:
// http://localhost:5000/visual_activity?qrcode=ZwWR4diEsL7lrNtohYGs

app.get('/visual_activity', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving activity data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

  response_string = "timestamp,accel-X,accel-Y,accel-Z\n";

  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      // same query, just different collection
      var response_string_steps = ""
      dbo.collection("stopfalls_activity").find(myqry).forEach(function(doc) {
          response_string += doc['timestamp'] + "," + doc['accelX'] + "," + doc['accelY'] + "," + doc['accelZ'] + "\n"
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error
          console.log("finished processing ... response_string = [" + response_string + "]");
          response.render('visual', { title: "StopFalls Raw Activity Data", title2: 'Old person with qrcode [' + qrcode + "]", message: response_string, qrcode: qrcode, x_axis: "time", y_axis: "Average G-force" })
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });

      // done or error
      // console.log("finished processing ... response_string = [" + response_string + "]");
      // response.render('visual', { title: "StopFalls Activity Data", title2: 'Old person with qrcode [' + qrcode + "]", message: response_string, qrcode: qrcode })

  });

})

app.get('/get_accel_data', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving activity data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

  response_string = "timestamp,accel-X,accel-Y,accel-Z\n";

  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      // same query, just different collection
      dbo.collection("stopfalls_activity").find(myqry).forEach(function(doc) {
          response_string += doc['timestamp'] + "," + doc['accelX'] + "," + doc['accelY'] + "," + doc['accelZ'] + "\n"
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error
          console.log("finished processing ... response_string = [" + response_string + "]");
          response.send(response_string)
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });

      // done or error
      // console.log("finished processing ... response_string = [" + response_string + "]");
      // response.render('visual', { title: "StopFalls Activity Data", title2: 'Old person with qrcode [' + qrcode + "]", message: response_string, qrcode: qrcode })

  });

})

app.get('/get_step_data', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving step data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

  var response_string_steps = "";

  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      // same query, just different collection
      dbo.collection("stopfalls_steps").find(myqry).forEach(function(doc) {
          response_string_steps += doc['timestamp'] + "," + doc['steps'] + "\n"
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error
          console.log("finished processing ... response_string_steps = [" + response_string_steps + "]");
          response_string_steps = response_string_steps.replace("undefined", "1");
          response.send(response_string_steps)
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });

      // done or error
      // console.log("finished processing ... response_string = [" + response_string + "]");
      // response.render('visual', { title: "StopFalls Activity Data", title2: 'Old person with qrcode [' + qrcode + "]", message: response_string, qrcode: qrcode })

  });

})


app.get('/get_fall_data', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving activity data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

  response_string_falls = "";

  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      // same query, just different collection
      dbo.collection("stopfalls_falls").find(myqry).forEach(function(doc) {
          response_string_falls += "[fall timestamp=" + doc['timestamp'] + ", realFall=" + doc['realFall'] + ", x=" + doc['accelX'] + ", y=" + doc['accelY'] + ", z=" + doc['accelZ'] + "]" + "\n"
          
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error

          console.log("response_string_falls = [" + response_string_falls + "]");


          response.send(response_string_falls)
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });
  });
})


app.get('/get_tug_data', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving activity data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

  response_string_tugs = "timestamp,tug_duration\n";

  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      // same query, just different collection
      dbo.collection("stopfalls_tugs").find(myqry).forEach(function(doc) {
          response_string_tugs += doc['timestamp'] + "," + doc['tug_time'] + "\n"
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error
          console.log("finished processing ... response_string_steps = [" + response_string_tugs + "]");
          response.send(response_string_tugs)
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });

  });
})





app.get('/visual_steps', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving step data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

  var response_string_steps = "";

  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      // same query, just different collection
      dbo.collection("stopfalls_steps").find(myqry).forEach(function(doc) {
          response_string_steps += doc['timestamp'] + "," + doc['steps'] + "\n"
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error
          console.log("finished processing ... response_string_steps = [" + response_string_steps + "]");
          response_string_steps = response_string_steps.replace("undefined", "1");
          response.render('steps', { title: "StopFalls Step Data", title2: 'Old person with qrcode [' + qrcode + "]", message: response_string_steps, qrcode: qrcode, x_axis: "time", y_axis: "number of steps" })
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });

      // done or error
      // console.log("finished processing ... response_string = [" + response_string + "]");
      // response.render('visual', { title: "StopFalls Activity Data", title2: 'Old person with qrcode [' + qrcode + "]", message: response_string, qrcode: qrcode })

  });

})


app.get('/visual_falls', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving activity data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

  response_string_falls = "";

  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      // same query, just different collection
      dbo.collection("stopfalls_falls").find(myqry).forEach(function(doc) {
          response_string_falls += "[fall timestamp=" + doc['timestamp'] + ", realFall=" + doc['realFall'] + ", x=" + doc['accelX'] + ", y=" + doc['accelY'] + ", z=" + doc['accelZ'] + "]" + "\n"
          
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error
          console.log("response_string_falls= [" + response_string_falls + "]")
          let kittystring = JSON.stringify(response_string_falls);
          let csv_parsed = "x,y,z\n";
          if (response_string_falls != "") {
               console.log("kittystring=[" + kittystring+ "]");
  
              kittystring.split("realFall=false").length

              num_false_falls = kittystring.split("realFall=false").length - 1;
              num_true_falls  = kittystring.split("realFall=true").length - 1;

               var subtitle = 'False-alarm falls: [' + parseInt(num_false_falls) + "]\n" +
                              'Genuine falls: ['  + parseInt(num_true_falls) + "]";
          } else {
              var subtitle = "No falls recorded";
          }

          console.log("response_string_falls = [" + response_string_falls + "]");
          console.log("csv_parsed = [" + csv_parsed + "]");

          response.render('falls', { title: "StopFalls Fall Data", title2: subtitle, message: response_string_falls, qrcode: qrcode, x_axis: "time", y_axis: "average G-force"})
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });

  });
})

app.get('/visual_tug', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving activity data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

  response_string_tugs = "timestamp,tug_duration\n";

  MongoClient.connect(mongo_uri, function(err, db) {
      console.log("POST: MongoDB connected");
      if (err) throw err;
      var dbo = db.db(stopfalls_db);
      // same query, just different collection
      dbo.collection("stopfalls_tugs").find(myqry).forEach(function(doc) {
          response_string_tugs += doc['timestamp'] + "," + doc['tug_time'] + "\n"
          console.log(doc);
        }, function(err) {
          if (err) {
            console.log(err);
          }
          // done or error
          console.log("finished processing ... response_string_steps = [" + response_string_tugs + "]");
          response.render('visual', { title: "StopFalls TUG Data", title2: 'Old person with qrcode [' + qrcode + "]", message: response_string_tugs, qrcode: qrcode, x_axis: "time", y_axis: "time taken to complete TUG"})
          // response.send("response_string = [" + response_string + "]");
          // response.end(); // cause error 'cannot set headers after being sent'
        });

  });
})


app.get('/data_activity', function(request, response) {

  var qrcode = request.query.qrcode;

  console.log("retrieving activity data for qrcode [" + qrcode + "]");

  myqry = { "qrcode": qrcode};

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
            response.send(response_string);
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
app.post('/activity_falls', function(request, response){
  console.log("request.body:");
  console.log(request.body);

    // prints lots of data
    // console.log("request:");
    // console.log(request)

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    // var myJSON = { "name": "Chris", "age": "38" };
    response.send("fall data received");

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        var myobj = request.body;
        dbo.collection("stopfalls_falls").insertOne(myobj, function(err, res) {
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
app.post('/activity_step', function(request, response){
  console.log("request.body:");
  console.log(request.body);

    // prints lots of data
    // console.log("request:");
    // console.log(request)

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    // var myJSON = { "name": "Chris", "age": "38" };
    response.send("step data received");

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
        var myobj = request.body;
        dbo.collection("stopfalls_steps").insertOne(myobj, function(err, res) {
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
app.post('/tugs', function(request, response){
  console.log("request.body:");
  console.log(request.body);

    // prints lots of data
    // console.log("request:");
    // console.log(request)

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    // var myJSON = { "name": "Chris", "age": "38" };
    response.send("tug data received");

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
        var myobj = request.body;
        dbo.collection("stopfalls_tugs").insertOne(myobj, function(err, res) {
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
        console.log("request.body.phone: [" + request.body.phone + "] password [" + request.body.password + "]");

        var dbo = db.db(stopfalls_db);
        // 2. retrieve what the database stores about 'username' and 'password'
        dbo.collection('stopfalls_users').findOne({'phone':request.body.phone, 'password':request.body.password})
             .then(function(doc) {
                    if(!doc) {
                       var myJSON = {"description": "login failed"};
                       response.send(myJSON);
                    } else {
                        console.log("users doc:", doc);

                        dbo.collection("stopfalls_olds").find({'phone':request.body.phone}).toArray(function(err, result) {
                          if (err) throw err;
                          console.log(result);

                          // make an empty object
                          var myObject = {};
                          // flatten json from three layers to two
                          for(var i = 0; i < result.length; i++) {
                              var obj = result[i];
                              myObject[i] = obj.oldname + "_" + obj.qrcode;
                              console.log(obj.oldname + "_" + obj.qrcode);
                          }
                          console.log("myObject: ", myObject);

                          // massive issue with 'jsonArray' needing to be send and received from Volley
                          response.send(myObject);
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

// checks if a username already exists in the database. 
function doesUsernameExist(dbo, phone) {
            // check the username is not already in use

}


app.post('/signup', function(request, response){

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        // var myobj = { name: "Company Inc", address: "Highway 37" };

        console.log("request.body:",request.body);
        console.log("phone: ",      request.body.phone);
        console.log("password: ",   request.body.password);
        console.log("client ip: ",  ip)
        
        var failureJSON = {"description": "signup failed: phone number is already taken"};
        var successJSON = {"description": "signup successful for new user [" + request.body.phone + "]"};

        dbo.collection('stopfalls_users').findOne({'phone':request.body.phone})
         .then(function(doc) {
                // if the document is empty, that doesn't mean there is an error, if no respose is intended
                if (!doc) {
                   console.log("checkUsernameExists.failure: document is empty");
                //    response.send(failureJSON);
                } 
                else {
                      console.log("checkUsernameExists.users doc:", doc);
                      console.log("checkUsernameExists.users doc[phone]:", doc['phone']);

                      if (doc['phone'] == request.body.phone) {
                        console.log("checkUsernameExists.failure: phone already taken");
                        response.send(failureJSON);
                        response.end();                    
                      } 
                    }
                console.log("checkUsernameExists.success: phone is free");
                var myobj = request.body;
                dbo.collection("stopfalls_users").insertOne(myobj, function(err, res) {
                    if (err) throw err;
                    console.log("POST: 1 document inserted");
                    db.close();
                });
                response.send(successJSON);
                response.end();
   
              });

    });
    // will not reach here
});


// Access the parse results as request.body
// (1) registration api : name, dob, user type, address, phone no, email id, 
app.post('/update_username', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
        
        console.log("phone: ",     request.body.phone);
        console.log("password: ",  request.body.password);

        // define the records to update (though you are using 'updateOne')
        var myquery = { "password" : request.body.password};

        var myobj = request.body;
        dbo.collection("stopfalls_users").update(myquery, myobj, function(err, res) {
            if (err) throw err;
            console.log("POST: updated");
            db.close();
        });
    });
    // 1. submit the username and password into the database. 

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    var myJSON = { "response code": "200", 
                   "description": "user details updated for user [" + request.body.phone + "]",
                 };
    response.send(myJSON);
    response.end();
    // will not reach here
});


// Access the parse results as request.body
// (1) registration api : name, dob, user type, address, phone no, email id, 
app.post('/update_password', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
        // var myobj = { name: "Company Inc", address: "Highway 37" };
        
        console.log("phone: ",     request.body.phone);
        console.log("password: ",  request.body.password);

        // define the records to update (though you are using 'updateOne')
        var myquery = { "phone" : request.body.phone};

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
                   "description": "user details updated for user [" + request.body.phone + "]",
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

        console.log("phone: ",    request.body.phone);
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
                   "description": "old person [" + request.body.oldname + "] added for carer [" + request.body.phone + "]", 
                 };
    response.send(myJSON);
    response.end();
    // will not reach here
});


app.post('/remove_oldperson', function(request, response){
    console.log("request.body:");
    console.log(request.body);
    
    var myquery = {'oldname':request.body.oldname, 'phone':request.body.phone};

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);
                                                  // do not put brackets around 'myquery' here:
        dbo.collection("stopfalls_olds").deleteMany(myquery, function(err, res) {
            // if (err) throw err;
            response.send(res);
            db.close();
        });
    });
    // will not reach here
});


// curl -i -X POST -H "Content-Type: application/json" -d '{"oldname":"dfluffy", "phone":"+61402671778"}' localhost:5000/remove_oldperson

// retrieves record:
// {phone: "+61402671778", oldname: "dluffy"}

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


app.post('/clear_steps', function(request, response){
    console.log("request.body:");
    console.log(request.body);

    MongoClient.connect(mongo_uri, function(err, db) {
        console.log("POST: MongoDB connected");
        if (err) throw err;
        var dbo = db.db(stopfalls_db);

        var myobj = request.body;
        dbo.collection("stopfalls_steps").remove({}, function(err, res) {
            if (err) throw err;
            db.close();
        });
    });
    // 1. submit the username and password into the database. 

    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log("client ip: " + ip)

    var myJSON = { "response code": "200", 
                   "description": "all step data removed", 
                 };
    response.send(myJSON);
    response.end();
    // will not reach here
});



// replace the uri string with your connection string.

//           mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority


// do not comment out! will break all API methods!
const MongoClient = require('mongodb').MongoClient;


// MongoClient.connect(mongo_uri, function(err, client) {
//    if(err) {
//         console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
//    }
//    console.log('MongoDB Connected...');
//    const collection = client.db("stopfalls_db").collection("stopfalls_collection");

//    // perform actions on the collection object
   

//    client.close();
// });

// const MongoClient = require('mongodb').MongoClient;

// /* *********** Create ethereum accounts here ************** */
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



