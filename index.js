const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var fs = require('fs');
const app = express();
var http = require('http');
var https = require('https');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
const resolvers = require('./resolvers');
const { signUp } = require('./setup');
const Db = require('./db'); 
app.use(cors());
const offLine = require('./offline');
const typeDefs = require('./schema');
const Utils = require('./utils');
const access = require('./login');
//const twitter = require('./twitter');


var mysql = require('mysql');
var con = mysql.createConnection({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_DATABASE
});





app.use('/live/:target', cors(), async function (req, res, next) {
const exits = true;
if (exits) {  
let data1 = 'stackabuse.com';
let buff1 = Buffer.from(data1);
let base64data = buff1.toString('base64');


let data = 'c3RhY2thYnVzZS5jb20=';
let buff = Buffer.from(data, 'base64');
let text = buff.toString('ascii');

} 
else { res.send([{'content':"Invalid Content ID"}]); } });


app.use('/visitorupload', cors());
app.use('/public', cors(), express.static('public'));
app.get('/assets/:target', cors(), (req, res) => {
const path = './assets/'+req.params.target;
if (fs.existsSync(path)) { res.sendFile(path, { root: __dirname });} 
else { res.send([{'content':"Invalid Content ID"}]); }
});
app.get('/vres/:target', cors(), (req, res) => {
const path = './upload/'+req.params.target;
if (fs.existsSync(path)) { res.sendFile(path, { root: __dirname });} 
else { res.send([{'content':"Invalid Content ID"}]); }
});

app.use('/offline', cors(), async function (req, res, next){ access.accessControl(req, res, next); });
app.use('/offline', cors(), async function (req, res, next){ offLine.OfflineMsg(req, res, next); });
app.use('/visitorupload', cors(), async function (req, res, next){ offLine.visitorUpload(req, res, next); });
app.use('/upload', cors(), async function (req, res, next){ offLine.Upload(req, res, next); });
app.use('/register', function (req, res, next) { signUp(req, res, next);})
const server = new ApolloServer({
  typeDefs,
  resolvers, 
  context: ({ req, res }) => {
    return {
      req, 
      res
    }
  },
  cors: false,
  playground: false
});
server.applyMiddleware({ app, path: '/graphql'});
app.use('/graphql', (req, res) => {
res.setHeader('Content-Type', 'application/json');
res.end();

});

http.createServer(app).listen(process.env.PORT, function() { console.log('https listening on 433*:'); }); // http server