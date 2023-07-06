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


async function GetTitle(sql){ 
let agentname = await Db.query(sql);  
if(agentname.length > 0){ return agentname[0].title; }
return null;
}


app.use('/resources/:target', cors(), async function (req, res, next) {
const path = './upload/'+req.params.target;
if (fs.existsSync(path)) {  
let origName = await GetTitle("SELECT originalname AS title FROM filerepos WHERE status = 1 AND newname = " + con.escape(req.params.target)); 
res.download(path, ((typeof origName !== 'undefined' && origName !== null) ? origName : req.params.target)); } 
else { res.send([{'content':"Invalid Content ID"}]); } });

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

app.use('/verify/:target', cors(), async function (req, res, next) {
let verifyStatus = 1;
let domainExist = await Db.checkValue("SELECT id FROM domains WHERE status = 1 AND title = " + con.escape(req.params.target))
const validemailDomain = await Utils.validate(Utils.setValidation({domain: req.params.target},{domain: 'domain|required|url'}), 'domain').catch(function(e) { verifyStatus = 0; });

if(validemailDomain && domainExist && domainExist > 0){
const path = './upload/'+req.params.target+'.txt';
let hcon = await GetTitle("SELECT hcon AS title FROM domains WHERE status = 1 AND title = " + con.escape(req.params.target)); 
fs.writeFile(path, hcon, function(err) {
if(err) { return console.log(err); }
res.download(path, "verify.txt");
}); 

} else {res.send([{'content':"Domain name not found"}]);}
});

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