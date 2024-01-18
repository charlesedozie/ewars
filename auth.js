require('dotenv').config()
const express = require('express');
const app = express();
var cors = require('cors');
app.use(cors());
const jwt = require("jsonwebtoken")


const Utils = require('./utils');
const Db = require('./db');
const JwtSecret = process.env.JWT_SECRET;

var mysql = require('mysql');
var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});


async function Auth (args) {
  var loggedIn = false;  
  if(args.token){
      jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
        if(err){
          return false
        }
        else {
          return true;
        }
      });

      res.sendStatus(401); return;
    }
    
 return result;
  };







  async function Roles (args) {
    var loggedIn = {userId:null, domain:null, typeId:null, status:null, found:0, password:0}
    var result = [{msg:"", status:1, token:null}]
    const { username, password } = args;
     //check if username password exits in post
     if (!username || username === '') 
     { result[0].status = 0; result[0].msg = result[0].msg+"Please enter your username<br />";  }
     if (!password || password === '') 
     { result[0].status = 0; result[0].msg = result[0].msg+"Please enter your password<br />"; }
     if (result[0].status === 0) { 
	 return result;  }
     
    const validEmail = await Utils.validate(Utils.setValidation({email: username},{email: 'email|required|maxLength:40'}), 'email').catch(function(e) {
    result[0].msg = result[0].msg+e;
    result[0].status = 0;});
    if(!validEmail){result[0].status = 0}
    if(result[0].status === 0) {
	return result; }
  
    //check if uername exits
    const user = await Db.query ("SELECT id, domain, typeid, username, status FROM user");
    if(typeof user === 'object' && user !== null && user.length > 0){
        
      user.every(async function(arrayItem, index) {
        compareResult = Utils.SY_compareHash (username.toLowerCase(), arrayItem.username)
        if (compareResult === true) { 
          loggedIn.userId=arrayItem.id;
          loggedIn.domain=arrayItem.domain;
          loggedIn.typeId=arrayItem.typeid;
          loggedIn.status=arrayItem.status;
          loggedIn.found=1;
        }
      });
    }
  
    if (loggedIn.found === 0) 
     { result[0].status = 0; result[0].msg = result[0].msg+"Username not found<br />"; 
	 return result;}
   
     //check if password is correct
     if (loggedIn.found === 1) 
     { 
      
      const userPassword = await Db.query ("SELECT password FROM password WHERE status=1 AND userid="+con.escape(loggedIn.userId));
      if(typeof userPassword === 'object' && userPassword !== null && userPassword.length > 0){
          
        userPassword.every(async function(arrayItem, index) {
          compareResult = Utils.SY_compareHash (password, arrayItem.password)
          if (compareResult === true) {
            loggedIn.password=1;
          }
        });
      }
    } 
  
    if (loggedIn.password === 0) 
     { result[0].status = 0; result[0].msg = result[0].msg+"Sign in error! Incorrect password<br />"; 
	 return result;}
  
    if (loggedIn.password === 1) 
    { 
      const accessToken = {
        userId: loggedIn.userId,
        domain: loggedIn.domain,
        typeId: loggedIn.typeId,
        userStatus: loggedIn.status
      };   
      token = jwt.sign(accessToken, process.env.JWT_SECRET);
          
      result[0].status = 2; result[0].msg = token; 
	  return result;
  } 
   return result;
    };
exports.Auth = Auth;
exports.Roles = Roles;