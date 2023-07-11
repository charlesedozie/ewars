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


console.log(args);
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
        con.escape(auth.userId)+", "+con.escape(usernameHash.content.toLowerCase())+", "+con.escape(args.input.planid)+", "+con.escape(UUID)+", "+con.escape(usernameHash.iv.toLowerCase())+")");

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
if(parseInt(args.input.formid) === 12 || parseInt(args.input.formid) === 193 || parseInt(args.input.formid) === 194 || parseInt(args.input.formid) === 114 || parseInt(args.input.formid) === 189 || parseInt(args.input.formid) === 165 || parseInt(args.input.formid) === 164 || parseInt(args.input.formid) === 76){ // create department record
console.log('1');
if (!args.input.fullname || args.input.fullname === '') {
result.msg = result.msg+"Title, "; result.status = 0; }
console.log('2');

if (!args.input.description || args.input.description === '') { 
result.msg = result.msg+"Description, "; result.status = 0; }
console.log('3');

if(args.input.fullname){
const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:2|required'}), 'fullname').catch(function(e) {
  result.msg = result.msg+e; });
  if(!minFullname){result.status = 0; }}
console.log('4');

if(result.status === 0) {return result; }
if(parseInt(args.input.domain) !== 0){
if(args.input.frmtype === 1){
const titleExists = await Db.checkValue("SELECT status FROM record WHERE status = 1 AND title = "+con.escape(args.input.fullname)+" AND type="+con.escape(parseInt(args.input.formid))+" LIMIT 0, 1")
    if(titleExists > 0){
      result.msg = 'Title exits'
      result.status = 0; 
      return result;
    }  }  
console.log('5');

   if(args.input.frmtype === 2){
    const titleExists = await Db.checkValue("SELECT status FROM record WHERE (type="+con.escape(parseInt(args.input.formid))+" AND status = 1 AND id <> "+con.escape(parseInt(args.input.id))+" AND inid <> "+con.escape(parseInt(args.input.id))+" AND title = "+con.escape(args.input.fullname)+") LIMIT 0, 1")
  if(titleExists > 0){
     result.msg = 'Title exits'
    result.status = 0; 
     return result;
    }
    await Db.dbUpdate("UPDATE record SET status = 2 WHERE ((id = "+con.escape(parseInt(args.input.id))+" || inid = "+con.escape(parseInt(args.input.id))+"))");
  }   }

  if(result.status === 0){return result;}

  //if(args.input.frmtype === 1){
    const department = await Db.dbUpdate("INSERT INTO record (userid, title, description, type, inid) VALUES ("+
      con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
      con.escape(args.input.description)+", "+con.escape(parseInt(args.input.formid))+", "+con.escape(parseInt(args.input.id))+")");
  //}

      result.status = 1;
      result.msg = "Done";
    } // end create department
	
	
	
if(parseInt(args.input.formid) === 169){ // create alert
if (!args.input.fullname || args.input.fullname === '') {
result.msg = result.msg+"Title, "; result.status = 0; }

if (!args.input.description || args.input.description === '') { 
result.msg = result.msg+"Description, "; result.status = 0; }

if(args.input.fullname){
const minFullname = await Utils.validate(Utils.setValidation({fullname: args.input.fullname},{fullname: 'minLength:4|required'}), 'fullname').catch(function(e) {
  result.msg = result.msg+' Title can not be less than five charaters '; });
  if(!minFullname){result.status = 0; }}
  
  if(args.input.description){
const mindescription = await Utils.validate(Utils.setValidation({description: args.input.description},{description: 'minLength:20|required'}), 'description').catch(function(e) {
  result.msg = result.msg+' Description can not be less than twenty characters' });
if(!mindescription){result.status = 0; }}

if(result.status === 0) {return result; }
if(result.status === 0){return result;}
 
  //if(args.input.frmtype === 1){
    const department = await Db.dbUpdate("INSERT INTO record (userid, title, description, type, inid, channel, status) VALUES ("+
      con.escape(auth.userId)+", "+con.escape(args.input.fullname)+", "+
      con.escape(args.input.description)+", "+con.escape(parseInt(args.input.formid))+", "+con.escape(parseInt(args.input.id))+", "+con.escape(parseInt(args.input.planid))+", "+con.escape(parseInt(args.input.status))+")");
  //}
      result.status = 1;
      result.msg = "Done";
    } // end create alert

    
if(parseInt(args.input.formid) === 180 || parseInt(args.input.formid) === 181 || parseInt(args.input.formid) === 182 || parseInt(args.input.formid) === 183 || parseInt(args.input.formid) === 184){ // create settings message
 if (!args.input.description || args.input.description === '') { 
  result.msg = result.msg+"Description, "; result.status = 0; }
if(result.status === 0) {return result; }

await Db.dbUpdate("UPDATE record SET status = 2 WHERE status = 1 AND type = 9 AND rowid = "+con.escape(parseInt(args.input.rowid)));

await Db.dbUpdate("INSERT INTO record (userid, title, description, type, rowid) VALUES ("+
con.escape(auth.userId)+", 'NA', "+con.escape(args.input.description)+", "+con.escape(parseInt(args.input.tbl))+", "+con.escape(parseInt(args.input.rowid))+")");


result.status = 1;
result.msg = "Done";
} // end create settings message

      } // end applies to admin

if(parseInt(args.input.frmtype) === 2 && parseInt(args.input.formid) === -3){
var { tbl, rowid, itemstatus, id = 0 } = args.input;
if((id === 0 || id === "undefined"|| id === "") && parseInt(tbl) === 94){id = auth.userId;}
Db.itemStatus (tbl, rowid, itemstatus, auth.userId, auth.domainName, id);
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
if(parseInt(tbl) === 12){
await Db.dbUpdate("UPDATE record SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}
if(parseInt(tbl) === 115 && (!args.input.planid || parseInt(args.input.planid) !== -115)){
  await Db.dbUpdate("UPDATE user SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
  }
  if(parseInt(tbl) === 115 && args.input.planid && parseInt(args.input.planid) === -115){ 
  await Db.dbUpdate("UPDATE user SET status = 32, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
  }
if(parseInt(tbl) === 2){
await Db.dbUpdate("UPDATE user SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
}
if(parseInt(tbl) === 27){
    await Db.dbUpdate("UPDATE filerepo SET status = 4, userid = "+con.escape(auth.userId)+" WHERE status = 1 AND (id = "+con.escape(rowid)+" OR inid = "+con.escape(rowid)+")")
    }
result.msg = "Done"; result.status = 1;
return result;  
}		  
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
  return await Db.query("SELECT title, id AS itemId, inid, addnew, uuid AS id, description, parentid AS sidegroup, groupid FROM module WHERE (access=" + con.escape(auth.typeId) +" || access=2) AND status=1 ORDER BY ordering ASC");
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
let status2 = 1, status3 = 1, status4 = 1, status5 = 1;
if(listId === 169){ status2 = 45, status3 = 46, status4 = 48, status5 = 49; }

let dbresult;
if(parseInt(auth.typeId) === 1){
dbresult = await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id, sender, channel, mobile, alertprogress, status, type, DATE_FORMAT(record.date, '%M %d %Y') AS zip FROM record WHERE type= "+con.escape(parseInt(listId))+" AND (status = 1 || status = "+con.escape(parseInt(status2))+" || status = "+con.escape(parseInt(status3))+" || status = "+con.escape(parseInt(status4))+" || status = "+con.escape(parseInt(status5))+" ) ORDER BY title ASC");}
if(parseInt(auth.typeId) !== 1){
dbresult = await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id, sender, channel, mobile, alertprogress, status, type, DATE_FORMAT(record.date, '%M %d %Y') AS zip FROM record WHERE type= "+con.escape(parseInt(listId))+" AND userid = "+con.escape(parseInt(auth.typeId))+" AND  (status = 1 || status = "+con.escape(parseInt(status2))+" || status = "+con.escape(parseInt(status3))+" || status = "+con.escape(parseInt(status4))+" || status = "+con.escape(parseInt(status5))+" ) ORDER BY title ASC");}

var parsed = dbresult.map(async function (item) {

let statuscode = null;
if(parseInt(listId) === 169){
statuscode = await getTitle("SELECT title FROM statuscode WHERE status = 1 AND id = "+con.escape(parseInt(item.status))+" LIMIT 0, 1");	
} 

let status = await Db.checkValue("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape((item.inid > 0 ? item.inid : item.itemId))+") LIMIT 0, 1");

let channel = ''; 
if(parseInt(item.channel) > 0){ channel = await getTitle("SELECT title FROM statuscode WHERE status = 1 AND id = "+con.escape(parseInt(item.channel))+" LIMIT 0, 1"); }

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
stringfour: item.status,
stringfive: item.type,
stringsix: item.zip,
stringseven: statuscode,
id: item.id
}
});
console.log(parsed);
return parsed;
} // end list department

if(listId === 163){ // list akerts for front end
let dbresult = await Db.query("SELECT record.id AS itemId, record.inid, record.title, record.description, record.uuid AS id, record.sender, record.channel, DATE_FORMAT(record.date, '%M %d %Y') AS zip, record.status, statuscode.title AS alerttitle FROM record INNER JOIN statuscode ON statuscode.id = record.status WHERE  record.type=192 AND record.userid = " + con.escape(auth.userId)+" ORDER BY record.date DESC");

var parsed = dbresult.map(async function (item) {

return {
itemId: item.itemId,
inid: item.inid,
description: item.description,
title: item.title,
status: 0,
domain: item.alerttitle,
id: item.id,
stringone:item.zip
}
});
return parsed;
} // end list department


if(listId === 146 || listId === 152 || listId === 26){ // list menu dashboard
return await Db.query("SELECT id AS itemId, inid, title, description, uuid AS id, parentid AS stringtwo FROM module WHERE status = 1 ORDER BY title ASC");
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
	
	
	
          if(listId === -2){ // get agent profile
            //let dbresult = await Db.query("SELECT id, inid, fullname, gender, address, city, province, country, phone, uuid FROM useprofile INNER JOIN gender ON (gender.id = useprofile.gender OR gender.inid = useprofile.gender) WHERE useprofile.domain=" + con.escape(auth.domainName) +" AND useprofile.status=1 AND gender.status = 1");
            let dbresult = await Db.query("SELECT useprofile.id AS itemId, useprofile.inid, fullname, zip, gender, address, city, province, country, phone, useprofile.uuid AS id FROM useprofile INNER JOIN gender ON (gender.id = useprofile.gender OR gender.inid = useprofile.gender) WHERE useprofile.status=1 AND gender.status = 1 AND useprofile.userid = " + con.escape(auth.userId)+" ORDER BY id DESC LIMIT 0, 1");
	 return dbresult;  }
          
       
	   
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
			  
			  

 if(listId === 15){ // gender list for form
return await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM gender WHERE status = 1 ORDER BY title ASC" );
 }

 
 if(listId === -15){ // gender list team form
  return await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM statuscode WHERE status = 1 AND id IN (42,43,44) ORDER BY title ASC");
 }

if(listId === 83){ // time zone list for form
 return await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM timezone WHERE status = 1 ORDER BY title ASC" );}
 
 
if(listId === 53){ // COUNTRY list for form
let dbresult = await Db.query("SELECT id AS itemId, inid, title, uuid AS id FROM countries WHERE status = 1 ORDER BY title ASC" );return dbresult;}


if(listId === 24){ // default agent status
return await Db.query("SELECT status FROM itemstatus WHERE (status = 1 AND tbl = "+con.escape(listId)+" AND rowid = "+con.escape(auth.userId)+") LIMIT 0, 1");}
    
           //res.send(dbresult);
  return dbresult;
          }},
            
          },
         
  };
  