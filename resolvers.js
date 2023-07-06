require('dotenv').config();
const Db = require('./db');
const Utils = require('./utils');
const prcLogin = require('./login');
const prcSetUp = require('./setup');
var mysql = require('mysql');
const fetch = require("node-fetch");
var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});
var agentInid = 0
var emptyResult = [{}];
async function checkUser(userToken){
let deocdeToken;
let result = {status:0, userId:null, domainName:null, typeId:null, useruuid:null}
if( deocdeToken = await prcLogin.DecodeJWT(userToken)){ result = deocdeToken; }
return result
}


async function getCurYear(){ 
let pair = await Db.query("SELECT id, inid FROM egp_fiscalyear  WHERE status=1 ORDER BY id DESC LIMIT 0,1"); 
if(pair.length > 0){ return ((typeof pair[0].inid !== 'undefined' && parseInt(pair[0].inid) > 0) ? pair[0].inid : pair[0].id); }
return 0;
}

async function getPairId(userid, recid){ 
if (userid !== "undefined" && recid !== "undefined" && (parseInt(userid) !== parseInt(recid))){ 
let pair = await Db.query("SELECT id FROM impair WHERE (recid = "+con.escape(userid)+" AND userid = "+con.escape(recid)+") OR (userid = "+con.escape(userid)+" AND recid = "+con.escape(recid)+")"); 
if(pair.length > 0){ return pair[0].id; }

if(pair.length === 0){
await Db.dbUpdate("INSERT INTO impair (userid, recid) VALUES ("+con.escape(userid)+", "+con.escape(recid)+")");
let getpair = await Db.query("SELECT id FROM impair WHERE (recid = "+con.escape(userid)+" AND userid = "+con.escape(recid)+") OR (userid = "+con.escape(userid)+" AND recid = "+con.escape(recid)+") ORDER BY id DESC LIMIT 0, 1"); 
if(getpair.length > 0){ return getpair[0].id; }
}} return false; }

async function getAllMsg(sessionID){
if (typeof sessionID !== "undefined"){ 
emptyResult =  await Db.query("SELECT postby AS s1itemId, msg AS s1description, uuid AS s1id FROM sessiontext WHERE sessionid=" + con.escape(sessionID)+ " ORDER BY id ASC");
} return emptyResult;}

async function getAgentDept(userId, domain, department){
let val = {total: 0, status: 0};	
let totalAgentDept = await Db.query("SELECT * FROM itemstatus WHERE status = 1 AND tbl = 14 AND editid = "+con.escape(userId));
let isDept = await Db.query("SELECT * FROM itemstatus WHERE status = 1 AND tbl = 14 AND rowid = "+con.escape(department)+" AND editid = "+con.escape(userId));

if(totalAgentDept.length > 0){ val.total = totalAgentDept.length;}
if(isDept.length > 0){ val.status = isDept.length;}
return val;
}

async function getTitle(sql){
	let agentname = await Db.query(sql);  
  if(agentname.length > 0){ return agentname[0].title; }
  return "";
}

var noSignIn = [{id:-11, title:"Error: "}];
module.exports = { 
Mutation: {
setUp: async (parent, args, context, info) => {
  let prc = await prcSetUp.setUp(args, context.req.get('origin'));
  return prc; //prc;
  },
addRecord: async (parent, args, context, info) => {
const UUID = Utils.UUID();
let result = {status:1, msg:"Error: ", itemId: 0, typeid:0, address:null}  
result.itemId = args.input.formid;
result.typeid = args.input.tbl;

if(parseInt(args.input.frmtype) === -12 || parseInt(args.input.formid) === -12){ // login
let prclogin = await prcLogin.Login(args, context);
  return prclogin;
}

if(context.req.headers.authorization === "Bearer none"){ return noSignIn;  } 
else {
let token = context.req.headers.authorization || ''; 
let auth = await checkUser(token);
if(!auth.status){  return noSignIn; }
if(await Utils.checkUserStatus(auth.userId) !== 1){return noSignIn;}
var checkSub = await Utils.checkSubscription(auth.domainName);


if(parseInt(args.input.formid) === 114 || parseInt(args.input.formid) === 112 || parseInt(args.input.formid) === 113 || parseInt(args.input.formid) === 118 || parseInt(args.input.formid) === 119){ // create egp law
   if (!args.input.description || args.input.description === '') {result.msg = result.msg+"Body, "; result.status = 0; }
  if(result.status === 0) {return result; }
  let update = await Db.dbUpdate("UPDATE egp_bpplaw SET status = 2 WHERE type = "+con.escape(parseInt(args.input.gender)));
  if(update){
  await Db.dbUpdate("INSERT INTO egp_bpplaw (userid, description, domain, type) VALUES ("+
  con.escape(auth.userId)+", "+con.escape(args.input.description)+", "+con.escape(auth.domainName)+", "+con.escape(args.input.gender)+")");
  result.status = 1; result.msg = "Saved"; return result;  }
  } // end egp law

if(parseInt(args.input.formid) === 94){ // create im
  if (!args.input.title || args.input.title === "") {result.msg = result.msg+"No recipient selected, "; result.status = 0; }
  if (!args.input.description || args.input.description === "") {result.msg = result.msg+"Please enter body content "; result.status = 0; }
  if(result.status === 0) {return result; } 
  let recs = args.input.title.split(',');
  if(Array.isArray(recs)){

for (let i = 0; i < recs.length; i++) {
if(!isNaN(recs[i]) && recs[i] !== "" && recs[i] !== null){ 
let pairId = await getPairId(auth.userId, recs[i]);
let copyIM = await Db.dbUpdate("INSERT INTO imslave (recid, userid, description, pairid) SELECT recid, userid, description, pairid FROM im WHERE im.status = 1 AND im.pairid =  "+con.escape(pairId));

if(copyIM){
let delIM = await Db.dbUpdate("DELETE FROM im WHERE pairid="+con.escape(pairId));
if(delIM){ await Db.dbUpdate("INSERT INTO im (userid, domain, recid, description, pairid) VALUES ("+con.escape(auth.userId)+", "+con.escape(auth.domainName)+", "+con.escape(recs[i])+", "+con.escape(args.input.description)+", "+con.escape(pairId)+")");}}

await Db.dbUpdate("INSERT INTO imslave (recid, userid, description, pairid) VALUES ("+con.escape(recs[i])+", "+con.escape(auth.userId)+", "+con.escape(args.input.description)+", "+con.escape(pairId)+")");

}}
//await Db.dbUpdate("UPDATE im SET inid = id WHERE inid = 0 AND userid = "+con.escape(auth.userId));
result.status = 1; result.msg = "Done"; return result; }
 } // end create im

if(parseInt(args.input.formid) === 100){ // create im reply
if (!args.input.tbl || args.input.tbl === "" || !args.input.planid || args.input.planid === "" || !args.input.rowid || args.input.rowid === "" || isNaN(args.input.tbl) || isNaN(args.input.planid) || isNaN(args.input.rowid)) {result.msg = result.msg+"Internal error! "; result.status = 0; }

if (!args.input.description || args.input.description === "") {result.msg = result.msg+"Please enter reply "; result.status = 0; }
if(result.status === 0) {return result; } 

//let copyIM = await Db.dbUpdate("INSERT INTO imslave (recid, userid, description, pairid) SELECT recid, userid, description, pairid FROM im WHERE im.status = 1 AND im.pairid =  "+con.escape(args.input.rowid));


//if(copyIM){
let delIM = await Db.dbUpdate("DELETE FROM im WHERE pairid="+con.escape(args.input.rowid));
if(delIM){ await Db.dbUpdate("INSERT INTO im (userid, domain, recid, description, pairid) VALUES ("+con.escape(auth.userId)+", "+con.escape(auth.domainName)+", "+con.escape(args.input.planid)+", "+con.escape(args.input.description)+", "+con.escape(args.input.rowid)+")");

await Db.dbUpdate("INSERT INTO imslave (recid, userid, description, pairid) VALUES ("+con.escape(args.input.planid)+", "+con.escape(auth.userId)+", "+con.escape(args.input.description)+", "+con.escape(args.input.rowid)+")");
}//}


result.status = 1; result.msg = "Done"; return result;
 } // end create im reply
 
 
if(parseInt(args.input.formid) === 7){ // reply offline msg 
  if (!args.input.description || args.input.description.trim() === '' || !args.input.zip || args.input.zip.trim() === '' || !args.input.fullname || args.input.fullname.trim() === '' || !args.input.id || isNaN(args.input.id)) {result.msg = result.msg+"Internal error, "; result.status = 0; }
  if(result.status === 0) {return result; }
 await Db.dbUpdate("INSERT INTO offlinemsgreply (userid, description, msgid) VALUES ("+ con.escape(auth.userId)+", "+con.escape(args.input.description)+", "+con.escape(args.input.id)+")");
 await Db.dbUpdate("INSERT INTO itemstatus (userid, tbl, domain, rowid, editid) VALUES ("+ con.escape(auth.userId)+", 7, "+con.escape(auth.domainName.toLowerCase())+", "+con.escape(args.input.id)+", "+con.escape(auth.userId)+")");

//let recEmail = await Db.query("SELECT department FROM offlinemsg WHERE id = "+con.escape(parseInt(args.input.id))+" ORDER BY id DESC LIMIT 0, 1"); 

//let subject = await getTitle("SELECT title FROM department WHERE status = 1 AND (id = "+con.escape(parseInt(recEmail[0].department))+" OR inid = "+con.escape(parseInt(recEmail[0].department)));
let sendMail = false;
if(!sendMail){ sendMail = true; }
result.status = 1; result.msg = "Reply sent!"; return result;   
  } // end reply offline msg
if(parseInt(args.input.formid) === 89){ // accept / reject transfer  
if (!args.input.planid || !args.input.id || !args.input.country || !args.input.rowid || isNaN(args.input.rowid) || isNaN(args.input.planid) || isNaN(args.input.id)) {result.msg = result.msg+"Internal error, "; result.status = 0; }
if(result.status === 0) {return result; }

let status = await Db.query("SELECT id FROM transfers WHERE id="+con.escape(args.input.id)+" AND status = 1 ORDER BY id DESC LIMIT 0, 1");

if(status.length > 0){
if(parseInt(args.input.planid) === 1){  
await Db.dbUpdate("UPDATE transfers SET status = 2 WHERE id = "+con.escape(args.input.id));
await Db.dbUpdate("UPDATE session SET userid = "+con.escape(auth.userId)+", sectionid="+con.escape(args.input.country)+" WHERE id = "+con.escape(args.input.rowid));}
if(parseInt(args.input.planid) === 2){   await Db.dbUpdate("UPDATE transfers SET status = 8 WHERE id = "+con.escape(args.input.id));  }}
result.status = 1; result.msg = "Done"; return result;   
  } // end accept / reject transfer
if(auth.typeId === 1){ // applies to admin  only
if(parseInt(args.input.formid) === 95){ // create agent
  
}
if(parseInt(args.input.frmtype) === 1 && parseInt(args.input.formid) === 2){ // create agent
let sendMail = false;
		if (!args.input.username || args.input.username === '') {
            result.msg = result.msg+"Username, "; result.status = 0; }
          if (!args.input.gender || args.input.gender === '') { 
            result.msg = result.msg+"Gender, "; result.status = 0; }
          if (!args.input.fullname || args.input.fullname === '') { 
            result.msg = result.msg+"Fullname "; result.status=0; }
          if(args.input.fullname){
            const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:3|required'}), 'fullname').catch(function(e) {
              result.msg = result.msg+e; });
              if(!minFullname){result.status = 0; }}
          if(result.status === 0) {return result; }
          
        const email = args.input.username.split('@');
        const emailDomain = email[1].trim();
    /*    if (emailDomain.toLowerCase() !== auth.domainName.toLowerCase()) { 
          result.msg = result.msg+"Email address "+args.input.username+" does match domain name: "+auth.domainName+'. '+
        "Use email address from the same domain"; 
        result.status = 0;
       return result;
      }
     */
      const userExits = await Db.query ("SELECT id, typeid, username, usernameiv, status FROM user");
      if(typeof userExits === 'object' && userExits !== null && userExits.length > 0){   
        result.status = 1;         
        userExits.every(async function(arrayItem, index) {
          const decrypt = Utils.decrypt ({iv: arrayItem.usernameiv, content: arrayItem.username});
          //compareResult = Utils.SY_compareHash (args.input.username, arrayItem.username)
          if (decrypt === args.input.username.toLowerCase()) { 
            result.msg = 'Username has already been used '
            result.status = 0; 
            return result;
          } 
        }); //return result;
      } 
   if(result.status === 0){return result;}
       const usernameHash = Utils.encrypt (args.input.username.toLowerCase());
       const user = await Db.dbUpdate("INSERT INTO user (userid, username, typeid, tmpuuid, usernameiv) VALUES ("+
        con.escape(auth.userId)+", "+con.escape(usernameHash.content.toLowerCase())+", "+con.escape(2)+", "+con.escape(UUID)+", "+con.escape(usernameHash.iv.toLowerCase())+")");

        let userId = await Db.query("SELECT id, uuid FROM user WHERE tmpuuid="+con.escape(UUID)+" ORDER BY id DESC LIMIT 0, 1");
        var listItems = null;
        var listUUID;
        var newUUID;
        var newUserId;
        if (userId) {  
          const numbers = userId; 
          listItems = numbers.map(number => number.id); 
          listUUID = numbers.map(number => number.uuid);
          newUserId = parseInt(listItems[0]);
          newUUID = listUUID[0]; }
        

const userprofile = await Db.dbUpdate("INSERT INTO useprofile (userid, fullname, gender, uuid) VALUES ("+
con.escape(newUserId)+", "+con.escape(args.input.fullname)+", "+
con.escape(parseInt(args.input.gender))+", "+con.escape(newUUID)+")");

Db.itemStatus (2, con.escape(newUserId), 1, auth.userId, "", 0);


//result.status = 1;
//result.msg = "Account activation email sent.";
//let otpNumber = Utils.genOTP();
//let setOTP = await Db.dbUpdate("UPDATE otp SET status = 2 WHERE userid = "+con.escape(newUserId));
//if(setOTP){await Db.dbUpdate("INSERT INTO otp (userid, title) VALUES ("+con.escape(newUserId)  +", "+con.escape(otpNumber)+")");}

if(!sendMail){
sendMail = true;

result.status = 1; result.msg = `Notification email has been to the username.`; 
}
		
    } // end create agent
 if(parseInt(args.input.formid) === 67){ // process support / feedback form
 if (!args.input.title || args.input.title === '') {result.msg = result.msg+"Title, "; result.status = 0; }
if (!args.input.gender || !parseInt(args.input.gender)) {result.msg = result.msg+"Category, "; result.status = 0; }
if (!args.input.description || args.input.description === '') {result.msg = result.msg+"description "; result.status=0; }
//result.status = 1; result.msg = "Message Submitted"; return result;

 }
    if(parseInt(args.input.formid) === 137){ // create fiscal year
if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
        //parseInt(args.input.frmtype) === 1 &&  // use to check whether new or edit
      
if (!args.input.fullname || args.input.fullname.length !== 4 || args.input.fullname === '' || isNaN(args.input.fullname)) {
result.msg = result.msg+"Invalid: Title must be valid year, "; result.status = 0; }

if(args.input.fullname){
const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
  result.msg = result.msg+e; });
  if(!minFullname){result.status = 0; }}

if(result.status === 0) {return result; }
if(parseInt(args.input.id) !== 25){
if(args.input.frmtype === 1){
const titleExists = await Db.checkValue("SELECT status FROM egp_fiscalyear WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
    if(titleExists > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  }  

   if(args.input.frmtype === 2){
    const titleExists = await Db.checkValue("SELECT status FROM egp_fiscalyear WHERE (status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND inid <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
  if(titleExists > 0){
     result.msg = 'Title exits'
    result.status = 0; 
     return result;
    }
    await Db.dbUpdate("UPDATE egp_fiscalyear SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
  }  
  if(result.status === 0){return result;}
 
  //if(args.input.frmtype === 1){
    const department = await Db.dbUpdate("INSERT INTO egp_fiscalyear (userid, title, inid, startdate, enddate) VALUES ("+
      con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+con.escape(args.input.id)+", "+con.escape(args.input.zip)+", "+con.escape(args.input.address)+")");
  //}
}

      result.status = 1;
      result.msg = "Done";
    } // end create fiscal year
if(parseInt(args.input.formid) === 12 || parseInt(args.input.formid) === 147){ // create department

if (!args.input.fullname || args.input.fullname === '') {
result.msg = result.msg+"Title, "; result.status = 0; }

if (!args.input.description || args.input.description === '') { 
result.msg = result.msg+"Description, "; result.status = 0; }

if(args.input.fullname){
const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
  result.msg = result.msg+e; });
  if(!minFullname){result.status = 0; }}

if(result.status === 0) {return result; }
if(parseInt(args.input.id) !== 25){
if(args.input.frmtype === 1){
const titleExists = await Db.checkValue("SELECT status FROM record WHERE status = 1 AND title = "+con.escape(args.input.fullname)+" AND type="+con.escape(parseInt(args.input.formid))+" LIMIT 0, 1")
    if(titleExists > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  }  

   if(args.input.frmtype === 2){
    const titleExists = await Db.checkValue("SELECT status FROM record WHERE (type="+con.escape(parseInt(args.input.formid))+" AND status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND inid <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
  if(titleExists > 0){
     result.msg = 'Title exits'
    result.status = 0; 
     return result;
    }
    await Db.dbUpdate("UPDATE record SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
  }  
  if(result.status === 0){return result;}
 
  //if(args.input.frmtype === 1){
    const department = await Db.dbUpdate("INSERT INTO record (userid, title, description, type, inid) VALUES ("+
      con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
      con.escape(args.input.description)+", "+con.escape(parseInt(args.input.formid))+", "+con.escape(parseInt(args.input.id))+")");
  //}
}

      result.status = 1;
      result.msg = "Done";
    } // end create department
	
if(parseInt(args.input.formid) === 140){ // create intent to award
if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
if (!args.input.description || args.input.description === "") {
result.msg = result.msg+"Body, "; result.status = 0; }
if(result.status === 0) {return result; }   
let updateDate = await Db.dbUpdate("UPDATE egp_intent SET status = 2 WHERE planid = "+con.escape(parseInt(args.input.id)));
if(updateDate){
const department = await Db.dbUpdate("INSERT INTO egp_intent (userid, planid, description) VALUES ("+con.escape(auth.userId)+", "+con.escape(args.input.id)+", "+con.escape(args.input.description)+")");
}      result.status = 1;
result.msg = "Done";
} // end create intent to award


    if(parseInt(args.input.formid) === 110){ // create news
      if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
              //parseInt(args.input.frmtype) === 1 &&  // use to check whether new or edit
            
      if (!args.input.fullname || args.input.fullname === '') {
      result.msg = result.msg+"Title, "; result.status = 0; }
      
      if (!args.input.description || args.input.description === '') { 
      result.msg = result.msg+"Body, "; result.status = 0; }
      
      if(args.input.fullname){
      const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
        result.msg = result.msg+e; });
        if(!minFullname){result.status = 0; }}
      
      if(result.status === 0) {return result; }
      if(parseInt(args.input.id) !== 25){    
      
         if(args.input.frmtype === 2){
        await Db.dbUpdate("UPDATE egp_news SET status = 2 WHERE (id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+")");
        }  
       
        //if(args.input.frmtype === 1){
          const department = await Db.dbUpdate("INSERT INTO egp_news (userid, title, description, inid, typeid) VALUES ("+
            con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
            con.escape(args.input.description)+", "+con.escape(args.input.id)+", "+con.escape(args.input.planid)+")");
        //}
      }
      
            result.status = 1;
            result.msg = "Done";
          } // end create news
    if(parseInt(args.input.formid) === 106){ // create agency
      if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
              //parseInt(args.input.frmtype) === 1 &&  // use to check whether new or edit
            
      if (!args.input.fullname || args.input.fullname === '') {
      result.msg = result.msg+"Title, "; result.status = 0; }
      
      if (!args.input.description || args.input.description === '') { 
      result.msg = result.msg+"Description, "; result.status = 0; }
      
      if(args.input.fullname){
      const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
        result.msg = result.msg+e; });
        if(!minFullname){result.status = 0; }}
      
      if(result.status === 0) {return result; }
      if(parseInt(args.input.id) !== 25){
      if(args.input.frmtype === 1){
      const titleExists = await Db.checkValue("SELECT status FROM egp_agency WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
          if(titleExists > 0){
            result.msg = 'Agency exits'
            result.status = 0; 
            return result;
          }  }  
      
         if(args.input.frmtype === 2){
          const titleExists = await Db.checkValue("SELECT status FROM egp_agency WHERE (status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND inid <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
        if(titleExists > 0){
           result.msg = 'Agency exits'
          result.status = 0; 
           return result;
          }
          await Db.dbUpdate("UPDATE egp_agency SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
        }  
        if(result.status === 0){return result;}
       
        //if(args.input.frmtype === 1){
          const department = await Db.dbUpdate("INSERT INTO egp_agency (userid, title, description, officer, inid) VALUES ("+
            con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
            con.escape(args.input.description)+", "+con.escape(args.input.city)+", "+con.escape(args.input.id)+")");
        //}
      }
      result.status = 1;
      result.msg = "Done";
    } // end create agency
       
  
    if(parseInt(args.input.formid) === 105){ // create project
      if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
              //parseInt(args.input.frmtype) === 1 &&  // use to check whether new or edit
            
if (!args.input.fullname || args.input.fullname === '') { result.msg = result.msg+"Title, "; result.status = 0; }
if (!args.input.total || isNaN(parseInt(args.input.total))) { result.msg = result.msg+"Fiscal Year, "; result.status = 0; }

if (!args.input.description || args.input.description === '') { result.msg = result.msg+"Description, "; result.status = 0; }
      
      if(args.input.fullname){
      const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
        result.msg = result.msg+e; });
        if(!minFullname){result.status = 0; }}
      
      if(result.status === 0) {return result; }
      if(parseInt(args.input.id) !== 25){
      if(args.input.frmtype === 1){
      const titleExists = await Db.checkValue("SELECT status FROM egp_project WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
          if(titleExists > 0){
            result.msg = 'Project exits'
            result.status = 0; 
            return result;
          }  }  
      
         if(args.input.frmtype === 2){
          const titleExists = await Db.checkValue("SELECT status FROM egp_project WHERE (status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND inid <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
        if(titleExists > 0){
           result.msg = 'Project exits'
          result.status = 0; 
           return result;
          }
          await Db.dbUpdate("UPDATE egp_project SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
        }  
        if(result.status === 0){return result;}
       
        //if(args.input.frmtype === 1){
          const department = await Db.dbUpdate("INSERT INTO egp_project (userid, title, description, inid, govt, bank, fiscalyear, disbursed, total, agreementno) VALUES ("+
            con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
            con.escape(args.input.description)+", "+con.escape(args.input.id)+", "+con.escape(args.input.city)+", "+con.escape(args.input.stringfour)+", "+con.escape(parseInt(args.input.total))+", "+con.escape(args.input.address)+", "+con.escape(args.input.zip)+", "+con.escape(args.input.province)+")");
        //}
      }
      result.status = 1;
      result.msg = "Done";
    } // end create project
      
      
   if(parseInt(args.input.formid) === -85){ // create new version seen
      if (!args.input.title || args.input.title === '') {  result.status = 0; return result; }
  const department = await Db.dbUpdate("INSERT INTO versionseen (userid, version, domain) VALUES ("+con.escape(auth.userId)+", "+con.escape(args.input.title)+", "+con.escape(auth.domainName)+")");

    result.status = 1;
    result.msg = "Done";
  } // end new version seen

if(parseInt(args.input.formid) === 27){ // create filerepo
let mediafile = 0;
if(checkSub.status === false){result.status = 0; result.msg = "Subscription Required "; return result;}
     let filerepoId = args.input.id
if (!args.input.fullname || args.input.fullname === '') { result.msg = result.msg+"Title, "; result.status = 0; }
if (!args.input.planid || isNaN(parseInt(args.input.planid))) { result.msg = result.msg+"Repo Type, "; result.status = 0; }

if (!args.input.description || args.input.description === '') { 
result.msg = result.msg+"Description, "; result.status = 0; }

if(args.input.fullname){
const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
  result.msg = result.msg+e; });
  if(!minFullname){result.status = 0; }}

if(result.status === 0) {return result; }

if(args.input.frmtype === 1){
const titleExists = await Db.checkValue("SELECT status FROM filerepo WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
    if(titleExists > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  }  

   if(args.input.frmtype === 2){
    filerepoId === args.input.id;
    const titleExists = await Db.checkValue("SELECT status FROM filerepo WHERE (status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND inid <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
    if(titleExists > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  
    await Db.dbUpdate("UPDATE filerepo SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
  }
  if(result.status === 0){return result;}
 
  //if(args.input.frmtype === 1){
    const department = await Db.dbUpdate("INSERT INTO filerepo (userid, title, description, domain, inid, mediafile, typeid) VALUES ("+
      con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
      con.escape(args.input.description)+", "+con.escape(auth.domainName)+", "+con.escape(filerepoId)+", "+con.escape(mediafile)+", "+con.escape(args.input.planid)+")");
  //}
  

      result.status = 1;
      result.msg = "Done";
  } // end create filerepo



if(parseInt(args.input.formid) === 78 || parseInt(args.input.formid) === 79 || parseInt(args.input.formid) === 81){ // create video conf
let conftype = "video";
if(args.input.formid === 79){ conftype = "podcast";}
if(args.input.formid === 81){ conftype = "webinar";}
let filerepoId = args.input.id
if (!args.input.fullname || args.input.fullname === '') {result.msg = result.msg+"Title, "; result.status = 0; }

if (!args.input.city || args.input.city === '') {result.msg = result.msg+"Mode, "; result.status = 0; }

if (!args.input.zip || args.input.zip === '') {result.msg = result.msg+"Date, "; result.status = 0; }

if (!args.input.total || args.input.total === '') {result.msg = result.msg+"Time Zone, "; result.status = 0; }

if (!args.input.address || args.input.address === '') {result.msg = result.msg+"Start time, "; result.status = 0; }

if (!args.input.phone || args.input.phone === '') {result.msg = result.msg+"Duration, "; result.status = 0; }

if (!args.input.country || args.input.country === '') {result.msg = result.msg+"Recording, "; result.status = 0; }

if (!args.input.description || args.input.description === '') { result.msg = result.msg+"Description, "; result.status = 0; }

if(args.input.fullname){
const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
  result.msg = result.msg+e; });
  if(!minFullname){result.status = 0; }}

if(result.status === 0) {return result; }

if(args.input.frmtype === 1){
const titleExists = await Db.checkValue("SELECT status FROM videoconf WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
    if(titleExists > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  }  

   if(args.input.frmtype === 2){
    filerepoId === args.input.id;
    const titleExists = await Db.checkValue("SELECT status FROM videoconf WHERE (status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND inid <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
    if(titleExists.length > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  
    await Db.dbUpdate("UPDATE videoconf SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
  }
  if(!Utils.isBeforeToday(args.input.zip)){result.msg = 'Date cannot be below the current date!'
  result.status = 0; 
  return result;}
  if(result.status === 0){return result;}
 
  //if(args.input.frmtype === 1){
await Db.dbUpdate("INSERT INTO videoconf (userid, title, description, domain, inid, conftype, starttime, duration, startdate, timezone, record, mode ) VALUES ("+
con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
con.escape(args.input.description)+", "+con.escape(auth.domainName)+", "+con.escape(filerepoId)+", "+con.escape(conftype)+", "+con.escape(args.input.address)+", "+con.escape(args.input.phone)+", "+con.escape(args.input.zip)+", "+con.escape(args.input.total)+", "+con.escape(args.input.country)+", "+con.escape(args.input.city)+")");
//}
  
//create conf url
if(args.input.frmtype === 1){
const getConfId = await Db.dbUpdate("SELECT id, inid FROM videoconf WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+")) LIMIT 0, 1")
if(getConfId.length > 0){ 
let tmpId = getConfId[0].id; 
await Db.dbUpdate("INSERT INTO confurl (confid) VALUES ("+
con.escape(parseInt(tmpId))+")");
 }}
result.status = 1;
result.msg = "Done";
} // end create video conf
  

if(parseInt(args.input.formid) === -5){ // create participants
const nopartcipant = await Db.query ("SELECT id FROM videoconfparticipants WHERE status = 1 AND  videoconfid = "+con.escape(parseInt(args.input.rowid)));  
if(checkSub.status === false && nopartcipant.length > 0){	result.status = 0; result.msg = "Subscription Required for more participants"; return result;}
if(nopartcipant.length > 28){	result.status = 0; result.msg = "Maximum Thirty (30) participants reached"; return result;}
if (!args.input.fullname || args.input.fullname === '') { result.msg = result.msg+"Name, "; result.status = 0; }
if (!args.input.country || args.input.country === '') { result.msg = result.msg+"Unknown error!, "; result.status = 0; }

if (!args.input.description || args.input.description === '') { result.msg = result.msg+"Email, "; result.status = 0; }
if (!args.input.rowid || args.input.rowid === '') { result.msg = result.msg+"Unknown error!, "; result.status = 0; }
if (!args.input.tbl || args.input.tbl === '') { result.msg = result.msg+"Unknown error!, "; result.status = 0; }
if(result.status === 0) {return result; } 

const validEmail = await Utils.validate(Utils.setValidation({email: args.input.description.trim()},{email: 'email|required|maxLength:100'}), 'email').catch(function(e) {
result.msg = result.msg+e; result.status = 0;});
if(!validEmail){ result.status = 0;}
if(result.status === 0) {return result; }      


//if(noPart > 1){result.msg = "Subscription required for more than two (2) participants"; result.status = 0;	}if(result.status === 0) {return result; }      
const usernameHash = Utils.encrypt (args.input.description.trim());
let exits = 1; 
const userExits = await Db.query ("SELECT id, email, emailiv FROM videoconfparticipants WHERE status = 1 AND videoconfid = "+con.escape(parseInt(args.input.rowid)));
if(typeof userExits === 'object' && userExits !== null && userExits.length > 0){
        userExits.every(async function(arrayItem, index) {
          const decrypt = Utils.decrypt ({iv: arrayItem.emailiv, content: arrayItem.email});
          if (decrypt === args.input.description.trim()) { 
            exits = 0; 
            return;
          } 
        }); //return result;
      } 
if(exits === 0) {result.msg = result.msg+"Email already added";  result.status = 0}      
if(result.status === 0) {return result; }      
if(exits === 1){
await Db.dbUpdate("INSERT INTO videoconfparticipants (email, title, videoconfid, emailiv, mode) VALUES ("+con.escape(usernameHash.content.toLowerCase())+", "+con.escape(args.input.fullname)+","+con.escape(parseInt(args.input.rowid))+", "+ con.escape(usernameHash.iv.toLowerCase())+", "+ con.escape(parseInt(args.input.country))+")");
}
result.status = 1;
result.msg = "Done";
} // end create participants


if(parseInt(args.input.formid) === 28){ // create firewall
//if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
      if (!args.input.fullname || args.input.fullname === '') {
        result.msg = result.msg+"I.P. Address, "; result.status = 0; }
    
      if (!args.input.description || args.input.description === '') { 
        result.msg = result.msg+"Description, "; result.status = 0; }
    
       if(args.input.fullname){
        const minFullname = await Utils.validate(Utils.setValidation({IP: args.input.fullname},{IP: 'ip|required'}), 'IP').catch(function(e) {
          result.msg = result.msg+e; });
          if(!minFullname){result.status = 0; }}
    
        const maxDescription = await Utils.validate(Utils.setValidation({Description: args.input.description},{Description: 'maxLength:500|required'}), 'Description').catch(function(e) {
          result.msg = result.msg+", "+e; });
    
          if(!maxDescription){result.status = 0; }
    
      if(result.status === 0) {return result; }      

  if(args.input.frmtype === 1){
    const titleExists = await Db.checkValue("SELECT status FROM firewall WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
if(titleExists > 0){
result.msg = 'I.P. Address exits'
result.status = 0; 
return result;
}  }  


if(args.input.frmtype === 2){
  const titleExists = await Db.checkValue("SELECT status FROM firewall WHERE (status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
  if(titleExists > 0){
    result.msg = 'Firewall exits'
    result.status = 0; 
    return result;
  }  
  await Db.dbUpdate("UPDATE firewall SET status = 2 WHERE (id = "+con.escape(parseInt(args.input.id))+")");
}

if(result.status === 0){return result;}
const department = await Db.dbUpdate("INSERT INTO firewall (userid, title, description, domain, inid) VALUES ("+
con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
con.escape(args.input.description)+", "+con.escape(auth.domainName)+", "+con.escape((typeof args.input.id !== 'undefined') ? parseInt(args.input.id) : 0)+")");
//}
result.status = 1;
result.msg = "Done";
  } // end create firewall


if(parseInt(args.input.formid) === 72){ // enter offline message
//if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
      if (!args.input.description || args.input.description === '') {
        result.msg = result.msg+" Please enter a message, "; result.status = 0; }
      
        const maxDescription = await Utils.validate(Utils.setValidation({Description: args.input.description},{Description: 'maxLength:200|required'}), 'Description').catch(function(e) {
          result.msg = result.msg+", "+e; });
    
          if(!maxDescription){result.status = 0; }
    
      if(result.status === 0) {return result; }      

  await Db.dbUpdate("UPDATE offlinetext SET status = 2 WHERE status =1");

await Db.dbUpdate("INSERT INTO offlinetext (userid, description, domain) VALUES ("+
con.escape(auth.userId)+", "+con.escape(args.input.description)+", "+con.escape(auth.domainName)+")");
//}
result.status = 1;
result.msg = "Done";
  } // end enter offline message

if(parseInt(args.input.formid) === 74){ // enter connection form title
if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
      if (!args.input.description || args.input.description === '') {
        result.msg = result.msg+" Please enter a message, "; result.status = 0; }
      
        const maxDescription = await Utils.validate(Utils.setValidation({Description: args.input.description},{Description: 'maxLength:200|required'}), 'Description').catch(function(e) {
          result.msg = result.msg+", "+e; });
    
          if(!maxDescription){result.status = 0; }
    
      if(result.status === 0) {return result; }      

  await Db.dbUpdate("UPDATE connectionfrmtext SET status = 2 WHERE status =1");

await Db.dbUpdate("INSERT INTO connectionfrmtext (userid, description, domain) VALUES ("+
con.escape(auth.userId)+", "+con.escape(args.input.description)+", "+con.escape(auth.domainName)+")");
//}
result.status = 1;
result.msg = "Done";
  } // end enter connection form title

if(parseInt(args.input.formid) === 30){ // create subscription
if (!args.input.fullname || args.input.fullname === '') {result.msg = result.msg+"Title, "; result.status = 0; }
if (!args.input.planid || args.input.planid === '') {result.msg = result.msg+"Subscription Plan, "; result.status = 0; }
if(isNaN(parseInt(args.input.country)) || parseInt(args.input.country) > 20){result.status = 0; result.msg = result.msg+"Number of Agents is invalid";}
if(isNaN(parseInt(args.input.planid))){result.status = 0; result.msg = result.msg+"Subscription Plan is invalid";}

if(result.status === 0) {return result; }


if(args.input.frmtype === 1){
const titleExists = await Db.checkValue("SELECT status FROM subscription WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
    if(titleExists > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  }  


if(args.input.frmtype === 2){
    const titleExists = await Db.checkValue("SELECT status FROM subscription WHERE (status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND inid <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
    if(titleExists > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  
    await Db.dbUpdate("UPDATE subscription SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
  }
  if(result.status === 0){return result;}

 //if(args.input.frmtype === 1){
await Db.dbUpdate("INSERT INTO subscription (userid, title, description, domain, planid, seats, inid, duration) VALUES ("+
      con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
      con.escape(args.input.description)+", "+con.escape(auth.domainName)+", "+con.escape(1)+", "+con.escape(args.input.country)+", "+con.escape((typeof args.input.id !== 'undefined') ? parseInt(args.input.id) : 0)+", "+con.escape(args.input.planid)+")");
  //}
  

      result.status = 1;
      result.msg = "Done";	        return result;  
  } // end create subscription

  

 if(parseInt(args.input.formid) === 62){ // create about
          //parseInt(args.input.frmtype) === 1 &&  // use to check whether new or edit
  if (!args.input.fullname || args.input.fullname === '') {
  result.msg = result.msg+"Title, "; result.status = 0; }
  
  if (!args.input.description || args.input.description === '') { 
  result.msg = result.msg+"Description, "; result.status = 0; }
  
  if(args.input.fullname){
  const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
    result.msg = result.msg+e; });
    if(!minFullname){result.status = 0; }}  
  if(result.status === 0) {return result; }
  
  if(args.input.frmtype === 1){
  const titleExists = await Db.checkValue("SELECT status FROM department WHERE (status = 1 AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
      if(titleExists > 0){
        result.msg = 'Department exits'
        result.status = 0; 
        return result;
      }  }  
  
     if(args.input.frmtype === 2){
      agentInid === args.input.id;
      const titleExists = await Db.checkValue("SELECT status FROM department WHERE (status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
      if(titleExists > 0){
        result.msg = 'Department exits'
        result.status = 0; 
        return result;
      }  
      await Db.dbUpdate("UPDATE department SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
    }
    if(result.status === 0){return result;}
   
    //if(args.input.frmtype === 1){
      const department = await Db.dbUpdate("INSERT INTO department (userid, title, description, domain, inid) VALUES ("+
        con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
        con.escape(args.input.description)+", "+con.escape(auth.domainName)+", "+con.escape(agentInid)+")");
    //}
    
  
        result.status = 1;
        result.msg = "Done"; 
  } // end create about
  // update item status 
      } // end applies to admin

if(parseInt(args.input.frmtype) === 2 && parseInt(args.input.formid) === -3){
	console.log('item status');
var { tbl, rowid, itemstatus, id = 0 } = args.input;
if((id === 0 || id === "undefined"|| id === "") && parseInt(tbl) === 94){id = auth.userId;}
if(parseInt(tbl) !== 57){
Db.itemStatus (tbl, rowid, itemstatus, auth.userId, auth.domainName, id);
result.status = 1;
result.msg = "Done";
}
return result;  
}

if(parseInt(args.input.formid) === 104){ // create pp
if(checkSub.status === false){	result.status = 0; result.msg = "Subscription Required "; return result;}
if (!args.input.planstate || isNaN(parseInt(args.input.planstate))) {
result.msg = result.msg+"Internal error: C01, "; result.status = 0; }
if (parseInt(args.input.planstate) === 1) {
           //parseInt(args.input.frmtype) === 1 &&  // use to check whether new or edit
      if (!args.input.fullname || args.input.fullname === '') {
      result.msg = result.msg+"Title, "; result.status = 0; }
      
      if (!args.input.planid || isNaN(parseInt(args.input.planid))) { 
      result.msg = result.msg+"Project, "; result.status = 0; }
	  
      if (!args.input.total || isNaN(parseInt(args.input.total))) { 
      result.msg = result.msg+"Procuring Entity, "; result.status = 0; }
	  
      if (!args.input.gender || isNaN(parseInt(args.input.gender))) { 
      result.msg = result.msg+"Solicitation, "; result.status = 0; }
	  
	   if (!args.input.country || isNaN(parseInt(args.input.country))) { 
      result.msg = result.msg+"Type, "; result.status = 0; }
	  
	       
      if(args.input.fullname){
      const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) { result.msg = result.msg+e; });
        if(!minFullname){result.status = 0; }}      
      if(result.status === 0) {return result; }   
	  
	    if(args.input.frmtype === 2){
    await Db.dbUpdate("UPDATE egp_plan SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
  }  
  if(result.status === 0){return result;}
  
      
        
        //if(args.input.frmtype === 1){
          const department = await Db.dbUpdate("INSERT INTO egp_plan (userid, title, description, projectid, inid, solicitationid, type, entityid, planstatus) VALUES ("+
            con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
            con.escape(args.input.description)+", "+con.escape(args.input.planid)+", "+con.escape(args.input.id)+", "+con.escape(args.input.gender)+", "+con.escape(args.input.country)+", "+con.escape(args.input.total)+", "+con.escape(args.input.status)+")");
        //}
} 
if (parseInt(args.input.planstate) === 5) {
if (!args.input.zip || isNaN(parseInt(args.input.zip))) {
result.msg = result.msg+"Percentage Completion, "; result.status = 0; }
if(result.status === 0) {return result; }   
let updateDate = await Db.dbUpdate("UPDATE egp_progress SET status = 2 WHERE planid = "+con.escape(parseInt(args.input.id)));
if(updateDate){
const department = await Db.dbUpdate("INSERT INTO egp_progress (userid, planid, progress, inid, amount) VALUES ("+
con.escape(auth.userId)+", "+con.escape(args.input.id)+", "+con.escape(args.input.zip)+", "+con.escape(args.input.id)+", "+con.escape(args.input.stringsix)+")");
}}

if (parseInt(args.input.planstate) === 3) {
let title= "Intent To Award";
if (!args.input.password || args.input.password === "") { result.msg = result.msg+"Body, "; result.status = 0; return result; }
if (args.input.string12 && !isNaN(parseInt(args.input.string12))) { 
if (parseInt(args.input.string12) === 2) { title= "Bid Opening"; }
if (parseInt(args.input.string12) === 3) { 
title= args.input.string13.trim();

if (args.input.string13.trim() === "") { 
result.msg = result.msg+"Title, "; 
result.status = 0; 
return result;
}}



}

let updateDate = await Db.dbUpdate("UPDATE egp_intent SET status = 2 WHERE planid = "+con.escape(parseInt(args.input.id)));
if(updateDate){
await Db.dbUpdate("INSERT INTO egp_intent (userid, planid, description, title) VALUES ("+
con.escape(auth.userId)+", "+con.escape(args.input.id)+", "+con.escape(args.input.password)+", "+con.escape(title)+")");
}}


if (parseInt(args.input.planstate) === 2) { 
if (!args.input.domain || args.input.domain === "" || !args.input.province || args.input.province === "") { result.msg = result.msg+"Date error, "; result.status = 0; return result; }
if (!args.input.description || args.input.description === "") { result.msg = result.msg+"Details, "; result.status = 0; return result; }
let updateDate = await Db.dbUpdate("UPDATE egp_bidding SET status = 2 WHERE planid = "+con.escape(parseInt(args.input.id)));
await Db.dbUpdate("UPDATE itemstatus SET status = 2 WHERE tbl = 104 AND rowid= "+con.escape(parseInt(args.input.id)));
if(updateDate){
await Db.dbUpdate("INSERT INTO egp_bidding (userid, planid, description, startdate, enddate, starttime, endtime) VALUES ("+con.escape(auth.userId)+", "+con.escape(args.input.id)+", "+con.escape(args.input.description)+", "+con.escape(args.input.stringeigth)+", "+con.escape(args.input.province)+", "+con.escape(args.input.city)+", "+con.escape(args.input.stringnine)+")");

let myStr = args.input.stringone;
let strArray = myStr.split(",");
for(var i = 0; i < strArray.length; i++){
if(args.input.stringone !== "" && strArray.length > 0){
await Db.dbUpdate("INSERT INTO itemstatus (userid, rowid, tbl, editid) VALUES ("+con.escape(auth.userId)+", "+con.escape(args.input.id)+", "+con.escape(104)+", "+con.escape(strArray[i])+")");}
}
    

}
}

if (parseInt(args.input.planstate) === 4) { 
if (!args.input.stringseven || args.input.stringseven === "") { result.msg = result.msg+"Award date, "; result.status = 0; return result; }
if (!args.input.stringthree || args.input.stringthree === '') { result.msg = result.msg+"Awarded to, "; result.status = 0; }
if(result.status === 0){return result;}
let updateDate = await Db.dbUpdate("UPDATE egp_award SET status = 2 WHERE planid = "+con.escape(parseInt(args.input.id)));
if(updateDate && parseInt(args.input.stringthree) !== 0){
await Db.dbUpdate("INSERT INTO egp_award (userid, planid, awarddate, awardedto, effectivedate, completiondate, amount, actualcompletion) VALUES ("+con.escape(auth.userId)+", "+con.escape(args.input.id)+", "+con.escape(args.input.stringseven)+", "+con.escape(args.input.stringthree)+", "+con.escape(args.input.stringone)+", "+con.escape(args.input.stringtwo)+", "+con.escape(args.input.stringfour)+", "+con.escape(args.input.stringfive)+")");
}}


result.status = 1;
result.msg = "Done";
} // end create pp

if(parseInt(args.input.formid) === 24){
// update agent availability
const { tbl, rowid, itemstatus, id = 0 } = args.input;
Db.itemStatus (tbl, auth.userId, itemstatus, auth.userId, auth.domainName, auth.userId);
result.status = 1;
result.msg = "Done";
return result;         
}

if(parseInt(args.input.frmtype) === 2){   
if(parseInt(args.input.formid) === -1){
//change password
        const { password, confirmPassword } = args.input;

        if (!password || password.trim() === '') {result.msg = result.msg+"Password, "; result.status = 0; }
        if (!confirmPassword || confirmPassword.trim() === '') { result.msg = result.msg+"Confirm Password, "; }
        if(result.status === 0) {return result; }
        if (password.trim() !== confirmPassword.trim()) { 
        result.msg = result.msg+"Password and Confirm password do not match"; 

        result.status = 0; return result;}

        const maxPassword = await Utils.validate(Utils.setValidation({password: password},{password: 'maxLength:15|required'}), 'password').catch(function(e) {
          result.msg = result.msg+e; });
          if(!maxPassword){result.status = 0;return result;}
          
          const minPassword = await Utils.validate(Utils.setValidation({password: password},{password: 'minLength:6|required'}), 'password').catch(function(e) {
            result.msg = result.msg+", "+e; });
            if(!minPassword){result.status = 0; }
            if(result.status === 0) {return result; }

            if(!Utils.CheckPassword(password)){
              result.msg = "Password must contain a number, special character, uppercase letter, lowercase letter and be 6 to 15 characters long";
              result.status = 0;}
            
            if(result.status === 0) {return result; }

              const passwordHash = Utils.SY_hashVar (password);
              if(result.status === 1){
               updatePassword = await Db.dbUpdate("UPDATE password SET status = 2 WHERE (userid = "+con.escape(auth.userId)+" AND status = 1)");
               addPassword = await Db.dbUpdate("INSERT INTO password (userid, password) VALUES ("+con.escape(auth.userId)
               +", "+con.escape(passwordHash)+")");
              result.msg = "Done";
              }        
      }
      if(parseInt(args.input.formid) === -2){
        //change profile
        const { fullname, gender, address, city, province, zip, country, phone } = args.input;

        if (!fullname || fullname.trim() === '') {result.msg = result.msg+"Fullname, "; result.status = 0; }
        if (!gender) { result.msg = result.msg+"Gender, "; result.status = 0;} else {
        const valGender = await Utils.validate(Utils.setValidation({gender: gender},{gender: 'numeric'}), 'gender').catch(function(e) {
        result.msg = result.msg+e; });
        if (!valGender) {result.msg = result.msg+"Gender, "; result.status = 0;}
        }
        
        //if(typeof gender !== 'number') { result.msg = result.msg+"Gender, "; result.status = 0;}
        if (!address || address.trim() === '' || address.length < 7) {result.msg = result.msg+"Address, "; result.status = 0; }
        if (!city || city.trim() === '' || city.length < 3) { result.msg = result.msg+"City, "; }
        if (!province || province.trim() === '' || province.length < 3) {result.msg = result.msg+"Province, "; result.status = 0; }
        if (!zip || isNaN(zip) || zip.length < 4) { result.msg = result.msg+"ZIP, "; }
        if (!country || isNaN(country)) {result.msg = result.msg+"Country, "; result.status = 0; }
        if (!phone || isNaN(phone) || phone.trim() === '') { result.msg = result.msg+"Phone, "; result.status = 0;}
        if(result.status === 0) {return result; }
        
              if(result.status === 1){
               updatePassword = await Db.dbUpdate("UPDATE useprofile SET status = 2 WHERE (userid = "+con.escape(auth.userId)+" AND status = 1)");
               addPassword = await Db.dbUpdate("INSERT INTO useprofile (userid,fullname, gender, address, city, province, country, phone, zip, domain, uuid) VALUES ("+con.escape(auth.userId)
               +", "+con.escape(fullname)+", "+con.escape(gender)+", "+con.escape(address)+", "+
               con.escape(city)+", "+con.escape(province)+", "+con.escape(country)+", "+con.escape(phone)+", "+con.escape(zip)+", "+con.escape(auth.domainName)+", "+con.escape(UUID)+")");
              result.msg = "Done";
              }        
      }

//accept incoming request

if(parseInt(args.input.formid) === 21){
result.status = 0;
const { address, rowid, tbl, id, uuid } = args.input;
let dbresult = await Db.dbUpdate("UPDATE session SET status = 1, userid="+con.escape(auth.userId)+", uuid="+con.escape(uuid)+", sectionid="+con.escape(id)+" WHERE id = "+con.escape(rowid));
if(dbresult){result.msg = "Completed"; result.status = 1; }
return result;          
}

//sign out
if(parseInt(args.input.formid) === 26){
  result.status = 0  
  let dbresult = await Db.dbUpdate("UPDATE itemstatus SET status = 2 WHERE tbl=24 AND rowid = "+con.escape(auth.userId));
  if(dbresult){result.msg = "Completed"; result.status = 1; }
  return result;          
  }

if(parseInt(args.input.formid) === 19){
// const { editid, description } = args.input;
const { tbl, rowid, status } = args.input;
if(parseInt(tbl) === -5){
await Db.dbUpdate("UPDATE videoconfparticipants SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}
if(parseInt(tbl) === 12){
await Db.dbUpdate("UPDATE department SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}


if(parseInt(tbl) === 137){
await Db.dbUpdate("UPDATE egp_fiscalyear SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}

if(parseInt(tbl) === 104){
await Db.dbUpdate("UPDATE egp_plan SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}
if(parseInt(tbl) === 106){
await Db.dbUpdate("UPDATE egp_agency SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}

if(parseInt(tbl) === 105){
  await Db.dbUpdate("UPDATE egp_project SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
  }
if(parseInt(tbl) === 115 && (!args.input.planid || parseInt(args.input.planid) !== -115)){
  await Db.dbUpdate("UPDATE user SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
  }
  if(parseInt(tbl) === 115 && args.input.planid && parseInt(args.input.planid) === -115){ 
  await Db.dbUpdate("UPDATE user SET status = 32, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
  }
if(parseInt(tbl) === 110){
  await Db.dbUpdate("UPDATE egp_news SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
  }
if(parseInt(tbl) === 30){
await Db.dbUpdate("UPDATE payments SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}
if(parseInt(tbl) === 2){
await Db.dbUpdate("UPDATE user SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}
if(parseInt(tbl) === 28){
  await Db.dbUpdate("UPDATE firewall SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
  }
if(parseInt(tbl) === 27){
    await Db.dbUpdate("UPDATE filerepo SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
    }
if(parseInt(tbl) === 30){
    await Db.dbUpdate("UPDATE subscription SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
    }
if(parseInt(tbl) === 78 || parseInt(tbl) === 79 || parseInt(tbl) === 81){
    await Db.dbUpdate("UPDATE videoconf SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
    }
result.msg = "Done"; result.status = 1;
return result;  
}		  
if(parseInt(args.input.formid) === 25){ //end chat session
await Db.dbUpdate("UPDATE session SET status = 5, userid = "+con.escape(auth.userId)+", endedby = 14 WHERE (id = "+con.escape(args.input.rowid)+")") } 
    } // end to both admin and non admin users
      return result;  }},
        }, 

Query: {
getSiteList: async (parent, args, context, info) => { 
let siteListId = parseInt(args.listid); 
let domain = Utils.getOriginDomain(context.req.get('origin'), 1);
if(args.section === "bid" && parseInt(siteListId)){ 
let dbresult = await Db.query("SELECT egp_plan.id AS itemId, egp_type.title AS zip, egp_plan.inid, egp_plan.title, egp_plan.uuid AS id, egp_agency.title AS description, egp_solicitation.title AS province, egp_project.title AS fullname FROM egp_plan INNER JOIN egp_agency ON (egp_agency.id=entityid OR egp_agency.inid=entityid) INNER JOIN egp_project ON (egp_project.id=projectid OR egp_project.inid=projectid) INNER JOIN egp_type ON (egp_type.id=type OR egp_type.inid=type) INNER JOIN egp_solicitation ON (egp_solicitation.id=solicitationid OR egp_solicitation.inid=solicitationid) WHERE egp_type.status=1 AND egp_solicitation.status=1 AND egp_project.status=1 AND egp_plan.status=1 AND egp_agency.status=1 AND (egp_plan.inid="+con.escape(siteListId)+" OR egp_plan.id="+con.escape(siteListId)+")");
var parsed = dbresult.map(async function (item) {

return {
itemId: item.itemId,
inid: item.inid,
description: item.description,
title: item.title,
zip: item.zip,
province: item.province,
//fullname: item.fullname,
id: "pubbid"+item.id
}
});
return parsed;} // end bid destials

if(siteListId === 78){  // list upcoming conferences
return await Db.query("SELECT videoconf.id AS itemId, videoconf.inid, videoconf.title, videoconf.uuid AS id, videoconf.conftype AS address, videoconf.starttime AS city, videoconf.duration AS total, videoconf.startdate AS date, timezone.title AS msg, videoconf.description, confurl.uuid AS fullname FROM videoconf INNER JOIN timezone ON timezone.id = videoconf.timezone INNER JOIN confurl ON (confurl.confid = videoconf.id OR confurl.confid = videoconf.inid) WHERE videoconf.status = 1 AND videoconf.domain = " + con.escape(domain) +" AND videoconf.startdate > CURDATE() ORDER BY videoconf.title ASC" );  } // end COUNTRY list for form
      
if(siteListId === 136){ // list settings pub
let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM module WHERE (groupid = 3 OR id IN (111, 110)) ORDER BY title ASC");
var parsed = dbresult.map(async function (item) {
let status = null;
status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(siteListId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")            
return {
itemId: item.itemId,
inid: item.inid,
description: "",
title: item.title,
status: status,
domain: "",
id: "pub"+item.id
}
});
return parsed;
} // end list settings pub

     
if(siteListId === 111){ // list awarded contracts
let dbresult = await Db.query("SELECT egp_award.id AS itemId, amount, orgname.title AS address, egp_award.inid, egp_plan.title, egp_award.uuid AS id, DATE_FORMAT(awarddate, '%M %d %Y') AS awarddate FROM egp_award INNER JOIN egp_plan ON (egp_plan.id=egp_award.planid OR egp_plan.inid=egp_award.planid) INNER JOIN orgname ON (orgname.id =egp_award.awardedto) WHERE egp_award.status=1 ORDER BY egp_award.awarddate DESC");
var parsed = dbresult.map(async function (item) {
let status = null;
status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(siteListId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")            
return {
itemId: item.itemId,
inid: item.inid,
description: item.awarddate,
title: item.title,
status: status,
address: item.address,
id: "pubawadred"+item.id,
zip: item.amount
}
});
return parsed;
} // end list awarded
      
if(siteListId === 110){ // list news
let section=1;
let newsBody="";
if(args.section){section=parseInt(args.section);}
let dbresult = await Db.query("SELECT id AS itemId, inid, title, teaser, description, typeid AS planid, uuid AS id FROM egp_news WHERE  status = 1 AND typeid = "+con.escape(section)+" ORDER BY itemid DESC LIMIT 0,3");

var parsed = dbresult.map(async function (item) {
let status = null;
if(section === 1){newsBody= item.description;}
return {
itemId: item.itemId,
inid: item.inid,
description: newsBody,
title: item.title,
status: status,
city: item.teaser,
planid: item.planid,
id: "pub"+item.id
}
});
return parsed;
} // end list settings pub
     /*
if(siteListId === -110){ // list news three
let dbresult = await Db.query("SELECT id AS itemId, inid, title, teaser, description, uuid AS id FROM egp_news WHERE  status = 1 ORDER BY itemid DESC LIMIT 0,3");
var parsed = dbresult.map(async function (item) {
let status = null;

return {
itemId: item.itemId,
inid: item.inid,
description: item.description,
title: item.title,
status: status,
city: item.teaser,
id: "pubnewshome"+item.id
}
});
return parsed;
} // end list settings pub
*/

if(siteListId === 116){  // list side menu pub
return await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id FROM module WHERE groupid = 1 ORDER BY ordering ASC" );  } // end COUNTRY list for form

if(siteListId === 105){ // list project
let dbresult = await Db.query("SELECT egp_project.govt, egp_project.bank, egp_project.fiscalyear AS yearid, egp_fiscalyear.title AS fiscalyear, egp_project.disbursed, egp_project.agreementno, egp_project.total, egp_project.id AS itemId, egp_project.inid, egp_project.title, egp_project.description, egp_project.uuid AS id FROM egp_project INNER JOIN egp_fiscalyear ON (egp_project.fiscalyear=egp_fiscalyear.id OR egp_project.fiscalyear=egp_fiscalyear.inid) WHERE egp_project.status = 1 AND egp_fiscalyear.status=1 AND (egp_project.id IN (SELECT rowid FROM itemstatus WHERE tbl = 105 AND itemstatus.status = 1) OR egp_project.inid IN (SELECT rowid FROM itemstatus WHERE tbl = 105 AND itemstatus.status = 1)) ORDER BY egp_fiscalyear.title DESC");
var parsed = dbresult.map(async function (item) {
let status = 1;	 

let compos = await Db.query("SELECT COUNT(id) AS itemNo, entityid FROM egp_plan WHERE projectid="+(con.escape(item.inid !== 0) ? item.inid : item.itemId)+" AND egp_plan.id NOT IN (SELECT rowid FROM itemstatus WHERE tbl = 105 AND itemstatus.status = 1) GROUP BY entityid" ); 

var parsedD = compos.map(async function (itemD) {
return {
s1id: Utils.UUID(),
s1inid: itemD.itemNo,
s1description: "",
s1status: 1,
s1itemId: itemD.itemNo,
s1title: await getTitle("SELECT title FROM egp_agency WHERE status = 1 AND (id = "+con.escape(itemD.entityid)+" || inid = "+con.escape(itemD.entityid)+") ORDER BY id DESC LIMIT 0, 1"),
}});

return {
itemId: item.itemId,
inid: item.inid,
province: "item.fiscalyear",
title: item.title,
status: status,
description: item.description,
id: "prghme"+item.id,
zip: item.total,
stringfour: item.bank,
total: item.yearid,
city: item.govt,
address:item.disbursed,
province:item.fiscalyear, 
subone:parsedD,
}
});
return parsed;
} // end list project
if(siteListId === 137){ // list fiscal year
let dbresult = await Db.query("SELECT id AS itemId, inid, title, DATE_FORMAT(startdate, '%M %d %Y') AS zip, DATE_FORMAT(enddate, '%M %d %Y') AS address, uuid AS id FROM egp_fiscalyear WHERE status = 1 ORDER BY title ASC");
var parsed = dbresult.map(async function (item) {
let status = null;
return {
itemId: item.itemId,
inid: item.inid,
description: "",
title: item.title,
status: 1,
domain: "",
id: item.id,
zip: item.zip,
address: item.address
}
});
return parsed;
} // end list fiscal year
if(siteListId === 104){ // list complete plan
let dbresult = await Db.query("SELECT egp_plan.id AS itemId, egp_plan.inid, egp_plan.title, egp_plan.projectid AS total, egp_plan.solicitationid AS country, egp_solicitation.title AS solicitation, egp_plan.type AS typeid, egp_plan.entityid AS stringone, egp_plan.uuid AS id, egp_agency.title AS address, egp_type.title AS city, egp_fiscalyear.title AS description, egp_project.title AS stringthree FROM egp_plan INNER JOIN egp_project ON (egp_plan.projectid=egp_project.id OR egp_plan.projectid=egp_project.inid) INNER JOIN egp_solicitation ON (egp_plan.solicitationid=egp_solicitation.id OR egp_plan.solicitationid=egp_solicitation.inid) INNER JOIN egp_type ON (egp_plan.type=egp_type.id OR egp_plan.type=egp_type.inid) INNER JOIN egp_agency ON (egp_plan.entityid=egp_agency.id OR egp_plan.entityid=egp_agency.inid) INNER JOIN egp_fiscalyear ON (egp_fiscalyear.id=egp_project.fiscalyear OR egp_fiscalyear.inid=egp_project.fiscalyear) WHERE egp_plan.status=1 AND egp_project.status=1  AND egp_solicitation.status=1 AND egp_type.status=1 AND egp_agency.status=1 AND egp_fiscalyear.status=1 AND (egp_plan.id IN (SELECT rowid FROM itemstatus WHERE tbl = 104 AND itemstatus.status = 1) OR egp_plan.inid IN (SELECT rowid FROM itemstatus WHERE tbl = 104 AND itemstatus.status = 1))  AND (egp_agency.id IN (SELECT rowid FROM itemstatus WHERE tbl = 106 AND itemstatus.status = 1) OR egp_agency.inid IN (SELECT rowid FROM itemstatus WHERE tbl = 106 AND itemstatus.status = 1)) ORDER BY egp_fiscalyear.title, egp_plan.title ASC");
var parsed = dbresult.map(async function (item) {
										  
let status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(siteListId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")            

let planStatus='Pre-Bid';
let planStatusId=0;
let bidding = await Db.query("SELECT DATE_FORMAT(enddate, '%M %d %Y') AS enddate, endtime, DATE_FORMAT(startdate, '%M %d %Y') AS startdate, starttime, description FROM egp_bidding WHERE planid="+con.escape(item.inid === 0 ? item.itemId : item.inid)+" AND enddate > CURDATE() AND status=1");
if(bidding && bidding.length > 0) {planStatus='Bidding'; planStatusId=1;} 

let awarded = await Db.query("SELECT amount, orgname.title AS address, DATE_FORMAT(awarddate, '%M %d %Y') AS awarddate FROM egp_award INNER JOIN egp_plan ON (egp_plan.id=egp_award.planid OR egp_plan.inid=egp_award.planid) INNER JOIN orgname ON (orgname.userid =egp_award.awardedto) WHERE egp_award.status=1 AND orgname.status=1 AND egp_plan.status=1 AND planid="+con.escape(item.inid === 0 ? item.itemId : item.inid)+" ORDER BY egp_award.id DESC");
if(awarded && awarded.length > 0) {planStatus='Awarded'; planStatusId=2;} 

let complete = await Db.query("SELECT progress FROM egp_progress WHERE planid="+con.escape(item.inid === 0 ? item.itemId : item.inid)+" AND status=1");
if(complete && complete.length > 0 && parseInt(complete[0].progress) === 100) {planStatus='Completed'; planStatusId=3} 




return {
itemId: item.itemId,
inid: item.inid,
title: item.title,
status: status,
total: item.total,
id: "puplan"+item.id,
country: item.country,
typeid: item.typeid,
stringone: item.stringone,
address: item.address,
city: item.city,
description: item.description,
stringthree: item.stringthree,
stringfour: planStatus,
stringsix: item.solicitation,
stringfive: planStatusId,

string12: ((typeof awarded !== 'undefined' && awarded.length > 0 && typeof awarded[0].awarddate !== 'undefined') ? awarded[0].awarddate : ""),
string13: ((typeof awarded !== 'undefined' && awarded.length > 0 && typeof awarded[0].address !== 'undefined') ? awarded[0].address : ""),
zip: ((typeof awarded !== 'undefined' && awarded.length > 0 && typeof awarded[0].amount !== 'undefined') ? awarded[0].amount : ""),
string14: ((typeof bidding !== 'undefined' && bidding.length > 0 && typeof bidding[0].enddate !== 'undefined') ? bidding[0].enddate : ""),
string15: ((typeof bidding !== 'undefined' && bidding.length > 0 && typeof bidding[0].endtime !== 'undefined') ? bidding[0].endtime : ""),

string16: ((typeof bidding !== 'undefined' && bidding.length > 0 && typeof bidding[0].startdate !== 'undefined') ? bidding[0].startdate : ""),
string17: ((typeof bidding !== 'undefined' && bidding.length > 0 && typeof bidding[0].starttime !== 'undefined') ? bidding[0].starttime : ""),
string18: ((typeof bidding !== 'undefined' && bidding.length > 0 && typeof bidding[0].description !== 'undefined') ? bidding[0].description : ""),


}
});
return parsed;
} // end list plan
if(siteListId === 120){ // list bid
let dbresult = await Db.query("SELECT egp_plan.id AS itemId, egp_solicitation.title AS solicitation, egp_type.title AS city, egp_plan.type AS typeid, DATE_FORMAT(egp_bidding.startdate, '%M %d %Y') AS stringone, egp_bidding.starttime AS stringtwo, DATE_FORMAT(egp_bidding.enddate, '%M %d %Y') AS stringthree, egp_bidding.endtime AS stringfour, egp_plan.inid, egp_plan.title, egp_agency.title AS address, egp_bidding.uuid AS id FROM egp_plan INNER JOIN egp_agency ON (egp_agency.id=egp_plan.entityid OR egp_agency.inid=egp_plan.entityid) INNER JOIN egp_solicitation ON (egp_solicitation.id=egp_plan.solicitationid OR egp_solicitation.inid=egp_plan.solicitationid) INNER JOIN egp_bidding ON (egp_bidding.planid= egp_plan.inid OR egp_bidding.planid=egp_plan.id) INNER JOIN egp_type ON (egp_type.id=egp_plan.type OR egp_type.inid=egp_plan.type) WHERE egp_plan.status = 1 AND egp_bidding.enddate > CURDATE() AND egp_agency.status=1 AND egp_type.status=1 AND egp_bidding.status = 1 AND egp_solicitation.status=1 AND (egp_plan.id IN (SELECT rowid FROM itemstatus WHERE tbl = 104 AND itemstatus.status = 1) OR egp_plan.inid IN (SELECT rowid FROM itemstatus WHERE tbl = 104 AND itemstatus.status = 1)) ORDER BY egp_plan.title ASC");
var parsed = dbresult.map(async function (item) {
let status = 1;	 
return {
  itemId: item.itemId,
  inid: item.inid,
  description: "",
  title: item.title,
  status: status,
  domain: "",
  id: "pubid"+item.id,
  address: item.address,
  city: item.city,
  stringone: item.stringone,
  stringtwo: item.stringtwo,
  stringthree: item.stringthree,
  stringfour: item.stringfour,
  stringfive: item.solicitation,
  typeid: item.typeid,
}
});
return parsed;
} // end list bid

if(siteListId === 135){ // list awarded
let dbresult = await Db.query("SELECT egp_award.id, egp_plan.id AS itemId, egp_award.amount AS city, DATE_FORMAT(egp_award.awarddate, '%M %d %Y') AS stringone, orgname.title AS stringtwo, egp_plan.title AS address, egp_plan.inid, egp_award.uuid AS id FROM egp_award INNER JOIN egp_plan ON (egp_award.planid=egp_plan.inid OR egp_award.planid=egp_plan.id) INNER JOIN orgname ON (orgname.id=egp_award.awardedto OR orgname.inid=egp_award.awardedto) WHERE egp_plan.status = 1 AND egp_award.status=1 AND orgname.status=1 ORDER BY egp_award.id DESC");
var parsed = dbresult.map(async function (item) {
let status = 1;	 
return {
  itemId: item.itemId,
  inid: item.inid,
  title: item.title,
  domain: "",
  id: ("awarded"+item.id),
  city: item.city,
  stringone: item.stringone,
  stringtwo: item.stringtwo,
  address: item.address,
}
});
return parsed;
} // end list awarded


if(siteListId === 114 || siteListId === 118 || siteListId === 119 || siteListId === 112 || siteListId === 113){  // egp details
  return await Db.query("SELECT id AS itemId, inid, description, uuid AS id FROM egp_bpplaw WHERE status = 1 AND type =  " + con.escape(parseInt(siteListId)) );  } // end COUNTRY list for form

if(siteListId === 53){ // COUNTRY list for form
  let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM countries WHERE status = 1 ORDER BY title ASC" );return dbresult;}
if(siteListId === 96){  // retturn conference details 
let db = await Db.query("SELECT videoconfparticipants.id AS itemId, videoconf.inid, videoconfparticipants.title, videoconfparticipants.uuid AS id, videoconf.mode AS address, videoconf.starttime AS city, videoconf.duration AS total, videoconf.startdate AS date, videoconf.title AS msg, videoconf.description FROM videoconf INNER JOIN confurl ON (confurl.confid = videoconf.id OR confurl.confid = videoconf.inid) INNER JOIN videoconfparticipants ON (videoconfparticipants.videoconfid = confurl.confid) WHERE videoconf.status = 1 AND videoconfparticipants.status = 1 AND videoconf.domain = " + con.escape(domain) +" AND confurl.uuid = " + con.escape(args.section) +" ORDER BY videoconf.title ASC" ); return db;} // end retturn conference details 

if(siteListId === 106){ // user type list for 
let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id, officer FROM egp_agency WHERE status = 1  AND (id IN (SELECT rowid FROM itemstatus WHERE tbl=106 AND status=1) OR inid IN (SELECT rowid FROM itemstatus WHERE tbl=106 AND status=1)) ORDER BY title ASC" );  
var parsed = dbresult.map(async function (item) {
return {
itemId: item.itemId,
inid: item.inid,
title: item.title,
id: "pubagency"+item.id,
city: item.officer
}
});
return parsed;  
  
  }
  
  
if(siteListId === 96){  // retturn conference details 
let db = await Db.query("SELECT videoconfparticipants.id AS itemId, videoconf.inid, videoconfparticipants.title, videoconfparticipants.uuid AS id, videoconf.mode AS address, videoconf.starttime AS city, videoconf.duration AS total, videoconf.startdate AS date, videoconf.title AS msg, videoconf.description FROM videoconf INNER JOIN confurl ON (confurl.confid = videoconf.id OR confurl.confid = videoconf.inid) INNER JOIN videoconfparticipants ON (videoconfparticipants.videoconfid = confurl.confid) WHERE videoconf.status = 1 AND videoconfparticipants.status = 1 AND videoconf.domain = " + con.escape(domain) +" AND confurl.uuid = " + con.escape(args.section) +" ORDER BY videoconf.title ASC" ); return db;} // end retturn conference details 

/*
else if(siteListId === 78 && args.itemid && !isNAN(args.itemid) && args.itemid !== 0 && args.itemid !== "" && args.section && args.section !== "0" && args.section === ""){  // list participants details 
return await Db.query("SELECT videoconfparticipants.id AS itemId, videoconf.inid, videoconfparticipants.title, videoconf.uuid AS id, videoconf.conftype AS address, videoconf.starttime AS city, videoconf.duration AS total, videoconf.startdate AS date, timezone.title AS msg, videoconf.description FROM videoconf INNER JOIN videoconfparticipants ON (videoconfparticipants.videoconfid = videoconf.id OR videoconfparticipants.videoconfid = videoconf.inid) WHERE videoconf.status = 1 AND videoconf.domain = " + con.escape(domain) +" AND (videoconf.id = " + con.escape(args.section) +" OR videoconf.inid = " + con.escape(args.section) +" ) AND videoconfparticipants.status = 1" ); } // end list participants details 
*/
return emptyResult;	   
}, // end get list for web site
sideMenu: async (parent, args, context, info) => { 
if(context.req.headers.authorization === "Bearer none"){return noSignIn;  } 
else {
let token = context.req.headers.authorization || '';  
let auth = await checkUser(token)
if(!auth.status){   return noSignIn; }
if(await Utils.checkUserStatus(auth.userId) !== 1){return emptyResult ;}  
else {
  return await Db.query("SELECT title, id AS itemId, inid, addnew, uuid AS id, description, parentid AS sidegroup, groupid FROM module WHERE (access=" + con.escape(auth.typeId) +" || access=2) AND status=1 ORDER BY title ASC");
}  }
},

userStatus: async (parent, args, context, info) => { 
if(context.req.headers.authorization === "Bearer none"){return noSignIn;  } 
else {
let token = context.req.headers.authorization || '';  
let auth = await checkUser(token)
if(await Utils.checkUserStatus(auth.userId) !== 1){return [{inid:-1, id:"-1"}];}  
if(await Utils.checkUserStatus(auth.userId) === 1){return [{inid:1, id:"1"}];}  
}
return [{inid:1, id:"1"}];
},
password: async (parent, args, context, info) => {
let prcpassword = await prcLogin.resetPassword(args, context);
return prcpassword;
},
getList: async (parent, args, context, info) => { 
//let result = {status:0, msg:""} 
if(context.req.headers.authorization === "Bearer none"){ return noSignIn;  } 
else {
let token = context.req.headers.authorization || ''; 
let auth = await checkUser(token)
if(!auth.status){ return noSignIn; }
if(await Utils.checkUserStatus(auth.userId) !== 1){return emptyResult ;}  
if(auth.status){ 
}
            result = emptyResult;
            let listId = parseInt(args.listid);
 
if(listId === 94){ // list IM
let IM = await Db.query("SELECT im.inid, userid, im.id AS itemId, DATE_FORMAT(date, '%M %d %Y %T %p') AS date, im.description, im.uuid AS id, recid, im.pairid FROM im WHERE status = 1 AND (im.userid = "+con.escape(auth.userId)+" OR im.recid = "+con.escape(auth.userId)+") AND im.pairid IN (SELECT id FROM impair WHERE impair.status = 1 AND (impair.userid = "+con.escape(auth.userId)+" OR impair.recid = "+con.escape(auth.userId)+")) AND im.id NOT IN (SELECT editid FROM itemstatus WHERE itemstatus.tbl = 94 AND userid = "+con.escape(auth.userId)+") ORDER BY im.id DESC");
if(IM.length > 0){
var parsed = IM.map(async function (item) { 
let reply = await Db.query("SELECT userid, description, id AS itemId, pairid, uuid AS id FROM imslave WHERE status=1 AND pairid =  " + con.escape(item.pairid) + " ORDER BY imslave.id DESC"); 
var parsedD = reply.map(async function (itemD) {
return {
s1id: itemD.id,
s1inid: itemD.inid,
s1description: itemD.description,
s1status: (itemD.userid === auth.userId ? 0 : 1),
s1itemId: itemD.itemId,
s1title: itemD.userid,
}});
return {
id: item.id,
inid: item.pairid,
description: item.description,
itemId: item.itemId,
title: (item.userid === auth.userId ? await Utils.GetAgentEmail(item.recid) : await Utils.GetAgentEmail(item.userid)),
//address: (item.userid === auth.userId ? "me" : await Utils.GetAgentEmail(item.userid)),
//city: (item.userid === auth.userId ? "me" : await Utils.GetAgentName(item.userid)),
total: (item.userid === auth.userId ? item.recid : item.userid),
date: item.date,
msg: (item.userid === auth.userId ? await Utils.GetAgentName(item.recid) : await Utils.GetAgentName(item.userid)),
subone: parsedD
}});
}
return parsed;
//return await getIM(inid, auth.userId);
} 
 // end list im             
         //   if(auth.typeId === 1){// for admin
              if(listId === 2){ // list agents
                let dbresult = await Db.query("SELECT user.id AS itemId, user.inid AS inid, user.username, user.usernameiv, useprofile.fullname, gender.title, user.uuid AS id, statuscode.title AS usertype, useprofile.phone FROM user INNER JOIN useprofile ON useprofile.uuid = user.uuid INNER JOIN statuscode ON statuscode.id = user.typeid INNER JOIN gender ON gender.id = useprofile.gender WHERE user.status=1 AND user.typeid <> 1 ORDER BY useprofile.fullname ASC");
var parsed = dbresult.map(async function (item) {
let status = null;
status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")

let departments = await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id FROM record WHERE status=1 AND type=12 ORDER BY title ASC");
var parsedD = departments.map(async function (itemD) {
let statusD = null;
statusD =  await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = 14 AND rowid = "+con.escape(itemD.inid > 0 ? itemD.inid : itemD.itemId)+" AND editid = "+con.escape(parseInt(item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1");

                return {
                    s1id: itemD.id,
                    s1inid: itemD.inid,
                    s1description: itemD.description,
                    s1title: itemD.title,
                    s1status: statusD,
                    s1itemId: itemD.itemId
                }
            });
            
                  return {
                      id: item.id,
                      inid: item.inid,
                      username: Utils.decrypt({iv: item.usernameiv, content: item.username}),
                      fullname: item.fullname,
                      title: item.title,
                      status: status,
                      stringone: item.usertype,
                      stringtwo: item.phone,
                      subone: parsedD,
                      itemId: item.itemId
                  }
              });
              return parsed;
            } // end list agents

            if(listId === 57){ // list AGENTS subscription
                let tempTotal = {}
                let dbresult = await Db.query("SELECT user.id AS itemId, user.inid AS inid, user.username, user.usernameiv, useprofile.fullname, gender.title, user.uuid AS id FROM user INNER JOIN useprofile ON useprofile.uuid = user.uuid INNER JOIN gender ON gender.id = useprofile.gender WHERE user.status=1 AND user.typeid <> 1 AND useprofile.status = 1 AND gender.status = 1 ORDER BY fullname ASC");
                var parsed = dbresult.map(async function (item) {
               let status = null;
              status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(parseInt(listId))+" AND rowid = "+con.escape(parseInt(item.inid > 0 ? item.inid : item.itemId))+") ORDER BY id DESC LIMIT 0, 1")
          
                  return {
                      id: "sub"+item.id,
                      inid: item.inid,
                      username: Utils.decrypt({iv: item.usernameiv, content: item.username}),
                      fullname: item.fullname,
                      title: item.title,
                      status: status,
                      itemId: item.itemId
                  }
              });
              return parsed;
          } // end AGENTS subscription
          /*
		    if(listId === 58){ // list get number of agents on subscription
              let agentsdepartment = [];
                let tempTotal = {}
               let hash = {iv:"", content:""}
                let dbresult = await Db.query("SELECT user.id AS itemId, user.inid AS inid, user.username, user.usernameiv, useprofile.fullname, gender.title, user.uuid AS id FROM user INNER JOIN useprofile ON useprofile.uuid = user.uuid INNER JOIN gender ON gender.id = useprofile.gender WHERE user.domain=" + con.escape(auth.domainName) +" AND user.status=1 AND user.typeid <> 1 AND useprofile.status = 1 AND gender.status = 1 ORDER BY fullname ASC");
                var parsed = dbresult.map(async function (item) {
               let status = null;
              status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(parseInt(listId))+" AND rowid = "+con.escape(parseInt(item.inid > 0 ? item.inid : item.itemId))+" AND domain = "+con.escape(auth.domainName)+") ORDER BY id DESC LIMIT 0, 1")
          
                  return {
                      id: "sub"+item.id,
                      inid: item.inid,
                      username: Utils.decrypt({iv: item.usernameiv, content: item.username}),
                      fullname: item.fullname,
                      title: item.title,
                      status: status,
                      itemId: item.itemId
                  }
              });
              return parsed;
          } // end get number of agents on subscription
          */
		  
		  
if(listId === 26){ // run analytics
let dbresult = await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id, sender, channel, mobile, alertprogress FROM record WHERE status = 1 AND type = "+con.escape(parseInt(listId))+" ORDER BY title ASC");
var parsed = dbresult.map(async function (item) {
let status = null;
status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1");

let channel = ''; 
if(parseInt(item.channel) > 0){ channel = await getTitle("SELECT title FROM data_channel WHERE status = 1 AND id = "+con.escape(parseInt(item.channel))+" LIMIT 0, 1"); }


return {
itemId: item.itemId,
inid: item.inid,
description: item.description,
title: item.title,
status: status,
domain: item.sender,
stringthree: channel,
stringone: item.mobile,
stringtwo: item.alertprogress,
id: item.id
}
});
return parsed;
} // end list department

//end analytics
if(listId === 12 || listId === 169 || listId === 148 || listId === 152 || listId === 147){ // list departments
let dbresult = await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id, sender, channel, mobile, alertprogress FROM record WHERE status = 1 AND type = "+con.escape(parseInt(listId))+" ORDER BY title ASC");
var parsed = dbresult.map(async function (item) {
let status = null;
status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1");

let channel = ''; 
if(parseInt(item.channel) > 0){ channel = await getTitle("SELECT title FROM data_channel WHERE status = 1 AND id = "+con.escape(parseInt(item.channel))+" LIMIT 0, 1"); }


return {
itemId: item.itemId,
inid: item.inid,
description: item.description,
title: item.title,
status: status,
domain: item.sender,
stringthree: channel,
stringone: item.mobile,
stringtwo: item.alertprogress,
id: item.id
}
});
return parsed;
} // end list department


if(listId === 146 || listId === 26){ // list menu dashboard
return await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id, parentid AS stringtwo FROM module WHERE status = 1 AND (parentid = 146 OR parentid = 26) ORDER BY title ASC");
} // end list menu dashboard


if(listId === 137){ // list fiscal year
let dbresult = await Db.query("SELECT id AS itemId, inid, title, DATE_FORMAT(startdate, '%M %d %Y') AS zip, DATE_FORMAT(enddate, '%M %d %Y') AS address, uuid AS id FROM egp_fiscalyear WHERE status = 1 ORDER BY title ASC");
var parsed = dbresult.map(async function (item) {
let status = null;
return {
itemId: item.itemId,
inid: item.inid,
description: "",
title: item.title,
status: 1,
domain: "",
id: item.id,
zip: item.zip,
address: item.address
}
});
return parsed;
} // end list fiscal year


if(listId === 104){ // list pp
let dbresult = await Db.query("SELECT egp_plan.id AS itemId, egp_plan.inid, egp_plan.title AS title, egp_agency.title AS description, egp_plan.uuid AS id, egp_plan.projectid, egp_plan.solicitationid, egp_plan.entityid, egp_plan.type, egp_agency.officer AS officer FROM egp_plan INNER JOIN egp_project ON (egp_project.id = egp_plan.projectid OR egp_project.inid=egp_plan.projectid) INNER JOIN egp_solicitation ON (egp_solicitation.id=egp_plan.solicitationid OR egp_solicitation.inid=egp_plan.solicitationid) INNER JOIN egp_agency ON (egp_agency.id=egp_plan.entityid OR egp_agency.inid=egp_plan.entityid) WHERE egp_plan.status = 1 AND egp_agency.status=1 AND egp_solicitation.status=1 AND egp_project.status=1 ORDER BY egp_plan.title ASC");
var parsed = dbresult.map(async function (item) {
let status = null;
status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")

let progress = await Db.query("SELECT progress, amount FROM egp_progress WHERE status = 1 AND planid = "+con.escape(item.inid > 0 ? item.inid : item.itemId));  

let award = await Db.query("SELECT awarddate AS date, effectivedate AS stringone, completiondate as stringtwo, awardedto AS stringthree, amount AS stringfour, actualcompletion AS stringfive FROM egp_award WHERE status = 1 AND planid = "+con.escape(item.inid > 0 ? item.inid : item.itemId)); 

let bidding = await Db.query("SELECT startdate, enddate, endtime, starttime, description, openingdate, openingtime FROM egp_bidding WHERE status = 1 AND planid = "+con.escape(item.inid > 0 ? item.inid : item.itemId));  

let intent = await Db.query("SELECT * FROM egp_intent WHERE planid = "+con.escape(item.inid > 0 ? item.inid : item.itemId));  

return {
itemId: item.itemId,
inid: item.inid,
description: ((typeof bidding !== 'undefined' && bidding.length > 0) ? bidding[0].description : ""),
title: item.title,
status: status,
planid: parseInt(item.projectid),
phone: parseInt(item.solicitationid),
total: item.entityid,
country: item.type,
address: item.description,
id:item.id,
zip:((typeof progress !== 'undefined' && progress.length > 0) ? progress[0].progress : 0),
stringsix:((typeof progress !== 'undefined' && progress.length > 0) ? progress[0].amount : 0),
string13: item.officer,

stringone: ((typeof award !== 'undefined' && award.length > 0) ? award[0].stringone : 0),
stringseven: ((typeof award !== 'undefined' && award.length > 0) ? award[0].date : 0),
stringtwo: ((typeof award !== 'undefined' && award.length > 0) ? award[0].stringtwo : 0),
stringthree: ((typeof award !== 'undefined' && award.length > 0) ? award[0].stringthree : 0),
stringfour: ((typeof award !== 'undefined' && award.length > 0) ? award[0].stringfour : 0),
stringfive: ((typeof award !== 'undefined' && award.length > 0) ? award[0].stringfive : 0),

stringeigth: ((typeof bidding !== 'undefined' && bidding.length > 0) ? bidding[0].startdate : 0),
stringnine: ((typeof bidding !== 'undefined' && bidding.length > 0) ? bidding[0].endtime : 0),
city: ((typeof bidding !== 'undefined' && bidding.length > 0) ? bidding[0].starttime : 0),
province: ((typeof bidding !== 'undefined' && bidding.length > 0) ? bidding[0].enddate : 0),
stringten: ((typeof bidding !== 'undefined' && bidding.length > 0) ? bidding[0].openingdate : 0),
string12: ((typeof bidding !== 'undefined' && bidding.length > 0) ? bidding[0].openingdate : 0),
stringeleven: ((typeof bidding !== 'undefined' && bidding.length > 0) ? bidding[0].openingtime : 0),

addnew:((typeof intent !== 'undefined') ? intent.length : 0)

}
});
return parsed;
} // end list pp



        if(listId === 110){ // list news
          let dbresult = await Db.query("SELECT egp_news.id AS itemId, egp_news.typeid AS planid, egp_news.inid, egp_news.title, egp_news.description, egp_news.uuid AS id, contenttype.title AS content FROM egp_news INNER JOIN contenttype ON (contenttype.id = egp_news.typeid) WHERE egp_news.status = 1 ORDER BY egp_news.id DESC");
      var parsed = dbresult.map(async function (item) {
              return {
                itemId: item.itemId,
                inid: item.inid,
                description: item.description,
                title: item.title,
                address: "",
                zip: item.content,
                id: item.id,
                planid: item.planid,
            }
        });
        return parsed;
      } // end list news

      if(listId === 112){ // list bpp law
        let dbresult = await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id FROM egp_bpplaw WHERE status = 1 AND type = " + con.escape(parseInt(args.sectionid)));
        var parsed = dbresult.map(async function (item) {  
          return { 
              itemId: item.itemId,
              inid: item.inid,
              description: item.description,
              title: item.title,
              status: 1,
              domain: item.domain,
              id: item.id
          }
      });
      return parsed;
    } // end bpp law
        if(listId === 106){ // list agency userid = " + con.escape(auth.userId)+"
	let dbresult;
	if(parseInt(auth.typeId) === 1){
    dbresult = await Db.query("SELECT id AS itemId, inid, title, description, domain, officer, uuid AS id FROM egp_agency WHERE status = 1 ORDER BY title ASC");}
	   else {dbresult = await Db.query("SELECT id AS itemId, inid, title, description, domain, officer, uuid AS id FROM egp_agency WHERE status = 1 AND officer = "+con.escape(parseInt(auth.userId))+" ORDER BY title ASC");}
		  
		  
          var parsed = dbresult.map(async function (item) {
let status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape(parseInt((item.inid > 0) ? item.inid : item.itemId))+") LIMIT 0, 1") 
                   
            return {
                itemId: item.itemId,
                inid: item.inid,
                description: item.description,
                title: item.title,
                status: status,
                domain: item.domain,
                id: item.id,
                city: item.officer,
            }
        });
        return parsed;
      } // end list 
	    if(listId === 125){ // list plan status
          let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM egp_plan_status WHERE status = 1 ORDER BY title ASC");
          var parsed = dbresult.map(async function (item) {
          let status = 1;
                   
            return {
                itemId: item.itemId,
                inid: item.inid,
                description: "",
                title: item.title,
                status: "",
                domain: "",
                id: item.id
            }
        });
        return parsed;
      } // end list 
      
if(listId === 115){ // list suppliers
let dbresult = await Db.query("SELECT user.id AS itemId, orgname.title, user.inid, user.uuid AS id FROM user INNER JOIN orgname ON orgname.userid=user.id WHERE user.status = 1 AND orgname.status = 1 AND user.typeid=5 ORDER BY orgname.title ASC");
var parsed = dbresult.map(async function (item) {

let status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1") 

return {
itemId: item.itemId,
inid: item.inid,
description: "",
title: item.title,
status: status,
domain: "",
id: item.id
}
});
return parsed;

    } // end list 
if(listId === 105){ // list project
let dbresult = await Db.query("SELECT egp_project.govt, egp_project.bank, egp_project.fiscalyear AS yearid, egp_fiscalyear.title AS fiscalyear, egp_project.disbursed, egp_project.agreementno , egp_project.total, egp_project.id AS itemId, egp_project.inid, egp_project.title, egp_project.description, egp_project.uuid AS id FROM egp_project INNER JOIN egp_fiscalyear ON (egp_project.fiscalyear=egp_fiscalyear.id OR egp_project.fiscalyear=egp_fiscalyear.inid) WHERE egp_project.status = 1 AND egp_fiscalyear.status=1 ORDER BY egp_fiscalyear.title DESC");
var parsed = dbresult.map(async function (item) {

let status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")            


return {
itemId: item.itemId,
inid: item.inid,
description: "",
title: item.title,
status: status,
description: item.description,
id: item.id,
zip: item.total,
stringfour: item.bank,
total: item.yearid,
city: item.govt,
address:item.disbursed,
province:item.agreementno, 
}
});
return parsed;
    } // end list project
	  
	  if(listId === 123){ // list solicitation
        let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM egp_solicitation WHERE status = 1 ORDER BY title ASC");
        var parsed = dbresult.map(async function (item) {
        let status = 1;
                 
          return {
              itemId: item.itemId,
              inid: item.inid,
              description: "",
              title: item.title,
              status: status,
              domain: "",
              id: item.id
          }
      });
      return parsed;
    } // end list project
	 /* if(listId === 146){ // list content type
        let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM contenttype WHERE status = 1 ORDER BY title ASC");
        var parsed = dbresult.map(async function (item) {
        let status = 1;
                 
          return {
              itemId: item.itemId,
              inid: item.inid,
              description: "",
              title: item.title,
              status: status,
              domain: "",
              id: item.id
          }
      });
      return parsed;
    } // end list project
	*/
		  if(listId === 144){ // list procurement officer
        let dbresult = await Db.query("SELECT useprofile.userid AS itemId, useprofile.fullname AS title, useprofile.uuid AS id FROM useprofile INNER JOIN user ON (user.id = useprofile.userid) WHERE useprofile.status = 1 AND user.status=1 AND user.typeid =2 ORDER BY useprofile.fullname ASC");
        var parsed = dbresult.map(async function (item) {
        let status = 1;
                 
          return {
              itemId: item.itemId,
              inid: 0,
              description: "",
              title: item.title,
              status: status,
              domain: "",
              id: "officerID"+item.id
          }
      });
      return parsed;
    } // end list project
	 if(listId === 142){ // list repo type
        let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM repotype WHERE status = 1 ORDER BY title ASC");
        var parsed = dbresult.map(async function (item) {
        let status = 1;
                 
          return {
              itemId: item.itemId,
              inid: item.inid,
              description: "",
              title: item.title,
              status: status,
              domain: "",
              id: item.id
          }
      });
      return parsed;
    } // end list repo ty[e
	  if(listId === 124){ // list procurement type
        let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM egp_type WHERE status = 1 ORDER BY title ASC");
        var parsed = dbresult.map(async function (item) {
        let status = 1;
                 
          return {
              itemId: item.itemId,
              inid: item.inid,
              description: "",
              title: item.title,
              status: status,
              domain: "",
              id: item.id
          }
      });
      return parsed;
    } // end list project
        if(listId === 27){ // list file repo
          let dbresult = await Db.query("SELECT filerepo.id AS itemId, filerepo.inid, filerepo.title, filerepo.description, filerepo.domain, filerepo.uuid AS id, filerepo.typeid AS typeid, repotype.title AS type FROM filerepo INNER JOIN repotype ON repotype.id = filerepo.typeid WHERE filerepo.status=1 ORDER BY filerepo.title ASC");
          var parsed = dbresult.map(async function (item) {
          //let status = null;
          
            return {
                itemId: item.itemId,
                inid: item.inid,
                description: item.description,
                title: item.title,
                status: 1,
                domain: item.domain,
                id: item.id,
                fullname: item.type,
                planid: item.typeid,
            }
        });
        return parsed;
      } // end list file repo
	  
if(listId === 78 || listId === 79 || listId === 81){ // list video conf
let conftype = "video";
if(listId === 79){ conftype = "podcast";}
if(listId === 81){ conftype = "webinar";}
          let dbresult = await Db.query("SELECT videoconf.id AS itemId, videoconf.inid, videoconf.title, videoconf.description, videoconf.uuid AS id, videoconf.starttime AS address, videoconf.duration AS phone, videoconf.startdate AS zip, videoconf.timezone AS total, record AS country, mode AS city, confurl.uuid AS fullname FROM videoconf INNER JOIN confurl ON (confurl.confid = videoconf.id OR confurl.confid = videoconf.inid) WHERE videoconf.status=1 AND videoconf.conftype = "+ con.escape(conftype)+" AND (videoconf.domain = 'def' || videoconf.domain=" + con.escape(auth.domainName) +") ORDER BY videoconf.title ASC");
          var parsed = dbresult.map(async function (item) {
          //let status = null;

return {
itemId: item.itemId,
inid: item.inid,
description: item.description,
title: item.title,
id: item.id,
zip: item.zip,
phone: item.phone, 
address: item.address,
city: item.city,
fullname: item.fullname,
total: item.total,
country: item.country,
} });
        return parsed;
      } // end list video conf	 	  
	   if(listId === 68 || listId === 77){ // list send file repo
	   let mediaFile = 0;
let dbresult = await Db.query("SELECT filerepo.id AS itemId, filerepo.inid, filerepo.title, filerepo.description, filerepo.uuid AS id FROM filerepo WHERE mediafile = " + con.escape(mediaFile) +" AND filerepo.status=1 AND filerepo.id IN (SELECT rowid FROM itemstatus WHERE itemstatus.status =1 AND itemstatus.domain=" + con.escape(auth.domainName) +" AND itemstatus.tbl = 27) ORDER BY filerepo.title ASC");
var parsed = dbresult.map(async function (item) {
let repoFiles = await Db.query("SELECT originalname, newname, uuid FROM filerepos WHERE filerepos.status=1 AND filerepos.repoid = "+con.escape(parseInt(item.inid > 0 ? item.inid : item.itemId))+" ORDER BY originalname ASC");
var parsedD = repoFiles.map(async function (itemD) {
return {
s1description: itemD.newname,
s1title: itemD.originalname,
s1id: itemD.uuid
}
});

return {
id: item.id,
inid: item.inid,
description: item.description,
title: item.title,
itemId: item.itemId,
subone: parsedD
}
});
return parsed;

      } // end list send file repo
	   if(listId === -5){ // list conf participants
let dbresult = await Db.query("SELECT id AS itemId, title, email, emailiv, uuid AS id, mode FROM videoconfparticipants WHERE status = 1 AND videoconfid = " + con.escape(parseInt(args.sectionid)) +" ORDER BY title ASC");
var parsed = dbresult.map(async function (item) {
return {
itemId: item.itemId,
province: Utils.decrypt({iv: item.emailiv, content: item.email}),
username: item.title,
description: item.id,
address: item.mode,
}
});
return parsed;

      } // end list conf participants      
          if(listId === -2){ // get agent profile
            //let dbresult = await Db.query("SELECT id, inid, fullname, gender, address, city, province, country, phone, uuid FROM useprofile INNER JOIN gender ON (gender.id = useprofile.gender OR gender.inid = useprofile.gender) WHERE useprofile.domain=" + con.escape(auth.domainName) +" AND useprofile.status=1 AND gender.status = 1");
            let dbresult = await Db.query("SELECT useprofile.id AS itemId, useprofile.inid, fullname, zip, gender, address, city, province, country, phone, useprofile.uuid AS id FROM useprofile INNER JOIN gender ON (gender.id = useprofile.gender OR gender.inid = useprofile.gender) WHERE useprofile.status=1 AND gender.status = 1 AND useprofile.userid = " + con.escape(auth.userId)+" ORDER BY id DESC LIMIT 0, 1");
	 return dbresult;  }
          
            if(listId === 1){ //list channels
              //return await Db.query("SELECT id, inid, description, title, uuid FROM channels WHERE status = 1");
              let dbresult = await Db.query("SELECT id AS itemId, inid, description, title, uuid AS id FROM record WHERE status = 1");
              var parsed = dbresult.map(async function (item) {
              let status = null;
              status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")
              return {
                  itemId: item.itemId,
                  inid: item.inid,
                  status: status,//itemstatus,
                  description: item.description,
                  title: item.title,
                  id: item.id
              }
            })
            return parsed;
             }
 if(listId === 52){ //list pricing
              //return await Db.query("SELECT id, inid, description, title, uuid FROM channels WHERE status = 1");
              let dbresult = await Db.query("SELECT planid AS typeid, price AS title FROM pricing WHERE status = 1 ORDER BY typeid ASC");
            return dbresult;
             }
             if(listId === 9){ // list settings
             let dbresult = await Db.query("SELECT id AS itemId, inid, description, title, uuid AS id FROM module WHERE status = 1 AND parentid = 9 ORDER BY title ASC");
             var parsed = dbresult.map(async function (item) {
             let status = null;
             status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")
                  return {
                    itemId: item.itemId,
                    inid: item.inid,
                    status: status,
                    description: item.description,
                    title: item.title,
                    id: item.id
                }                
            });
			 
            return parsed;
          }
		     if(listId === -9){ // list settings pub
             let dbresult = await Db.query("SELECT id AS itemId, inid, description, title, uuid AS id FROM module WHERE (groupid = 3 OR id IN (110, 111) ORDER BY title ASC");
             var parsed = dbresult.map(async function (item) {
             let status = null;
             status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")
                  return {
                    itemId: item.itemId,
                    inid: item.inid,
                    status: status,
                    description: item.description,
                    title: item.title,
                    id: item.id
                }                
            });
            return parsed;
          }
          if(listId === 98){ // list conference settings
            let dbresult = await Db.query("SELECT id AS itemId, inid, description, title, uuid AS id FROM confsettings WHERE status = 1 ORDER BY title ASC");
            var parsed = dbresult.map(async function (item) {
            let status = null;
            status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND editid = "+con.escape(parseInt(args.sectionid))+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1")
                 return {
                   itemId: item.itemId,
                   inid: item.inid,
                   status: status,
                   description: item.description,
                   title: item.title,
                   id: item.id
               }
               
           });
           return parsed;
         }
          if(listId === 28){ // list firewall
            let dbresult = await Db.query("SELECT id AS itemId, inid, description, title, uuid AS id FROM firewall WHERE status = 1 ORDER BY title ASC");
            var parsed = dbresult.map(async function (item) {
            let status = null;
            status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1");
                 return {
                   itemId: item.itemId,
                   inid: item.inid,
                   status: status,//itemstatus,
                   description: item.description,
                   title: item.title,
                   id: item.id
               }
               
           });
           return parsed;
         }
          if(listId === 10){ // list languages
            let dbresult = await Db.query("SELECT id AS itemId, inid, description, title, uuid AS id FROM languages WHERE status = 1 ORDER BY title ASC");
            var parsed = dbresult.map(async function (item) {
            let status = null;
            status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1");
                 return {
                   itemId: item.itemId,
                   inid: item.inid,
                   status: status,//itemstatus,
                   description: item.description,
                   title: item.title,
                   id: item.id
               }
               
           });
           return parsed;
         }
		    if(listId === 5){ // list chat history
            let total = [];
            let dbresult = await Db.query("SELECT DISTINCT(date_format(date, '%Y-%m-%d')) AS date FROM session WHERE domain = " + 
            con.escape(auth.domainName));

               dbresult.every(async function(arrayItem, index) {
                let tempTotal = {};
  
               // if (arrayItem.domain === lastDomainXter) { 
                tempTotal.date = arrayItem.date;
                tempTotal.completed = Db.checkValue("SELECT id AS itemId FROM session WHERE status = 6 AND date_format(date, '%Y-%m-%d') = "+con.escape(arrayItem.date));
                tempTotal.noanswer = Db.checkValue("SELECT id AS itemId FROM session WHERE (status = 8 || status = 5 || endedby = 15) AND date_format(date, '%Y-%m-%d') = "+con.escape(arrayItem.date)+" AND domain = " + 
                con.escape(auth.domainName));
                tempTotal.broken = Db.checkValue("SELECT id AS itemId FROM session WHERE status = 7 AND date_format(date, '%Y-%m-%d') = "+con.escape(arrayItem.date)+" AND domain = " + 
                con.escape(auth.domainName));
                tempTotal.total = Db.checkValue("SELECT id AS itemId FROM session WHERE (status = 7 || status = 8 || status = 6 || status = 5 || endedby = 15) AND date_format(date, '%Y-%m-%d') = "+con.escape(arrayItem.date)+" AND domain = " + con.escape(auth.domainName));
                //tempTotal.total = parseInt(tempTotal.completed)+parseInt(tempTotal.noanswer)+parseInt(tempTotal.broken);
                 total.push(tempTotal);
              }); 
              return total;
            } // end chat history
if(listId === 72){ // list offline text
let text = await Db.query("SELECT description, uuid AS id FROM offlinetext WHERE status = 1");
return text;
} // end offline text
if(listId === 74){ // list connection text
let text = await Db.query("SELECT description, title, uuid AS id FROM record WHERE status = 1 AND type="+con.escape(parseInt(listId)));
return text;
} // end connection text
       if(listId === 73){ // DashBoard
			let total = [];
			let tempTotal = {};
            let agentsTotal = await Db.query("SELECT user.id FROM user WHERE user.status = 1 AND user.typeid = 2 AND (user.id IN (SELECT rowid FROM itemstatus WHERE itemstatus.status = 1 AND itemstatus.tbl = 24) OR user.inid IN (SELECT rowid FROM itemstatus WHERE itemstatus.status = 1 AND itemstatus.tbl = 24))");
let agentsOnline = await Db.query("SELECT id FROM itemstatus WHERE status = 1 AND tbl = 24");
let video = await Db.query("SELECT id FROM itemstatus WHERE status = 1 AND tbl = 9 AND rowid = 42");
let audio = await Db.query("SELECT id FROM itemstatus WHERE status = 1 AND tbl = 9 AND rowid = 41");
let screenShare = await Db.query("SELECT id FROM itemstatus WHERE status = 1 AND tbl = 9 AND rowid = 43");
let attachment = await Db.query("SELECT id FROM itemstatus WHERE status = 1 AND tbl = 9 AND rowid = 50");
let repo = await Db.query("SELECT id FROM itemstatus WHERE status = 1 AND tbl = 9 AND rowid = 49");
			tempTotal.typeid = agentsTotal.length;
			tempTotal.itemId = agentsOnline.length;
			tempTotal.title = video.length;
			tempTotal.total = audio.length;
			tempTotal.username = screenShare.length;
			tempTotal.address = attachment.length;
			tempTotal.city = repo.length;
			total.push(tempTotal);
              return total;
            } // end chat history
			 if(listId === 30){ // list subscriptios
            let dbresult = await Db.query("SELECT subscription.uuid AS id, subscription.title, subscription.description, subscriptionplans.title AS province, subscription.id AS typeid, subscription.id AS itemId, subscription.inid AS inid, subscription.duration AS planid FROM subscription INNER JOIN  subscriptionplans ON subscriptionplans.id = subscription.planid WHERE subscription.status=1 AND subscriptionplans.status = 1 ORDER BY subscription.title ASC ");

var parsed = dbresult.map(async function (item) {
//let currId = (parseInt(item.inid) > 0 ? item.inid : item.itemId);
let dbresult1 = await Db.query("SELECT date_format(expires, '%Y-%m-%d') AS date FROM payments WHERE status = 1 AND (subid = "+con.escape(parseInt(parseInt(item.inid) > 0 ? item.inid : item.itemId))+") ORDER BY id DESC LIMIT 0, 1");
			//  let deptTitle = await getTitle("SELECT title FROM department WHERE status = 1 AND (id = "+con.escape(item.department)+" || inid = "+con.escape(item.department)+") AND (domain = "+con.escape(auth.domainName)+" || domain = 'def') LIMIT 0, 1")
			  
                 return {
                   itemId: item.itemId,
                   inid: item.inid,
                   date: (dbresult1.length > 0) ? dbresult1[0].date : "",
                   title: item.title,
                   id: item.id,
                   description: item.description,
                   province: item.province,
				   typeid: item.typeid,
				   planid: item.planid
               }
               
           });
           return parsed;
            } // end subscriptios
			   if(listId === 29){ // list subscription plans
 let dbresult = await Db.query("SELECT basic AS total, professional AS typeid, title, enterprise AS itemId, uuid AS id FROM module WHERE status IN (1, -2) AND id NOT IN (1, 4, 6, 10, 11, 29, 30, 74, 87, 3, 72, 88, 9, 49) ORDER BY title ASC");   
           return dbresult
            } // end subscription plans
          //  } // end for admin
          
if(listId === 88){ // list incoming transfers 
let getTransfer = await Db.query("SELECT userid, DATE_FORMAT(date, '%M %d %Y %T %p') AS date, id AS itemId, sessionid, receiverid, inid, uuid AS id FROM transfers WHERE status = 1 AND receiverid = " + con.escape(auth.userId) + " ORDER BY transfers.id ASC LIMIT 0, 1");
    var parsed = getTransfer.map(async function (item) {
    return {
    itemId: item.itemId,
    inid: item.inid,
    status: item.sessionid,//itemstatus,
    title: await Utils.GetAgentName(item.userid),
    id: item.id,
    date: item.date,
    total: item.userid,
    addnew: item.receiverid,
    subone: await getAllMsg(item.sessionid)
    }});
  return parsed;
  } // end list TRANSFERS
      
if(listId === 97){ // list org logo
return await Db.query("SELECT newname AS title, originalname AS description, uuid AS id FROM orglogo WHERE status = 1  ORDER BY id DESC LIMIT 0, 1");  } // end org logo

     
if(listId === 102){ // list org name
  return await Db.query("SELECT title, description, uuid AS id FROM orgname WHERE status = 1 ORDER BY id DESC LIMIT 0, 1");  } // end org logo
    
if(listId === 91){ // list out going transfers
let getTransfer = await Db.query("SELECT userid, date, id AS itemId, sessionid, receiverid, inid, uuid AS id, status FROM transfers WHERE (status = 1 OR status = 8) AND sessionid = " + con.escape(args.sessionid) + " AND userid = " + con.escape(auth.userId) + " ORDER BY transfers.id ASC LIMIT 0, 1");

var parsed = getTransfer.map(async function (item) {
return {
itemId: item.itemId,
inid: item.inid,
status: item.status,//itemstatus,
title: await Utils.GetAgentName(item.userid),
id: item.id,
date: item.date,
total: item.sessionid,
addnew: item.receiverid,
subone: await getAllMsg(item.sessionid)
}});

return parsed;
} // end list 

if(listId === 7){ // list offline message userId typeId
let getOfflineMsg = await Db.query("SELECT offlinemsg.id AS itemId, department, offlinemsg.inid, offlinemsg.description, offlinemsg.title, offlinemsg.email, offlinemsg.date, offlinemsg.iv, offlinemsg.uuid AS id, offlinemsg.sessionid FROM offlinemsg WHERE offlinemsg.status = 1 AND offlinemsg.id NOT IN (SELECT rowid FROM itemstatus WHERE tbl = 7 AND itemstatus.status = 1) ORDER BY offlinemsg.id ASC" );


if(parseInt(auth.typeId) === 2){
getOfflineMsg = await Db.query("SELECT offlinemsg.id AS itemId, department, offlinemsg.inid, offlinemsg.description, offlinemsg.title, offlinemsg.email, offlinemsg.date, offlinemsg.iv, offlinemsg.uuid AS id, offlinemsg.sessionid FROM offlinemsg WHERE offlinemsg.status = 1  AND offlinemsg.id NOT IN (SELECT rowid FROM itemstatus WHERE tbl = 7 AND itemstatus.status = 1) AND department IN (SELECT itemstatus.rowid FROM itemstatus WHERE itemstatus.status = 1 AND itemstatus.tbl = 14 AND itemstatus.editid = "+con.escape(auth.userId)+") ORDER BY itemId ASC" );}

var parsed = getOfflineMsg.map(async function (item) {
  let status = null;
  status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1");
 let deptTitle = await getTitle("SELECT title FROM department WHERE status = 1 AND (id = "+con.escape(item.department)+" || inid = "+con.escape(item.department)+") LIMIT 0, 1");
  let show = await getAgentDept(auth.userId, auth.domainName, item.department);
  let getMail = Utils.decrypt({iv: item.iv, content: item.email});
  //if(parseInt(item.sessionid) === 0){getMail = await Utils.decryptV1({iv: item.iv, content: item.email});}
if(parseInt(auth.typeId) === 1 || show.total === 0){  
  return {
  itemId: item.itemId,
  inid: item.inid,
  status: status,//itemstatus,
  description: item.description,
  title: item.title,
  id: item.id,
  email: getMail,
  total: item.department,
  date: item.date,
  zip: deptTitle
  }}
  if(parseInt(auth.typeId) !== 1 && show.status > 0){  
  return {
  itemId: item.itemId,
  inid: item.inid,
  status: status,//itemstatus,
  description: item.description,
  title: item.title,
  id: item.id,
  email: getMail,
  total: item.department,
  date: item.date,
  zip: deptTitle
  }}
  });
return parsed;
} // end list offline msg

 if(listId === 15){ // gender list for form
return await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM gender WHERE status = 1 ORDER BY title ASC" );}
if(listId === -15){ // get current version
let seen = 0;
let version;
let id;
let curVersion = await Db.query("SELECT title, uuid AS id FROM versions WHERE status = 1 ORDER BY versions.id DESC LIMIT 0,1" );
let versionSeen = await Db.query("SELECT status FROM versionseen WHERE status = 1" );
if((versionSeen.length) > 0) {seen = 1;}
if((curVersion.length) > 0) {version = curVersion[0].title; id = curVersion[0].id;}
let returnVal = [{itemId:seen, inid:seen, title:version, id:id}];
return returnVal; }
 if(listId === 83){ // time zone list for form
 return await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM timezone WHERE status = 1 ORDER BY title ASC" );}
if(listId === 84){ // participants number gender list for form
return await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM participantssize WHERE status = 1 ORDER BY id ASC" );}
if(listId === 53){ // COUNTRY list for form
let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM countries WHERE status = 1 ORDER BY title ASC" );return dbresult;}
if(listId === 87){ // department list for form
let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM department WHERE status = 1 ORDER BY title ASC" );return dbresult;}
if(listId === 90){ // online agents list for form
let dbresult = await Db.query("SELECT user.id AS itemId, user.inid, user.username, user.uuid AS id, user.usernameiv FROM user WHERE user.status = 1 AND user.id <> "+con.escape(auth.userId)+" AND user.id IN (SELECT rowid FROM itemstatus WHERE itemstatus.status = 1 AND itemstatus.tbl = 24)"); 


var parsed = dbresult.map(async function (item) {
return {
id: item.id,
inid: item.inid,
title: await Utils.GetAgentName(item.itemId)+ " ( "+ Utils.decrypt({iv: item.usernameiv, content: item.username})+" ) ",
itemId: item.itemId
}
}); 
return parsed;
}
if(listId === 24){ // default agent status
return await Db.query("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape(auth.userId)+") LIMIT 0, 1");}

if(listId === 3){ // list incoming request
let incomingdbresult;             
if(parseInt(auth.typeId) === 1){
incomingdbresult = await Db.query("SELECT DATE_FORMAT(date, '%M %d %Y %T %p') AS date, clientsocketid AS address, uuid AS id, id AS itemId, inid, customerref, department FROM session WHERE status = 13 ORDER BY id ASC LIMIT 0, 1 ");}

if(parseInt(auth.typeId) === 2){
incomingdbresult = await Db.query("SELECT DATE_FORMAT(date, '%M %d %Y %T %p') AS date, clientsocketid AS address, uuid AS id, id AS itemId, inid, customerref, department FROM session WHERE status = 13 AND department IN (SELECT rowid FROM itemstatus WHERE status = 1 AND tbl = 14 AND editid = "+con.escape(auth.userId)+") ORDER BY id ASC LIMIT 0, 1 ");}

var parsed = incomingdbresult.map(async function (item) {
let name = await getTitle("SELECT name AS title FROM customers WHERE status = 1 AND (id = "+con.escape(parseInt(item.customerref))+" OR inid= "+con.escape(parseInt(item.customerref))+") ORDER BY id DESC LIMIT 0, 1");
let show = await getAgentDept(auth.userId, auth.domainName, item.department);
if(parseInt(auth.typeId) === 1 || show.total === 0){  
return {
date: item.date,
address: item.address,
id: item.id,
inid: item.inid,
description: item.description,
itemId: item.itemId,
title: name,
zip:await getTitle("SELECT title FROM department WHERE status = 1 AND (id = "+con.escape(parseInt(item.department))+" OR inid= "+con.escape(parseInt(item.department))+")"),
}}
else if((parseInt(auth.typeId) !== 1 || parseInt(show.total) > 0 ) && parseInt(show.status) > 0){ 
return {
date: item.date,
address: item.address,
id: item.id,
inid: item.inid,
description: item.description,
itemId: item.itemId,
title: name,
zip: await getTitle("SELECT title FROM department WHERE status = 1 AND (id = "+con.escape(parseInt(item.department))+" OR inid= "+con.escape(parseInt(item.department))+")"),
}} else { return emptyResult;  }});
return parsed;}

if(listId === 86){ // list incoming audio video cal
return await Db.query("SELECT uuid AS id, rtctype AS fullname FROM incomingcall WHERE status = 1 AND sessionid = " + con.escape(args.sessionid)+" AND sectionid = " + con.escape(args.sectionid)+" ORDER BY incomingcall.id ASC LIMIT 0,1");}

if(listId === 59){ // list footer
return await Db.query("SELECT description, title, id AS itemId, inid, uuid AS id FROM module WHERE (access=" + con.escape(auth.typeId) +" || access=2) AND id IN (62, 71) ORDER BY itemId ASC");}
  
  
	  
if(listId === 18){ // check active chat
const items = await Db.query("SELECT clientsocketid, uuid AS id, userid, id AS itemId, customerref, department FROM session WHERE status = 1  AND userid =  "+con.escape(parseInt(auth.userId))+" AND sectionid =  "+con.escape(parseInt(args.sectionid))+" ORDER BY id ASC LIMIT 0, 1 ");

if(items.length > 0){ 
let customerName = "";
const cusName = await Db.query ("SELECT `name`, customerid FROM customers WHERE id="+con.escape(items[0].customerref)+" LIMIT 0,1");
if(cusName.length > 0){ customerName = cusName[0].name; customerNumber = cusName[0].customerid;}
result = [{status:1, msg:customerName, description: items[0].userid, itemId: items[0].itemId, province: Utils.GetAgentName(auth.userId), address: items[0].clientsocketid, username: items[0].id, title:customerNumber}];
  } else {
    result = [{status:0, msg:0, description: "NA", address: "NA", title: "NA", itemId: 0, province:"", username:"", title:""}];
  }
  return result;  
}         
           //res.send(dbresult);
  return dbresult;
          }},
            
          },
         
  };
  