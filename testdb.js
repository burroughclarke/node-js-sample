const mongo_uri    = "mongodb+srv://burrough:mittens@stopfalls-neprh.mongodb.net/test?retryWrites=true&w=majority"
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(mongo_uri, function(err, client) {
   if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('MongoDB Connected...');
   const collection = client.db("stopfalls_db").collection("stopfalls_collection");

   // perform actions on the collection object
   

   client.close();
});