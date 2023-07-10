require('dotenv').config();
//const express = require('express');
//const app = express();
const Utils = require('./utils');
const Db = require('./db');
const Login = require('./login');
const formidable = require('formidable');
const fs = require('fs');
var mysql = require('mysql');
var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});
async function validateFile(mimeType, media=27){
let checkMime;
if(parseInt(media) === 27){ checkMime = await Db.checkValue("SELECT status FROM allowedmime WHERE status = 1 AND title ="+con.escape(mimeType.trim())); }
if(parseInt(media) === 76){ 
if(mimeType.trim().startsWith("video/") || mimeType.trim().startsWith("audio/")){ checkMime = 1;}
}
if(parseInt(media) === 97){ if(mimeType.trim().startsWith("image/")){ checkMime = 1;} }
if(parseInt(checkMime) > 0) { return true; } else {return false;} }

async function getClientId(useruuid){
  const checkMime = await Db.update("SELECT id FROM user WHERE status = 1 AND uuid ="+con.escape(useruuid)); 
  if(parseInt(checkMime) > 0) { return true; } else {return false;} }

async function updateServerFiles(id){
  const filerepos = await Db.dbUpdate("SELECT originalname, id, newname, repoid FROM filerepos WHERE status=1 AND repoid= "+con.escape(parseInt(id))+" ORDER BY id ASC");
 if(filerepos.length > 5) {
for (let i = 0; i < filerepos.length; i++) {
  if(i > 4) {
    await Db.dbUpdate("UPDATE filerepos SET status = 2 WHERE id = "+con.escape(parseInt(filerepos[i].id)));
  }
}}
  return id;
}
async function getTotalCurrFiles(repoId){
  const countFiles = await Db.dbUpdate("SELECT COUNT(id) AS Total FROM filerepos WHERE status=1 AND repoid= "+con.escape(parseInt(repoId)));
  return (countFiles[0].Total);
}
async function logSessionMedia(usertype, title, sessionid, newfile, sectionId){
await Db.dbUpdate("INSERT INTO sessionmedia (usertype, title, sessionid, newfile, sectionid) VALUES ("+con.escape(usertype)+", "+con.escape(title)+", "+con.escape(sessionid)+", "+con.escape(newfile)+", "+con.escape(sectionId)+")");  
}
//async function updateCurrSeats(id){   Db.dbUpdate("UPDATE itemstatus SET status = 20 WHERE id = "+con.escape(id));}

async function Upload(req, res, next){ // start upload
var returnVal = [{"status": 0, "msg": "Failed"}];
let reqAuth = "none none";
var form = new formidable.IncomingForm();
form.multiples = true;
form.maxFileSize = 5000 * 1000 * 1000; // 5MB
if(typeof req.headers.authorization !== 'undefined') { 
reqAuth = req.headers.authorization; // process for authorization found
const clientId = await Login.DecodeJWT(reqAuth);
if(typeof clientId.status !== 'undefined' && clientId.status === true) { 
// Basic Configuration
// start Parsing
form.parse(req, async (err, fields, files) => { 
let frmID = (typeof fields.formID !== 'undefined') ? parseInt(fields.formID) : 0;
if(frmID === 56){ // process update payment
function exDate(months) {  
const date = new Date();
date.setMonth(date.getMonth() + months);
return date.getFullYear()+'-' + (date.getMonth()+1) + '-'+date.getDate();}
let expires;
if(fields.expires){expires = exDate(parseInt(fields.expires));}
//expires = exDate(parseInt(formState.duration));
if(fields.renew && fields.renew.toLowerCase() === "yes"){
let currDate =  await Db.query("SELECT expires FROM payments WHERE status=1 AND subid= "+con.escape(fields.subid)+" AND domain= "+con.escape(clientId.domainName)+" ORDER BY id DESC LIMIT 0,1");

var today = new Date();
var todayDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

if(currDate.length > 0){
var date1 = new Date(currDate[0].expires);
var date2 = new Date(todayDate);

if(date1.getTime() >= date2.getTime()){ 
var newExpires = new Date(date1);
newExpires.setMonth( newExpires.getMonth() + 2 );
expires = newExpires;
await Db.dbUpdate("UPDATE payments SET status = 2 WHERE subid = "+con.escape(parseInt(fields.subid)));}}}

const repos = await Db.dbUpdate("INSERT INTO payments (subid, transid, expires, amount, domain, mode) VALUES ("+con.escape(fields.subid)+", "+con.escape(fields.transid)+", "+con.escape(expires)+", "+con.escape(fields.amount)+", "+con.escape(clientId.domainName)+", "+con.escape(fields.mode)+")");

let returnVal = [{"status": 1, "msg": "Done"}];
res.send(returnVal);
return;
} //end process update payment
if(frmID === 8){ // start processing get curr files
if(clientId.status === true){ // process for valid jwt
//const filerepos = await Db.dbUpdate("SELECT originalname, id, newname FROM filerepos WHERE status=1 AND repoid= "+con.escape(parseInt(fields.repoId))+" ORDER BY originalname ASC");
updateServerFiles(fields.repoId).then(async (value) => {  // update server files
 let filerepos =  await Db.dbUpdate("SELECT originalname, id, newname, repoid FROM filerepos WHERE status=1 AND repoid= "+con.escape(parseInt(fields.repoId))+" ORDER BY id ASC");
  //return filerepos; 
  returnVal = filerepos;
res.send(returnVal);
return;
  }).catch((e) => { 
});
} // process for valid jwt
} // end processing get curr files
if(frmID === 10){ // start processing delete file
  if(clientId.status === true){ // process for valid jwt
  Db.dbUpdate("UPDATE filerepos SET status = 4 WHERE id = "+con.escape(parseInt(fields.fileId)));
  returnVal = [{"status": 1, "msg": "Deleted"}];
   res.send(returnVal);
   return;
  } // process for valid jwt
  } // end processing delete file

if(frmID === 12){ // start processing upload attachment to visitor
let useNewname = "";
if(!files.myFile.length){ // process for single file upload 
const file = files.myFile;
var oldpath = file.filepath;
if (err) { 
} // log error
  else {
   let validMime = await validateFile(file.mimetype);  
  if(validMime === true){ // valid file mime
    var stats = fs.statSync(oldpath)
    var fileSizeInBytes = stats.size;
    var fileSizeInMegabytes = fileSizeInBytes / (1000*1000);
    if (fileSizeInMegabytes > 5) { // process for large file size
    returnVal = [{"status": 0, "msg": file.originalFilename+": File greater than 5MB"}];
    } // end processing for large file 
    else { // process for valid file size
    const newFilename = encodeURIComponent(file.originalFilename.replace(/[^.a-zA-Z0-9]/g, '')); // remove special xter
  useNewname = Utils.UUID()+newFilename;
 returnVal = [{"status": 1, "msg": "Done", "oldfile": file.originalFilename, "newfile": useNewname}];  
 logSessionMedia(2, file.originalFilename, fields.sessionId, useNewname, fields.sectionId);
if(clientId.status === true){ // process for valid jwt
    var newpath = "./upload/" + useNewname;
    try {
     fs.rename(oldpath, newpath, function (err) {
   if (err) console.log(err); 
	});
    } catch (error) { 
	} // end try rename file
    try { // stores the fileName in the database
    //const repos = await Db.dbUpdate("INSERT INTO filerepos (originalname, newname, repoid) VALUES ("+con.escape(file.originalFilename)+", "+con.escape(useNewname)+", "+con.escape(fields.repoId)+")");
    } catch (error) {
	} // end database storage 
 
    } else {
	}// end processing for valid jwt
    } // end processing for valid file size
    } // end processing for valid mime
    else { // process for invalid mime
    returnVal = [{"status": 0, "msg": file.originalFilename+": Invalid File Type"}];    
    } // end processing for invalid mime
  } // end processing for no parsing error
res.send(returnVal);
return;  

//res.send(returnVal);
//return;
} // end process for single file
} // end processing upload attachment to visitor
if(frmID === 9){ // start processing upload form
if(!files.myFile.length){ // process for single file upload 
getTotalCurrFiles(fields.repoId).then(async (value) => {  // start process after gettotal return
if(value <= 4){ // process if server files less than 5 
const file = files.myFile;
var oldpath = file.filepath;
if (err) { 
} // log error
  else { 
let validMime = await validateFile(file.mimetype, fields.media); 
if(validMime === true){ // valid file mime
var stats = fs.statSync(oldpath);   
var fileSizeInBytes = stats.size;
// Convert the file size to megabytes (optional)
var fileSizeInMegabytes = fileSizeInBytes / (1000*1000);
if (fileSizeInMegabytes > 20) { // process for large file size
returnVal = [{"status": 0, "msg": file.originalFilename+": File greater than 20MB"}];} 
if (fileSizeInMegabytes > 20) { // process for large file size
returnVal = [{"status": 0, "msg": file.originalFilename+": File greater than 20MB"}]; } 
	// end processing for large file 
    else { // process for valid file size
    returnVal = [{"status": 1, "msg": "Done"}];
    const newFilename = encodeURIComponent(file.originalFilename.replace(/[^.a-zA-Z0-9]/g, '')); // remove special xter
    let useNewname = Utils.UUID()+newFilename;
    if(clientId.status === true){ // process for valid jwt
    var newpath = "./upload/" + useNewname;
      
    try {
    // renames the file in the directory
     fs.rename(oldpath, newpath, function (err) {   
      console.log(err);	});
    } catch (error) { 
	} // end try rename file
  
try { // stores the fileName in the database
if(parseInt(fields.media) === 97) { 
let addLogo = Db.dbUpdate("UPDATE orglogo SET status = 2 WHERE status = 1 AND domain = "+con.escape(clientId.domainName));  
if(addLogo){ await Db.dbUpdate("INSERT INTO orglogo (originalname, newname, domain) VALUES ("+con.escape(file.originalFilename)+", "+con.escape(useNewname)+", "+con.escape(clientId.domainName)+")");
}} else {
await Db.dbUpdate("INSERT INTO filerepos (originalname, newname, repoid) VALUES ("+con.escape(file.originalFilename)+", "+con.escape(useNewname)+", "+con.escape(fields.repoId)+")");
}
} catch (error) {
} // end database storage 
 
    } else {
	}// end processing for valid jwt
    } // end processing for valid file size
    } // end processing for valid mime
    else { // process for invalid mime
    returnVal = [{"status": 0, "msg": file.originalFilename+": Invalid File Type"}];    
    } // end processing for invalid mime
  } // end processing for no parsing error

res.send(returnVal);
return;  
} // end process if server files less than 5
else { // process if server files more than 5
returnVal = [{"status": 0, "msg": "You cannot attach more than five files, delete a file to attach new one"}];
res.send(returnVal);
return;
//return res.send(returnVal); next();
}// END if server files more than 5
//res.send(returnVal);
//return;
});// end process after gettotal return
} // end process for single file
} // end processing upload form 
}); // end parsing
} // end status true
} // end process for authorization found
} // end upload base function




async function visitorUpload(req, res, next){ // start upload visitor file
var returnVal = [{"status": 0, "msg": "Failed"}];
let reqAuth = "none none";
var form = new formidable.IncomingForm();
form.multiples = true;
form.maxFileSize = 5000 * 1000 * 1000; // 5MB
if(typeof req.headers.authorization !== 'undefined') { // start authorizatyion
reqAuth = req.headers.authorization; // process for authorization found
// Basic Configuration
// start Parsing
form.parse(req, async (err, fields, files) => { 
let frmID = (typeof fields.formID !== 'undefined') ? parseInt(fields.formID) : 0;
if(frmID === 14){ // start processing upload attachment to visitor
let useNewname = "";
if(!files.myFile.length){ // process for single file upload 
const file = files.myFile; var oldpath = file.filepath;
let validMime = await validateFile(file.mimetype);  
if(validMime === true){ // valid file mime
var stats = fs.statSync(oldpath)
var fileSizeInBytes = stats.size;
var fileSizeInMegabytes = fileSizeInBytes / (1000*1000);
if (fileSizeInMegabytes > 5) { // process for large file size
returnVal = [{"status": 0, "msg": file.originalFilename+": File greater than 5MB"}];
} // end processing for large file 
else { // process for valid file size
const newFilename = encodeURIComponent(file.originalFilename.replace(/[^.a-zA-Z0-9]/g, '')); // remove special xter
useNewname = Utils.UUID()+newFilename;
returnVal = [{"status": 1, "msg": "Done", "oldfile": file.originalFilename, "newfile": useNewname}];  
logSessionMedia(2, file.originalFilename, fields.sessionId, useNewname, fields.sectionId);
var newpath = "./upload/" + useNewname;
try {
fs.rename(oldpath, newpath, function (err) { if (err) console.log(err);  });
} catch (error) { 	} // end try rename file
try { // stores the fileName in the database
//const repos = await Db.dbUpdate("INSERT INTO filerepos (originalname, newname, repoid) VALUES ("+con.escape(file.originalFilename)+", "+con.escape(useNewname)+", "+con.escape(fields.repoId)+")");
} catch (error) { } // end database storage 
} // end processing for valid size
} // end processing for valid mime
else { // process for invalid mime
returnVal = [{"status": 0, "msg": file.originalFilename+": Invalid File Type"}];    
} // end processing for invalid mime
res.send(returnVal);
return;  

//res.send(returnVal);
//return;
} // end process for single file




} // end processing upload attachment to visitor

}); // end form parse


}// end authorizatyion
} // end processing upload attachment to visitor




var clientsocketid = null;
async function OfflineMsg(req, res, next){
console.log('return');
let transid = Utils.UUID();	
let reqAuth = "none none";
if(typeof req.headers.authorization !== 'undefined') { reqAuth = req.headers.authorization;}
let frmID = (typeof req.body.formID !== 'undefined') ? parseInt(req.body.formID) : 0;
let authBody = reqAuth.split(' ');
let insertData = true; 
var result = {
"status": 0,
"msg": "",
"fields": [],
};
if(frmID === 3){ // process check available agent
if(insertData){
let subscriptions = await Db.query("SELECT status FROM payments WHERE status = 1 AND expires > CURDATE() AND domain = " + con.escape(authBody[2]));
let currOfflineText = [{description: 'We are currently offline, please leave a message and we will get back to you soon' }]; 
let currConnectionText = [{description: 'Complete the form below to talk to a live support agent '}];
const agents = await Db.checkValue("SELECT status FROM itemstatus WHERE status = 1 AND tbl=24 AND domain= "+con.escape(authBody[2]));
const offlinetext = await Db.query("SELECT description FROM offlinetext WHERE status = 1 AND domain= "+con.escape(authBody[2]));
const connectiontext = await Db.query("SELECT description FROM connectionfrmtext WHERE status = 1 AND domain= "+con.escape(authBody[2]));
if(offlinetext.length > 0){currOfflineText = offlinetext;}
if(connectiontext.length > 0){currConnectionText = connectiontext;}
result = {
"status": agents,
"msg":"",
"offlinetext":currOfflineText,
"connectiontext":currConnectionText,
"subscriptions": subscriptions.length,
//"queue": queue,
//  "agentReady":statusVal
};};
} //end process check available agent  

if(frmID === 7){ // process load department
if(insertData){
const dept = await Db.dbUpdate("SELECT title, id FROM department WHERE status=1 AND (domain= "+con.escape(authBody[2])+" || domain= 0) ORDER BY title ASC");
if(dept.length > 0){
result = {
"status": 1,
"msg": dept
} } }; 
} //end process load department  


if(frmID === 2){// start process offline form
if(!req.body.fullname || !req.body.email || !req.body.department || !req.body.msg) {result.msg = "Complete all required fields"; insertData = false; } 

if(insertData){
const validEmail = await Utils.validate(Utils.setValidation({email: req.body.email},{email: 'email|required|maxLength:50'}), 'email').catch(function(e) {
result.msg = result.msg+e; });
if(!validEmail){ insertData = false; result.fields.push("email"); } 
if (isNaN(req.body.department)) { insertData = false; result.msg = result.msg+" Invalid Department, "; } 
if (req.body.fullname.trim().length < 2) { insertData = false; result.msg = result.msg+ " Invalid Full name, "; } 
if (req.body.msg.trim().split(' ').length < 5) { insertData = false; result.msg = result.msg+ ", Invalid message, message must be greater five words ";} 
}
if(insertData){ 
const usernameHash = Utils.encrypt (req.body.email.toLowerCase());
const user = await Db.dbUpdate("INSERT INTO offlinemsg (title, description, email, domain, department, iv) VALUES ("+con.escape(req.body.fullname)+", "+con.escape(req.body.msg)+", "+con.escape(usernameHash.content.toLowerCase())+", "+con.escape(authBody[2])+", "+con.escape(req.body.department)+", "+con.escape(usernameHash.iv.toLowerCase())+")");

  result = {
  "status": 1,
  "msg": "Message submitted, we will get back to you soon"
  }} 
}// end process offline form

if(frmID === 17){// start process online ticket form
  if(!req.body.fullname || !req.body.email || !req.body.department || !req.body.msg) {result.msg = "Complete all required fields"; insertData = false; } 
  
  if(insertData){
  const validEmail = await Utils.validate(Utils.setValidation({email: req.body.email},{email: 'email|required|maxLength:50'}), 'email').catch(function(e) {
  result.msg = result.msg+e; });
  if(!validEmail){ insertData = false; result.fields.push("email"); } 
  if (isNaN(req.body.department)) { insertData = false; result.msg = result.msg+" Invalid Department, "; } 
  if (req.body.fullname.trim().length < 2) { insertData = false; result.msg = result.msg+ " Invalid Full name, "; } 
  if (req.body.msg.trim().split(' ').length < 5) { insertData = false; result.msg = result.msg+ ", Invalid message, message must be greater five words ";} 
  }
  if(insertData){ 
  const usernameHash = Utils.encrypt (req.body.email.toLowerCase());
  const user = await Db.dbUpdate("INSERT INTO offlinemsg (title, description, email, domain, department, iv) VALUES ("+con.escape(req.body.fullname)+", "+con.escape(req.body.msg)+", "+con.escape(usernameHash.content.toLowerCase())+", "+con.escape(authBody[2])+", "+con.escape(req.body.department)+", "+con.escape(usernameHash.iv.toLowerCase())+")");
  
    result = {
    "status": 1,
    "msg": "Message submitted, we will get back to you soon"
    }} 
  }// end process online ticket form

if(frmID === 1){// start request chat
if(typeof req.body.fname === 'undefined' || typeof req.body.email === 'undefined' || typeof req.body.department === 'undefined') {result.msg = "Complete all required fields"; insertData = false; } 
const department = (typeof req.body.department === 'undefined') ? 0 : parseInt(req.body.department);
const customerNumber = (typeof req.body.customerid === 'undefined') ? "" : req.body.customerid;
const validEmail = await Utils.validate(Utils.setValidation({email: req.body.email},{email: 'email|required|maxLength:50'}), 'email').catch(function(e) { result.msg = result.msg+e; });
const validFname = await Utils.validate(Utils.setValidation({name: req.body.fname},{name: 'minLength:2|required'}), 'name').catch(function(e) {
              result.msg = result.msg+e; });
if(!validEmail || !validFname || isNaN(department)){insertData = false;} 
if(insertData === true){
const usernameHash = Utils.encrypt (req.body.email.trim());
let exits = false; 
let customerid = 0; 
const userExits = await Db.query ("SELECT id, customerid, email, emailiv FROM customers");
if(typeof userExits === 'object' && userExits !== null && userExits.length > 0){   
        userExits.every(async function(arrayItem, index) {
          const decrypt = Utils.decrypt ({iv: arrayItem.emailiv, content: arrayItem.email});
          if (decrypt === req.body.email.trim()) { 
            exits = true; 
			customerid=arrayItem.id;
            return;
          } 
        }); //return result;
      } 
if(!exits){
addNewCustomer = await Db.dbUpdate("INSERT INTO customers (email, domain, name, customerid, emailiv) VALUES ("+con.escape(usernameHash.content.toLowerCase())+", "+con.escape(authBody[2])+","+con.escape(req.body.fname)+", "+con.escape(customerNumber)+", "+ con.escape(usernameHash.iv.toLowerCase()) +")");
	
const checkUser = await Db.query ("SELECT id FROM customers WHERE email="+con.escape(usernameHash.content.toLowerCase())+" AND emailiv="+con.escape(usernameHash.iv.toLowerCase())+" LIMIT 0,1");
customerid=checkUser[0].id;
}
	
const user = await Db.dbUpdate("INSERT INTO session (`customerref`, department, transid, domain) VALUES ("+con.escape(customerid)+", "+con.escape(req.body.department)+", "+con.escape(transid)+", "+con.escape(authBody[2])+")");
const getClientSocketId = await Db.dbUpdate("SELECT clientsocketid, id, uuid AS agentid FROM session WHERE status=13 AND customerref="+con.escape(customerid)+" AND transid="+con.escape(transid)+" ORDER BY id DESC LIMIT 0, 1");

  if(getClientSocketId.length > 0){
  result = {
    "status": 1,
    "msg": "Connecting, please wait ...",
    "clientsocketid": getClientSocketId[0].clientsocketid,
    "sessionId": getClientSocketId[0].id,
    "agentId": getClientSocketId[0].agentid
    }
    } 

  }
  
} // end request chat

       
if(parseInt(frmID) === 11){ //process get section id
  if(!req.body.sessionID ) { insertData = false; }
  if(insertData === true){   
  const status = await Db.dbUpdate("SELECT sectionid FROM session WHERE id="+con.escape(req.body.sessionID));
if(status.length > 0){
    result = { "status": status[0].sectionid, "msg": status[0].sectionid }}
      } 
        
    }//end check session status       
if(parseInt(frmID) === 4){ //process check session status
  if(!req.body.sessionId ) { msg = "Complete all required fields"; insertData = false; }
  if(insertData === true){   
  
  const status = await Db.dbUpdate("SELECT status FROM session WHERE id="+con.escape(req.body.sessionId));if(status.length > 0){
    result = { "status": status[0].status, "msg": "" }}
      } 
        
    }//end check session status  

    if(parseInt(frmID) === 5){ // process check queue
      if(typeof req.body.sessionId === 'undefined') { msg = "Complete all required fields"; insertData = false; }
      if(insertData){
      
      const queue = await Db.checkValue("SELECT id FROM session WHERE status = 13 AND id < "+con.escape(req.body.sessionId));
      result = {
        "status": 1,
        "queue": queue,
         "msg": "Your queue position: "+queue,
      
        }; }; } //end process check queue 

         
if(parseInt(frmID) === 6){ // process end chat by visitor
  if(typeof req.body.sessionId === 'undefined') { msg = "Complete all required fields"; insertData = false; }
  if(insertData){
  const endChat = await Db.dbUpdate("UPDATE session SET status = 5, endedby = 15 WHERE id = "+con.escape(req.body.sessionId));
  result = {
    "status": 1,
     "msg": ""
    };
    }; 
    } //end process end chat by visitor   
res.send(result);
return;
}// end base function 
exports.OfflineMsg = OfflineMsg;
exports.Upload = Upload;
exports.Login = Login;
exports.visitorUpload = visitorUpload;