require('dotenv').config()
const { Validator } = require('node-input-validator');
const bcrypt = require("bcryptjs")
const JwtSecret = process.env.JWT_SECRET;
const express = require('express');
const app = express();
var cors = require('cors');
app.use(cors());
var bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({ extended: true }));
const Db = require('./db')
const jwt = require("jsonwebtoken")
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const iv = crypto.randomBytes(16);

var mysql = require('mysql');
var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

function validURL(str){
    regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
          if (regexp.test(str)) { return true; }
          else { return false; }
  }

function validate(v,name) {
        return promise = new Promise(function(resolve, reject) {
            v.check().then(function (matched) {
                if(matched){
                    success = true;
                    resolve(success);                   
                    
                }
                else {
                let myString = "v.errors.";
                eval("nerror =" + myString + name +".message");
                reject(nerror);
            }
    
            });
        }); 
}
function CheckPassword(input) { 
var format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
var returnVal = true;

var lowerCaseLetters = /[a-z]/g;
var upperCaseLetters = /[A-Z]/g;
var numbers = /[0-9]/g;
  if(!input.match(lowerCaseLetters)) { returnVal = false; } 
  if(!input.match(upperCaseLetters)) { returnVal = false;  } 
  if(!input.match(numbers)) { returnVal = false; } 
  if(input.length < 6) {returnVal = false;  } 
  if(input.length > 15) {returnVal = false; } 
  if(!format.test(input)) {returnVal = false; } 
  return returnVal;
}

function genOTP(){ 
    var text = ""; var possible = "0123456789";
    for (var i = 0; i < 5; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length)); } return text; } 
function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
    }
function decrypt(hash) {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrpyted.toString();
    }
    
    
function setValidation(a,b){ return new Validator(a,  b, ); }
function hashVar (str) {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(str, salt, (error, results) => {
            if (error) return reject(error);
            return resolve(results);
        });
    });
        })
    }
function compareHash (str, hash) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(str, hash, function(error, results) {
            if (error) return reject(error);
            return resolve(results);
        });
        })
    }
function SY_hashVar (str) {
let salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(str, salt);
        return hash;
}

function SY_compareHash (str, hash) {
    const result = bcrypt.compareSync(str, hash); // true
            if (result) return true;
            return false;
    }
function UUID(){
var dt = new Date().getTime();
var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
var r = (dt + Math.random()*16)%16 | 0;
dt = Math.floor(dt/16);
return (c=='x' ? r :(r&0x3|0x8)).toString(16);
});
return uuid;
}
function catchError(){ return null; }

async function GetAgentEmail(id){ 
let useremail="";
let agentEmail = await Db.query("SELECT username, usernameiv, id FROM user WHERE status = 1 AND (id = "+con.escape(parseInt(id))+")");
    
if(agentEmail && agentEmail.length > 0){
useremail = decrypt({iv: agentEmail[0].usernameiv, content: agentEmail[0].username});
} 
return useremail;  }
    
   

async function GetAgentDetails(id, domain){
let returnVal = {email:"", orginfo:"", uuid:"", fullname:"", gender:"", address:"", city:"", province:"", country:"", phone:"", zip:""}    

let userInfo = await Db.query("SELECT username, usernameiv, uuid FROM user WHERE status = 1 AND domain = "+con.escape(domain)+" AND id = "+con.escape(id)+" ORDER BY id DESC LIMIT 0, 1"); 
   
let orgInfo = await Db.query("SELECT title FROM orgname WHERE status = 1 AND domain = "+con.escape(domain)+" ORDER BY id DESC LIMIT 0, 1"); 
   
let bioInfo = await Db.query("SELECT fullname, gender, address, city, province, country, phone,  zip FROM useprofile WHERE status = 1 AND userid = "+con.escape(parseInt(id)));
   
if(userInfo && userInfo.length > 0){
returnVal.email = decrypt({iv: userInfo[0].usernameiv, content: userInfo[0].username});
returnVal.uuid = userInfo[0].uuid;} 

if(orgInfo && orgInfo.length > 0){ returnVal.orginfo = orgInfo[0].title; } 

if(bioInfo && bioInfo.length > 0){
returnVal.fullname = bioInfo[0].fullname;
returnVal.gender = bioInfo[0].gender;
returnVal.address = bioInfo[0].address;
returnVal.city = bioInfo[0].city;
returnVal.province = bioInfo[0].province;
returnVal.country = bioInfo[0].country;
returnVal.phone = bioInfo[0].phone;
returnVal.zip = bioInfo[0].zip;} 
return {returnVal};}

async function GetAgentName(id){
let agentname = await Db.query("SELECT typeid, domain FROM user WHERE status = 1 AND id = "+con.escape(parseInt(id))+" ORDER BY id DESC LIMIT 0, 1");  
if(agentname.length > 0 && agentname[0].typeid === 1){ 
let orgname = await Db.query("SELECT title FROM orgname WHERE status = 1 AND domain = "+con.escape(agentname[0].domain)+" ORDER BY id DESC LIMIT 0, 1");    
return orgname[0].title; } 
else {  
let prfname = await Db.query("SELECT fullname FROM useprofile WHERE status = 1 AND userid = "+con.escape(parseInt(id))+" ORDER BY id DESC LIMIT 0, 1"); 
if(prfname.length > 0){ return prfname[0].fullname; }   
return ""; }
}

async function checkSubscription (domain){ 
let checkSubscription = false;
let total = await Db.query("SELECT status FROM payments WHERE status = 1 AND expires > CURDATE() AND domain = " + con.escape(domain));
if(total.length > 0){checkSubscription = true;}
let val = { status: checkSubscription }				
return true;}

async function checkUserStatus (userId){ 
let status = 2; 
let total = await Db.query("SELECT status, typeid FROM user WHERE status = 1 AND id = " + con.escape(userId));
if(total.length > 0){ // process for user found
if(parseInt(total[0].typeid) === 1){status = 1; return parseInt(status);} // root access


let agentStatus = await Db.query("SELECT status FROM itemstatus WHERE tbl = 2 AND status = 1 AND rowid = " + con.escape(userId));
if(agentStatus.length > 0){status = 1;} 
}	
return parseInt(status);		   
}
function getOriginDomain(origin, domain=0){
let count = 0;
let returnVal = origin;
let lastPosition;
// looping through the items
for (let i = 0; i < origin.length; i++) {
// check if the character is at that position
if (origin.charAt(i) == ":") { count += 1; }}
if(count > 1){ lastPosition = origin.lastIndexOf(":"); 
returnVal = origin.slice(0,lastPosition);
}
if(domain !== 0){returnVal = returnVal.replace(/^[^.]+\./g, '');}
return returnVal;
}
function isBeforeToday(confdate) {
var date1 = new Date(confdate);
var date2 = new Date();
date2.setHours(0, 0, 0, 0);
if(date1 && (date1.getTime() === date2.getTime() || date1.getTime() > date2.getTime())){
return true;}
if(date1 && date1.getTime() < date2.getTime()){ return false; }
}

exports.validate = validate;
exports.setValidation = setValidation;
exports.hashVar = hashVar;
exports.UUID = UUID;
exports.catchError = catchError;
exports.compareHash = compareHash;
exports.SY_hashVar = SY_hashVar;
exports.SY_compareHash = SY_compareHash;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.CheckPassword = CheckPassword;
exports.GetAgentEmail = GetAgentEmail;
exports.GetAgentName = GetAgentName;
exports.checkSubscription = checkSubscription;
exports.genOTP = genOTP;
exports.getOriginDomain = getOriginDomain;
exports.checkUserStatus = checkUserStatus;
exports.validURL = validURL;
exports.isBeforeToday = isBeforeToday;
exports.GetAgentDetails = GetAgentDetails;