const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var fs = require('fs');
var http = require('http');
//var https = require('https');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

const resolvers = require('./resolvers');
const { signUp } = require('./setup');
const Db = require('./db'); 
app.use(cors());

//const offLine = require('./offline');
const typeDefs = require('./schema');
const Utils = require('./utils');
const access = require('./login');

var mysql = require('mysql');
var con = mysql.createConnection({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_DATABASE
});
app.use('/register', function (req, res, next) { 
							   signUp(req, res, next);})
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
server.applyMiddleware({ app, path: '/'});

server.applyMiddleware({ app, path: '/graphql'});
app.use('/graphql', (req, res) => {
res.setHeader('Content-Type', 'application/json');
res.end();

});

http.createServer(app).listen(process.env.PORT, function() { console.log('https listening on 433*:'); });
