require('dotenv').config()
const express = require('express');
const app = express();
var cors = require('cors');
app.use(cors());
const Utils = require('./utils');
const Db = require('./db');
const fetch = require("node-fetch");

var mysql = require('mysql');
var con = mysql.createConnection({
 host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

async function setUp (args, origin) {
let getOriginDomain = Utils.getOriginDomain(origin);  
var result = [{msg:"", status:1}];
const { username, domain, fullname, country } = args;
if (!username || username === '') {result[0].msg = result[0].msg+"Error! <br />Please enter your username"; result[0].status = 0; }
if (!fullname || fullname === '') {result[0].msg = result[0].msg+", your full name"; result[0].status = 0; }
if (!country || country.trim() === '' || country === '0' || parseInt(country) === 0 || isNaN(country)) {result[0].msg = result[0].msg+" Choose Office "; result[0].status = 0; }
if(result[0].status === 0) {return result; }

if(result[0].status === 0) {
console.log(result);
return result; }
const validEmail = await Utils.validate(Utils.setValidation({email: username},{email: 'email|required|maxLength:140'}), 'email').catch(function(e) {
result[0].msg = result[0].msg+e; });
if(!validEmail){result[0].status = 0; }
if(result[0].status === 0) {console.log(result);
return result; }

const email = username.split('@');
const emailDomain = email[1].toLowerCase();
const emailDomainLength = emailDomain.length;
const lastDomainXter = getOriginDomain.slice(-emailDomainLength).toLowerCase();

const validemailDomain = await Utils.validate(Utils.setValidation({domain: emailDomain},{domain: 'domain|required|url'}), 'domain').catch(function(e) { result[0].msg = result[0].msg+e; });
  
if (!validemailDomain) { result[0].msg = result[0].msg+"Internal error we are working to fix it, please try again letter<br />"; result[0].status = 0; 
 }/*
if (emailDomain !== lastDomainXter) { result[0].msg = result[0].msg+"Email address does match domain name: "+getOriginDomain+'. '+
"Use email address from the same domain\n"; //result[0].status = 0;
 }*/
if(result[0].status === 0) {return result; }
const usernameHash = Utils.encrypt (username.trim());
const UUID = Utils.UUID();
const userExits = await Db.query ("SELECT id, username, usernameiv, status FROM user");
if(typeof userExits === 'object' && userExits !== null && userExits.length > 0){   
userExits.every(async function(arrayItem, index) {
const decrypt = Utils.decrypt ({iv: arrayItem.usernameiv, content: arrayItem.username});
//compareResult = Utils.SY_compareHash (args.input.username, arrayItem.username)
if (decrypt === username.toLowerCase()) { 
result[0].msg = 'Username has already been used '
result[0].status = 0; 
return result;
} 
}); //return result;
}

//let orgnameExists = await Db.checkValue("SELECT status FROM orgname WHERE (status = 1 OR status = 4) AND title = "+con.escape(fullname)+" LIMIT 0, 1")            
/*
if(orgnameExists && orgnameExists.length > 0){ 
result[0].msg = 'Organization name has already been used ';
result[0].status = 0; 
return result;
}
*/
if(result[0].status === 1) {
console.log(result[0].status);
addRootUser = await Db.dbUpdate("INSERT INTO user (username, tmpuuid, usernameiv, officeid) VALUES ("+ con.escape(usernameHash.content.toLowerCase()) +","+con.escape(UUID)+","+ con.escape(usernameHash.iv.toLowerCase()) +","+ con.escape(country) +")");
if(addRootUser){
let userId = await Db.query("SELECT id, uuid FROM user WHERE tmpuuid="+con.escape(UUID)+" ORDER BY id DESC LIMIT 0, 1");
var listItems = null;
var listUUID;
var newUUID;
var newUserId;
if (userId && userId.length > 0) {  
const numbers = userId; 
listItems = numbers.map(number => number.id); 
listUUID = numbers.map(number => number.uuid);
newUserId = parseInt(listItems[0]);
newUUID = listUUID[0];

await Db.dbUpdate("INSERT INTO useprofile (userid, fullname) VALUES ("+con.escape(newUserId)  +", "+con.escape(fullname)+")");
}

result[0].status = 1;
result[0].msg = `Setup successful! Click Set Password to continue`;
console.log(result);
return result; 
} }
console.log(result);
return result;
}
exports.setUp = setUp;