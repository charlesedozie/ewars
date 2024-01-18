require('dotenv').config()
const express = require('express');
const app = express();
var cors = require('cors');
app.use(cors());
const jwt = require("jsonwebtoken");
app.use(express.urlencoded({
  extended: true
}));
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

async function DecodeJWT(token){
var result = {status:false, userId:null, domainName:null, typeId:null, agentStatus:false, useruuid:null}
token = token.split(' '); 
if(token.length > 0){
jwtToken = token[1];
jwt.verify(jwtToken, process.env.JWT_SECRET, async function(err, decoded) {
if(!err){
result.userId=decoded.userId; result.status=true;
result.domainName=decoded.domain; result.typeId=decoded.typeId; result.useruuid=decoded.useruuid;
}
});      
}        
return result;   
}

async function VerifyJWT(token){
  let result = {status:false}
  token = token.split(' '); 
  if(token.length > 0){
    jwtToken = token[1];
      jwt.verify(jwtToken, process.env.JWT_SECRET, function(err, decoded) {
        if(!err){ result.status=true;}
      });   
  }        
  return result;   
}
async function settings (domain){ 
let subscription = await Utils.checkSubscription (domain);
let settings = {"48":0, "34":0, "51":0, "31":0, "41":0, "45":0, "50":0, "49": 0, "43":0, "42":0, "44":0, "87":0, "subcription": subscription};
let currSettings = await Db.query("SELECT rowid FROM itemstatus WHERE status = 1 AND tbl = 9 AND domain = " + con.escape(domain));
if(currSettings.length > 0){
	for (let step = 0; step < currSettings.length; step++) { updateSettings(currSettings[step].rowid); }
}
function updateSettings(id){ settings[id] = 1; }
return settings;		   
}


async function agentDept (domain){ 
let subscription = await Utils.checkSubscription (domain);
let settings = {"48":0, "34":0, "51":0, "31":0, "41":0, "45":0, "50":0, "49": 0, "43":0, "42":0, "44":0, "subcription": subscription};
let currSettings = await Db.query("SELECT rowid FROM itemstatus WHERE status = 1 AND tbl = 9 AND domain = " + con.escape(domain));
if(currSettings.length > 0){
for (let step = 0; step < currSettings.length; step++) { updateSettings(currSettings[step].rowid); }
}
function updateSettings(id){ settings[id] = 1; }
return settings;		   
}

async function accessControl(req, res, next){ 
let  accessStatus = false;
let accessResult = [{status:'0', msg:"Error! Invalid API Key"}];

try {  
if (req.headers.authorization) {
let authBody = req.headers.authorization.split(' ');
if(authBody.length > 0 && authBody[0] === 'Bearer'){ 
const userVerify = await Db.checkValue("SELECT id FROM user WHERE status = 1 AND uuid="+con.escape(authBody[1]));
if(userVerify > 0){  accessStatus = true; 
accessResult[0].status = 1; accessResult[0].msg = "Logging in"; next(); } 
}
} 
} catch { console.log("catch error"); }
return accessStatus;
}

async function getApiKey(userId){
const userVerify = await Db.query("SELECT uuid FROM user WHERE status = 1 AND id="+con.escape(userId));
if(userVerify.length > 0){ return userVerify[0].uuid; } else {  return false; }
} 

async function Login (args, context) { 
  var loggedIn = {userId:null, domain:null, typeId:null, status:null, found:0, password:0, uuid:null, verify:0}
  var resultNew = {status:'1', msg:"Error: ", itemId: 0, typeid:0, address:null}  

  const username = args.input.username; 
  const password = args.input.password; 
  const domain = ''; 
  //const auth = args.input.auth; 

if (!username || username.trim() === '' || username === "undefined") 
{ resultNew.status = 0; resultNew.msg = resultNew.msg+" Username"; }
if (!password || password.trim() === '' || password === "undefined") 
{ resultNew.status = 0; resultNew.msg = resultNew.msg+"; Password";}
if (resultNew.status === 0) {      return resultNew;  }


const validEmail = await Utils.validate(Utils.setValidation({email: username},{email: 'email|required|maxLength:40'}), 'email').catch(function(e) {
resultNew.msg = resultNew.msg+e;
resultNew.status = 0;});
if(!validEmail){resultNew.status = 0}
if(resultNew.status === 0) { 
return resultNew; }

const user = await Db.query ("SELECT id, username, usernameiv, status, uuid, verify FROM user");
if(typeof user === 'object' && user !== null && user.length > 0){

user.every(async function(arrayItem, index) {
const decrypt = Utils.decrypt ({iv: arrayItem.usernameiv, content: arrayItem.username});
//compareResult = Utils.SY_compareHash (username.toLowerCase(), arrayItem.username)
if (decrypt === username.toLowerCase()) { 
loggedIn.userId=arrayItem.id;
loggedIn.domain='';
loggedIn.typeId='';
loggedIn.status=arrayItem.status;
loggedIn.uuid=arrayItem.uuid;
loggedIn.found=1;
loggedIn.verify=arrayItem.verify;
}
});
}
  
  if (loggedIn.found === 0) 
   { 

  // result[0].status = 0; result[0].msg = result[0].msg+"Username not found<br />"; return result;
   resultNew.status = 0; resultNew.msg = resultNew.msg+"Username not found";  return resultNew;
   
   }
 if (loggedIn.verify === 0) 
   { 

  // result[0].status = 0; result[0].msg = result[0].msg+"Username not found<br />"; return result;
   resultNew.status = 0; resultNew.msg = resultNew.msg+" Please verify your email. Click Reset Password to continue";  return resultNew;
   
   }
   //check if password is correct
   if (loggedIn.found === 1) 
   { 
      

if(parseInt(loggedIn.typeId) === 2){	
  if(await Utils.checkUserStatus(loggedIn.userId) !== 1){resultNew.status = 0; resultNew.msg = "Account Disabled or Cancelled "; 
  return resultNew;}
  }
        
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
   { 
   //result[0].status = 0; result[0].msg = result[0].msg+"Sign in error! Incorrect password<br />"; return result;
   resultNew.status = 0; resultNew.msg = resultNew.msg+"Sign in error! Incorrect password"; 
    return resultNew;
   }
  if (loggedIn.password === 1) 
  { 

    const accessToken = {
      userId: loggedIn.userId,
      domain: loggedIn.domain,
      typeId: loggedIn.typeId,
      userStatus: loggedIn.status,
      useruuid: loggedIn.uuid,
      verify: loggedIn.verify,
      agentName: loggedIn.agentName,
      agentStatus: loggedIn.agentStatus,
	    settings: [],
      email:username,
      agency:1,
    };   
         
  token = jwt.sign(accessToken, process.env.JWT_SECRET);        
	resultNew.status = 2;
	resultNew.msg= token;
	resultNew.address = await getApiKey(loggedIn.userId); 
	resultNew.itemId =  args.input.formid;
	resultNew.typeid = args.input.formid;
} 
 return resultNew;
  };

async function getOTP(userid){
 	let agentname = await Db.query("SELECT title FROM otp WHERE status = 1 AND (userid = "+con.escape(userid)+") ORDER BY id DESC LIMIT 0, 1");  
  if(agentname.length > 0){ return agentname[0].title; }
  return null;
}
async function resetPassword (args, context) {
var result = [{msg:"", status:'1'}];
let loggedIn = {found: 0};
const { username, otp, domain, password, confirmpassword, frmMode } = args;
if(parseInt(frmMode) === 0){ // start frm mode === 0
if (!username || username.trim() === '' || username === "undefined") { 
result[0].status = 0; result[0].msg = result[0].msg+"Error! Incorrect entry, please enter your username";  }  
if (result[0].status === 0) { return result;  }
} // end frm mode == 0

 
if(parseInt(frmMode) === 1){ // start frm mode === 1
if (!username || username.trim() === '' || username === "undefined"  || !otp || otp.trim() === '' || otp === "undefined" || !password || password.trim() === '' || password === "undefined" || !confirmpassword || confirmpassword.trim() === '' || confirmpassword === "undefined") { result[0].status = 0; result[0].msg = result[0].msg+"Error! Incorrect entry";  } 
   if (confirmpassword !== password) { result[0].status = 0; result[0].msg = result[0].msg+"Error! Password do not match";  } 
   if (isNaN(otp)) { result[0].status = 0; result[0].msg = result[0].msg+"Error! Incorrect OTP";  } 


const maxPassword = await Utils.validate(Utils.setValidation({password: password},{password: 'maxLength:15|required'}), 'password').catch(function(e) {
result[0].msg = e; });
if(!maxPassword){result[0].status = 0;return result;}

const minPassword = await Utils.validate(Utils.setValidation({password: password},{password: 'minLength:6|required'}), 'password').catch(function(e) {
result[0].msg = e; });
if(!minPassword){result[0].status = 0; }
if(result[0].status === 0) {return result; }

if(!Utils.CheckPassword(password)){
result[0].msg = "Password must contain a number, special character, uppercase letter, lowercase letter and be 6 to 15 characters long";
result[0].status = 0;}
if(result[0].status === 0) {return result; }

   if (result[0].status === 0) { return result;  }
} // end frm mode == 1

  const email = username.split('@');
  const emailDomain = email[1];
  const emailDomainLength = emailDomain.length;
  const lastDomainXter = domain.slice(-emailDomainLength);
  let otpUserId;
  let userDomain;
  let sendMail;

  const validEmail = await Utils.validate(Utils.setValidation({email: username},{email: 'email|required|maxLength:50'}), 'email').catch(function(e) {
  result[0].msg = result[0].msg+e;
  result[0].status = 0;});
  //if(!validEmail){result[0].status = 0; result[0].msg = result[0].msg+"Invalid email<br />";} else {conaole.log("error");}
  if(result[0].status === 0) {return result; }
   /* if (emailDomain !== lastDomainXter) { 
      result[0].msg = result[0].msg+"Email address does match domain name: "+domain+'. <br />'+
    "Use email address from the same domain\n"; result[0].status = 0;
    return result; }*/
  //check if uername exits  
  const user = await Db.query ("SELECT id, username, usernameiv, status, uuid FROM user");
  if(typeof user === 'object' && user !== null && user.length > 0){      
    user.every(async function(arrayItem, index) {
      const decrypt = Utils.decrypt ({iv: arrayItem.usernameiv, content: arrayItem.username});
      if (decrypt === username.toLowerCase()) { 
        loggedIn.found=1; otpUserId=arrayItem.id;
      }
    });
  }
  
  if (loggedIn.found !== 1) 
   { result[0].status = 0; result[0].msg = result[0].msg+"Username not found<br />"; 
   return result;}

if (loggedIn.found === 1) 
   { 
if(parseInt(frmMode) === 0){ // SEND OTP
let otpNumber = Utils.genOTP();
console.log(otpNumber);
console.log(otpUserId);
let toname = await Utils.GetAgentName(otpUserId);
await Db.dbUpdate("UPDATE otp SET status = 2 WHERE userid = "+con.escape(otpUserId));
await Db.dbUpdate("INSERT INTO otp (userid, title) VALUES ("+con.escape(otpUserId)  +", "+con.escape(otpNumber)+")");

//if(!sendMail){
//sendMail = true;

result[0].status = 3; result[0].msg = `Enter the OTP Code sent to your email, choose new password to continue`; 
//}
return result;
} // end send OTP
let curOTP = await getOTP(otpUserId);
if(curOTP !== null && (curOTP !== otp)){result[0].status = 0; result[0].msg = "Invalid OTP!"; 
return result;}
   
const passwordHash = Utils.SY_hashVar (password);
if(result[0].status === 1){
updatePassword = await Db.dbUpdate("UPDATE password SET status = 2 WHERE userid = "+con.escape(otpUserId));
await Db.dbUpdate("UPDATE user SET verify = 1 WHERE id = "+con.escape(otpUserId));
await Db.dbUpdate("INSERT INTO password (userid, password) VALUES ("+con.escape(otpUserId)
+", "+con.escape(passwordHash)+")");
result.msg = "Done"; }   
result[0].status = 1; result[0].msg = result[0].msg+"Reset Password Successful! Return to login"; 
return result;}
return result;
  };
//exports.fireWall = fireWall;
exports.Login = Login;
exports.resetPassword = resetPassword;
exports.VerifyJWT = VerifyJWT;
exports.DecodeJWT = DecodeJWT;
exports.accessControl = accessControl;