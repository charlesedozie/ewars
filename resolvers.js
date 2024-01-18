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
let result = {status:'0', userId:null, domainName:null, typeId:null, useruuid:null}
if( deocdeToken = await prcLogin.DecodeJWT(userToken)){ result = deocdeToken; }
return result
}

async function addData(col, value, id){
if(Db.dbUpdate("UPDATE data SET "+col+" = "+con.escape(value)+"  WHERE dataid = "+con.escape(parseInt(id)))){
return true; } 
return false;
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
let result = {status:'1', msg:"Error: ", itemId: 0, typeid:0, address:null}  
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


let getFormData = [34,35,4,19,5,18,14,21,20,31,11,1,36]; // create record
if(getFormData.includes(parseInt(args.input.formid))){ 
if(args.input.typeid === 'addnew'){ 
// Check data
if(parseInt(args.input.formid) != 11){
let dataExists = await Db.checkValue("SELECT dataid FROM data WHERE status = 1 AND address = "+con.escape(args.input.address)+" AND formid = "+con.escape(args.input.formid)+" ORDER BY dataid DESC LIMIT 0, 1");

if(dataExists > 0){
result.msg = 'Record with same name exists'
result.status = 0; 
return result;
}  
}
let control = await Db.dbUpdate("INSERT INTO data (userid, formid) VALUES ("+con.escape(auth.userId)+","+con.escape(args.input.formid)+")");

if(control){
let getId = await Db.dbUpdate("SELECT dataid FROM data WHERE status = 1 AND userid = "+con.escape(auth.userId)+" AND formid = "+con.escape(args.input.formid)+" ORDER BY dataid DESC LIMIT 0, 1");
	
for (const [key, value] of Object.entries(args.input)) {
if(key != 'id' && key != 'status' && key != 'frmtype' && key != 'password' && key != 'addnew' && key != 'confirmPassword' && key != 'selectfield' && value != '' && value != null && await Utils.validate(Utils.setValidation({key: key},{key: 'minLength:1|required'}), 'password')){ addData(key, value, getId[0].dataid);
}}
}}}

// build form field
let dataitems = [34,35,4,19,5,18,14,21,20,31,11,1,36];
if(dataitems.includes(parseInt(args.input.formid))){ 
if(args.input.typeid === 'build'){  
let getFieldName = await Db.dbUpdate("SELECT title FROM fieldname WHERE status = 1 AND title NOT IN (SELECT fieldname FROM formfields WHERE formid = "+con.escape(args.input.formid)+") LIMIT 0, 1");

if(getFieldName.length > 0){ 
const mindescription = await Utils.validate(Utils.setValidation({title: args.input.title},{title: 'minLength:2|required'}), 'title').catch(function(e) {
result.msg = result.msg+' Title can not be less than two (2) charaters  \n'; });
if(!mindescription){result.status = 0; return result;}

const titleExists = await Db.checkValue("SELECT status FROM formfields WHERE (status = 1 AND formid = "+con.escape(args.input.formid)+" AND title = "+con.escape(args.input.title)+") LIMIT 0, 1")
if(titleExists > 0){
result.msg = 'Title exits'
result.status = 0; 
return result;
}  

await Db.dbUpdate("INSERT INTO formfields (userid, type, formid, title, required, description, fieldname) VALUES ("+
  con.escape(auth.userId)+", "+con.escape(args.input.fieldtype)+", "+con.escape(args.input.formid)+", "+con.escape(args.input.title)+", "+con.escape(args.input.required)+", "+con.escape(args.input.description)+", "+con.escape(getFieldName[0].title)+")");
  result.status = 1; result.msg = "Saved"; return result;
} else {result.status = 0; result.msg = "Maximum field number reached"; return result;}

}
if(args.input.frmtype === 1 && args.input.typeid === 'new'){
  
//let guid = await Utils.UUID();
//if(guid){ 
  //let mid = await Db.query("SELECT dataid FROM data WHERE (status = 1 AND tmpuuid = "+con.escape(guid)+") ORDER BY dataid DESC");
//if(mid){
/*
for (const [key, value] of Object.entries(args.input)) {
if(key == 'tbl' && value != '' && value != '0' && value != 'undefined'){
let fieldname = await imsertFieldName(args.input.formid, value, mid[0].dataid);

if(!fieldname){result.status = 0; result.msg = "Maximum field name reached"; return result; }
 }
 */
 //if(key != 'id' && key != 'status' && key != 'frmtype' && key != 'password' && key != 'confirmPassword'){ console.log(key+' --- '+value); addData(key, value, mid[0].dataid);}
//}
//}
//}
//}
}
result.status = 1; result.msg = "Saved"; return result;
}


if(parseInt(args.input.frmtype) === 2 && parseInt(args.input.formid) === -3){
var { tbl, rowid, itemstatus, id = 0 } = args.input;
if((id === 0 || id === "undefined"|| id === "") && parseInt(tbl) === 94){id = auth.userId;}
if(parseInt(tbl) !== 57){
Db.itemStatus (tbl, rowid, itemstatus, auth.userId, auth.domainName, id);
result.status = 1;
result.msg = "Done";
}
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
//sign out
if(parseInt(args.input.formid) === 26){
  result.status = 0  
  let dbresult = await Db.dbUpdate("UPDATE itemstatus SET status = 2 WHERE tbl=24 AND rowid = "+con.escape(auth.userId));
  if(dbresult){result.msg = "Completed"; result.status = 1; }
  return result;          
  }
 
    } // end to both admin and non admin users
      return result;  }},
        }, 

Query: {
getSiteList: async (parent, args, context, info) => { 
let siteListId = parseInt(args.listid); 
if(siteListId === -182){ // list submoduls
return await Db.query("SELECT formid AS itemId, inid AS inid, uuid AS id, groupid AS total, title, status, moduleid AS planid, description FROM form WHERE status=1  ORDER BY title ASC");
} // end list sub modules

// build form fields
if(parseInt(siteListId) == -120){
   let dbresult =  await Db.query("SELECT type AS city, title, required, description, id AS itemId, uuid AS id, inid, type AS fieldtype, fieldname AS username FROM formfields WHERE status=1 AND formid = "+con.escape(parseInt(args.arg1))+" ORDER BY ordering ASC");
 
var parsedD = dbresult.map(async function (item) {
return {
id: 'build120'+item.id,
inid: item.inid,
city: item.city,
title: item.title,
required: item.required,
description: item.description,
fieldtype: item.fieldtype,
username: item.username,
itemId: item.itemId
}
});
return parsedD;

return dbresult;
 
 // end form fileds
/*
  let dbresult = await Db.query("SELECT user.id AS itemId, user.inid AS inid, user.username, user.usernameiv, useprofile.fullname, gender.title, user.uuid AS id FROM user INNER JOIN useprofile ON useprofile.userid = user.id INNER JOIN gender ON gender.genderid = useprofile.genderid WHERE user.status=1 AND user.id <> 1 ORDER BY useprofile.fullname ASC");

  var parsedD = dbresult.map(async function (item) {
  return {
  id: item.id,
  inid: item.inid,
  username: Utils.decrypt({iv: item.usernameiv, content: item.username}),
  fullname: item.fullname,
  title: item.title,
  status: '1',
  itemId: item.itemId
  }
  });
  return parsedD;
*/


}

if(siteListId === 3){ // list users
let dbresult = await Db.query("SELECT user.id AS itemId, user.inid AS inid, user.username, user.usernameiv, useprofile.fullname, gender.title, user.uuid AS id FROM user INNER JOIN useprofile ON useprofile.userid = user.id INNER JOIN gender ON gender.genderid = useprofile.genderid WHERE user.status=1 AND user.id <> 1 ORDER BY useprofile.fullname ASC");

var parsedD = dbresult.map(async function (item) {
return {
id: 'user3'+item.id,
inid: item.inid,
username: Utils.decrypt({iv: item.usernameiv, content: item.username}),
fullname: item.fullname,
title: item.title,
status: '1',
itemId: item.itemId
}
});
return parsedD;
} // end list users

/*
if(siteListId === 34){ // list data items
  let dbresult = await Db.query("SELECT description, title, id AS itemId, uuid AS id  FROM data WHERE status=1 ORDER BY title ASC");
  var parsedD = dbresult.map(async function (item) {
  return {
  id: item.id,
  inid: item.inid,
  description: item.description,
  title: item.title,
  total: '1',
  itemId: item.itemId
  }
  });
  console.log(parsedD);
  return parsedD;
  } 
*/
  
if(siteListId === 35){ // list countries
 return await Db.query("SELECT title, countryid AS itemId, uuid AS id  FROM countries WHERE ORDER BY title ASC");
var parsedD = country.map(async function (item) {
  return {
  id: 'country35'+item.id,
  title: item.title,
  itemId: item.itemId
  }
  });
  return parsedD;
  }
 

if(siteListId == -199){ // list item fromm data table
let db = await Db.query("SELECT title, dataid AS itemId, uuid AS id, inid,userid,formid,masterid,value,valueblob,fieldtype,required,description,string27,string26,string25,string24,string23,string22,string21,string19,string18,string17,string16,string15,string14,string13,string12,string11,string10,string9,string8,string7,string6,string5,string4,string3,string2,string1,zip,planid,phone,city,address,fullname,gender,username,total,country,province,rowid,typeid  FROM data WHERE formid = "+con.escape(parseInt(args.arg1))+"  ORDER BY address ASC");
return db;
  } 


if(siteListId == -121){ // list current form fileds
  return await Db.query("SELECT title, id AS itemId, uuid AS id, type AS city,required,description,fieldname AS fullname,active AS masterid, sys AS planid FROM formfields WHERE formid = "+con.escape(parseInt(args.arg1))+" ORDER BY ordering ASC");
  
var parsedD = country.map(async function (item) {
  return {
  id: 'cur121'+item.id,
  inid: 0,
  title: item.title,
  city: item.city,
  required: item.required,
  description: item.description,
  fullname: item.fullname,
  masterid: item.masterid,
  planid: item.planid,
  itemId: item.itemId
  }
  });
  return parsedD;
  } 
	
if(siteListId == -198){ // get list items for select menu
if(parseInt(args.arg1) == 21 || parseInt(args.arg1) == 31){ // list countries
let country = await Db.query("SELECT title, countryid AS itemId, uuid AS id FROM countries WHERE status = 1 ORDER BY title ASC");

var parsedD = country.map(async function (item) {
  return {
  id: 'co21'+item.id,
  inid: 0,
  title: item.title,
  itemId: item.itemId
  }
  });
  return parsedD;
}
if(parseInt(args.arg1) == 38){ // list stock items
let country = await Db.query("SELECT address AS title, dataid AS itemId, uuid AS id, inid FROM data WHERE status = 1 AND formid = 20 ORDER BY address ASC");

var parsedD = country.map(async function (item) {
  return {
  id: 'stockitems'+item.id,
  inid: item.inid,
  title: item.title,
  itemId: item.itemId
  }
  });
  return parsedD;
}
if(parseInt(args.arg1) == 41){ // list projects
let country = await Db.query("SELECT address AS title, dataid AS itemId, uuid AS id, inid FROM data WHERE status = 1 AND formid = 14 ORDER BY address ASC");

var parsedD = country.map(async function (item) {
  return {
  id: 'stockitems'+item.id,
  inid: item.inid,
  title: item.title,
  itemId: item.itemId
  }
  });
  return parsedD;
}
if(parseInt(args.arg1) == 22){  // list regions
let country = await Db.query("SELECT address AS title, dataid AS itemId, uuid AS id, inid FROM data WHERE status = 1 AND formid = 34 ORDER BY address ASC");

var parsedD = country.map(async function (item) {
  return {
  id: 'reg22'+item.id,
  inid: item.inid,
  title: item.title,
  itemId: item.itemId
  }
  });
console.log(parsedD);
  return parsedD;
}
if(parseInt(args.arg1) == 33){  // list donors
let country = await Db.query("SELECT address AS title, dataid AS itemId, uuid AS id, inid FROM data WHERE status = 1 AND formid = 19 ORDER BY address ASC");
var parsedD = country.map(async function (item) {
  return {
  id: 'donoe22'+item.id,
  inid: item.inid,
  title: item.title,
  itemId: item.itemId
  }
  });
  return parsedD;
}
if(parseInt(args.arg1) == 27 || parseInt(args.arg1) == 29){ // list operating countries
let country = await Db.query("SELECT countries.title AS title, countryid AS itemId, data.uuid AS id, data.inid FROM data INNER JOIN countries ON (countries.countryid = data.address) WHERE data.status = 1 AND data.formid = 35 ORDER BY countries.title ASC");
 var parsedD = country.map(async function (item) {
  return {
  id: 'op27'+item.id,
  inid: item.inid,
  title: item.title,
  itemId: item.itemId
  }
  });
  return parsedD;
  
}

if(parseInt(args.arg1) == 28){ // list offices
let country = await Db.query("SELECT address AS title, dataid AS itemId, uuid AS id, inid FROM data WHERE status = 1 AND formid = 5 ORDER BY address ASC");
 var parsedD = country.map(async function (item) {
  return {
  id: 'op27'+item.id,
  inid: item.inid,
  title: item.title,
  itemId: item.itemId
  }
  });
  return parsedD;
  
}


if(parseInt(args.arg1) == -195){ // list enabled languages
let country = await Db.query("SELECT title, id AS itemId, 2letter AS abre, uuid AS id FROM lang WHERE status = 1 ORDER BY title ASC");
 var parsedD = country.map(async function (item) {
  return {
  id: 'langsupport'+item.id,
  inid: 0,
  title: item.title,
  description: item.abre,
  itemId: item.itemId
  }
  });
  return parsedD;
  
}

return [{}];
} 

if(siteListId == -197){ // get title for id
if(args.arg1 == 'country'){ 
let country = await Db.query("SELECT title, uuid, countryid FROM countries WHERE status = 1 AND countryid = "+con.escape(parseInt(args.arg2)));
var parsedD = country.map(async function (item) {
return {
id: 'titlecountry'+item.uuid,
itemId: item.countryid,
inid: 0,
title: item.title,
}
});
return parsedD;}

if(args.arg1 == 'stock'){ 
let country = await Db.query("SELECT address FROM data WHERE status = 1 AND dataid = "+con.escape(parseInt(args.arg2)));
var parsedD = country.map(async function (item) {
return {
id: 'titlestock'+item.uuid,
itemId: item.countryid,
inid: 0,
title: item.title,
}
});
return parsedD;}

if(args.arg1 == 'username'){ return 'charles';
let country = await Db.query("SELECT title, uuid, countryid FROM countries WHERE status = 1 AND countryid = "+con.escape(parseInt(args.arg2)));
var parsedD = country.map(async function (item) {
return {
id: 'titleusername'+item.uuid,
itemId: item.countryid,
inid: 0,
title: item.title,
}
});
return parsedD;}

if(args.arg1 == 'project'){ 
let country = await Db.query("SELECT address FROM data WHERE status = 1 AND dataid = "+con.escape(parseInt(args.arg2)));
var parsedD = country.map(async function (item) {
return {
id: 'titlecountry'+item.uuid,
itemId: item.countryid,
inid: 0,
title: item.title,
}
});
return parsedD;}
return [{}];
} 


if(siteListId === 33){ // list settings
let dbresult = await Db.query("SELECT id AS itemId, inid AS inid, title, uuid AS id, description FROM settings ORDER BY title ASC");

var parsedD = dbresult.map(async function (item) {
return {
id: 'settings01'+item.id,
itemId: item.itemId,
inid: item.inid,
title: item.title,
description: item.description,
status: 0
}
});
return parsedD;
} // end list users


  
// old items
return emptyResult;	   
}, // end get list for web site
sideMenu: async (parent, args, context, info) => { 
if(context.req.headers.authorization === "Bearer none"){return noSignIn;  } 
else {
let token = context.req.headers.authorization || '';  
let auth = await checkUser(token)
if(!auth.status){   return noSignIn; }
	
if(await Utils.checkUserStatus(auth.userId) !== 1){	 return emptyResult ;}  
	let result = await Db.query("SELECT title, moduleid AS itemId, inid, addnew, uuid AS id, description FROM module WHERE  status=1 ORDER BY ordering ASC");
  return result;

}
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

//res.send(dbresult);
return dbresult;
}},

},

};
