// JavaScript Document
var ioServer = "https://io.1and1chat.com";  
//var ioServer = "http://home.com:456";
//var chatServer = "http://home.com:433";
var chatServer = "https://gql.1and1chat.com";
/*
var ioServer = "https://io.1and1chat.com";  
var chatServer = "https://api.1and1chat.com";
*/
//var socket = window.io(ioServer, { autoConnect: false, transports: ['websocket'] }); // establish connection to socket server
var socket = window.io(ioServer, { autoConnect: false }); // establish connection to socket server
//var content = {userID: "NA", sessionID:"NA"}; // update content var
//socket.auth = { content }; // set socket authentication with content var
var apikey = flexiLib.apiKey;
var agentsOnline = false; // is any agent online
var flex = null;   
var chatMsg = null; 
var textMsg = null;
var userType = null;
var nextAgent = `
<div class="px-2 card-header nextAgentCon">
<div class="p-2">
Please wait for next available agent
</div>
<div style="background-color:white; color:black; text-align:left" class="p-2">
<div id="queue"></div>
<div>
<button type="button" class="btn btn-secondary btn-sm" onClick="cancelStart()">
Cancel
</button>
</div>
</div>                             
</div>
`
//var isChatEnded;
//localStorage.clear();
var dept = [];
function showChatBox(){document.getElementById("chatBox").style.display = "block"}
function closeChat(){document.getElementById("chatBox").style.display = "none"} 
function swapBtn (a,b){ document.getElementById(a).style.display = "none"; document.getElementById(b).style.display = "block"; }
async function runApp() { // initialize application
checkOnlineStatus();
updateBaseForms();
}// end initialize application
function updateBaseForms(){ // start updateBaseForms
if(agentsOnline){
toggle("onlineInterface");
toggle("offlineInterface", "id", "none");
} 
else {toggle("offlineInterface");toggle("onlineInterface", "id", "none");
}
} // end updateBaseForms
function toggle(elName="", type="id", displayState="block"){ // start toggle
if(type === "id" && elName !== ""){document.getElementById(elName).style.display = displayState;}
else if(type === "class" && elName !== ""){
var elements = document.getElementsByClassName(elName)
for (var i = 0; i < elements.length; i++){
elements[i].style.display = displayState;
} } 
} //end toggle
function checkOnlineStatus() { 
processGetReq({formID: 3}, updateAgentsOnline); 
if(dept.length === 0){
processGetReq({formID: 7}, setDept);} } // end checkOnlineStatus
function setDept(data){ // start set dept
dept = data.msg;
//console.log("data fron online "+data.status)
let items = document.getElementsByClassName("deptList");
    for (let i = 0; i < items.length; i++) { items[i].innerHTML = loadDept(); }
} // end set dept
function loadDept(){ // start load dept
let depts = '<option value="0" selected> -- Select --</option>';	
for (var i=0; i < dept.length; i++){depts = depts+'<option value='+dept[i].id+'>'+dept[i].title+'</option>';
} return depts; } // end load dept
async function updateAgentsOnline(data){ // start updateAgentsOnline
//console.log("Online "+data.status);
if(typeof data.status !== 'undefined'){ 
if(parseInt(data.status) > 0){agentsOnline = true; } else {agentsOnline = false; }} } // end updateAgentsOnline
async function processGetReq(arg, callBack){// start processGetReq	
const formDataJsonString = JSON.stringify(arg);
postData(formDataJsonString).then(data => { callBack(data);	});} // end processGetReq
async function postData(data = {}, url = chatServer+"/offline/") { // start postData
// Default options are marked with *
const response = await fetch(url, {
method: 'POST', // *GET, POST, PUT, DELETE, etc.
mode: 'cors', // no-cors, *cors, same-origin
cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
credentials: 'same-origin', // include, same-origin, *same-origin, omit
headers: new Headers({
'Content-Type': 'application/json',
'Accept': 'application/json',
'Authorization': "Bearer " +apikey
}), 
redirect: 'follow', // manual, *follow, error
referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
//body: JSON.stringify(data) // body data type must match "Content-Type" header
body: data // body data type must match "Content-Type" header
}).then((response) => {
  if (response.ok) {
    return response;
  } else {
    console.log('Something went wrong');
	return false;
  }
});
//console.log(JSON.stringify(data));
return response.json(); // parses JSON response into native JavaScript objects
} // end post data
function stopFormSubmit(){ // start stopFormSubmit
for (var i=0; i<arguments.length; i++){
document.getElementById(arguments[i]).addEventListener('submit', (event) => {event.preventDefault();});}}
function showMsg(eleID, msg){document.getElementById(eleID).innerHTML = msg;} // end stopFormSubmit
function resMsg(myStyle="alert alert-info", myState="none", msg="", elem="resMsg"){ // update response msg
document.getElementById(elem).innerHTML = msg;
document.getElementById(elem).className = myStyle;
toggle(elem, "id", myState)
} // endd update response msg
function UI2(data){ // process offline for,
if(typeof data.status !== 'undefined' && typeof data.msg !== 'undefined'){
if(data.status === 1) {
resMsg("alert alert-success", "block", data.msg);
toggle("offLineFormCon", "id", "none"); }
else {
resMsg("alert alert-danger", "block", data.msg);
if(typeof data.fields.length !== 'undefined' && data.fields.length > 0){
//console.log(data.fields.length);
//for (let i = 0; i < data.fields.length; i++) { 
//console.log(data.fields[i]);
//document.getElementById("emailerror").display = "block";
// } 
}  }} } // process offline form

function UI1(data){ // start online form process
localStorage.clear();
if(typeof data.status !== 'undefined' && typeof data.msg !== 'undefined'){
if(data.status === 1) {
//arg = {sessionId:data.sessionId, clientsocketid:data.clientsocketid, userType: 3}
localStorage.setItem('sessionId', data.sessionId);
localStorage.setItem('clientsocketid', data.clientsocketid);
content = {userID: data.clientsocketid, sessionID: data.sessionId, userType: 3}; // update content var
socket.auth = { content }; // set socket authentication with content var
if(socket.connect()){
reConnect();
//socket.emit('get-all', {msg: "msg", sessionId:localStorage.getItem("sessionId"), sectionId:-1});
//resMsg("alert alert-success", "block", data.msg, "resMsgOnline");
//toggle("connectChat", "id", "none");
} }
else {
resMsg("alert alert-danger", "block", data.msg, "resMsgOnline");
 }}}
// end UI 1 process online form
async function processForm(formID, callBack){// process form
toggle("offlineAlert", "class", "none");	
let myForm = document.getElementById(formID);
let formData = new FormData(myForm);
for(var pair of formData.entries()) {
 //console.log(pair[0]+ ', '+ pair[1]);
 }
const plainFormData = Object.fromEntries(formData.entries());
const formDataJsonString = JSON.stringify(plainFormData);
//console.log(formDataJsonString)
postData(formDataJsonString)
.then(data => { 
callBack(data);	  
//console.log(data); // JSON data parsed by `data.json()` call
});
} // end process form
socket.on("settings", (data) => { 
console.log(data.settings.length+ " gg");
console.log(data.settings);
if(data.settings.length > 0){
console.log(data.settings[0][48]);
//screenShare
//for (let i = 0; i < data.settings.length; i++) {console.log(data.settings[i]);}
}	
}); // end settings
function reConnect(){
if(typeof localStorage.getItem("sessionId") !== 'undefined' && localStorage.getItem("sessionId") !== null){
content = {userID: localStorage.getItem("clientsocketid"), sessionID: localStorage.getItem("sessionId"), userType: 3}; // update content var
socket.auth = { content }; // set socket authentication with content var
if(socket.connect()){
socket.emit('get-all', {msg: "msg", sessionId:localStorage.getItem("sessionId"), sectionId:-1});
}
}
}
//console.log(localStorage.getItem("sessionId"));
/*
function reConnect(){ //reconnect to io server
if(typeof localStorage.getItem('sessionId') !== 'undefined' && typeof localStorage.getItem('clientsocketid') !== 'undefined'){
content = {userID: localStorage.getItem('clientsocketid'), sessionID: localStorage.getItem('sessionId'), userType: 3}; // update content var
//console.log(content);
socket.auth = { content }; // set socket authentication with content var
socket.connect();
socket.emit('get-all', {msg: "msg"});
console.log("reconnect startee")
}}// end reconnect
*/
function cancelStart(){ // cancel chat
processGetReq({formID: 6,  sessionId: (typeof localStorage.getItem("sessionId") === 'undefined') ? 0 : parseInt(localStorage.getItem("sessionId"))}, resetChat);}// end cancel chat
function resetChat(){ 
localStorage.clear();
toggle("resMsgOnline", "id", "none");
toggle("connectChat", "id", "block");
toggle("activeChat", "id", "none");
toggle("showChatEnd", "id", "block");
toggle("cBody", "id", "none");
if(socket){socket.disconnect();}
document.getElementById("cBody").style.display = "none"
document.getElementById("showChatEnd").style.display = "block"
}// end reset chat
window.socket.on("visitor-queue", (data) => { 
//console.log(data)
//document.getElementById("msgWrapper").innerHTML += `<div style="color: #ffffff; width:75% !important; background-color: #07b0f3;" class="card-footer m-2 p-2">${data.msg}</div>`;
if(parseInt(data.agentReady) === 0){
resMsg(" ", "block", nextAgent, "resMsgOnline");
toggle("activeChat", "id", "none");
toggle("connectChat", "id", "none");
document.getElementById("queue").innerHTML += data.msg;
//toggle("connectChat", "id", "none");
} else if (parseInt(data.agentReady) === 1) {	
localStorage.setItem('sectionId', data.sectionId);
resMsg(" ", "none", "", "resMsgOnline");
toggle("resMsgOnline", "id", "none");
toggle("activeChat", "id", "block");
toggle("connectChat", "id", "none");
}
else if (parseInt(data.agentReady) === 5) {
resetChat();
}
//console.log(data.status+" - "+data.agentReady);
  }); 

socket.on("chat-msg", (data) => { 
console.log("chat-msg");
//document.getElementById("msgWrapper").innerHTML += `<div style="color: #ffffff; width:75% !important; background-color: #07b0f3;" class="card-footer m-2 p-2">${data.msg}</div>`;
toggle("showAgtJoined", "id", "none");
toggle("showAgtMsg", "id", "block");
flex = document.createElement("section");   
chatMsg = document.createElement("section"); 
textMsg = `${data.msg}`;
if(userType = parseInt(data.userType)){
if(userType === 3){ 
flex.setAttribute("class", "d-flex");  
chatMsg.setAttribute("class", "chatMsgMe card-footer m-2 p-1"); 
}
else if(userType === 2){
flex.setAttribute("class", "d-flex flex-row-reverse");  
chatMsg.setAttribute("class", "chatMsg card-footer m-2 p-1"); 
}
chatMsg.append(textMsg);
flex.append(chatMsg);
document.getElementById("msgWrapper").append(flex);
}
 // }); 
});
socket.on("get-all", (data) => { 
if(data.msg.length > 0){ toggle("showAgtJoined", "id", "none"); toggle("showAgtMsg", "id", "block");
}					  
for (let i = 0; i < data.msg.length; i++) {
flex = document.createElement("section");   
chatMsg = document.createElement("section"); 
if(userType = parseInt(data.msg[i].postby)){
textMsg = `${data.msg[i].msg}`;
if(userType === 3){ 
flex.setAttribute("class", "d-flex my-2");  
chatMsg.setAttribute("class", "chatMsgMe card-footer m-2 p-1"); 
}
else if(userType === 2){
flex.setAttribute("class", "d-flex flex-row-reverse my-2");  
chatMsg.setAttribute("class", "chatMsg card-footer m-2 p-1"); 
}
chatMsg.append(textMsg);
flex.append(chatMsg);
document.getElementById("msgWrapper").append(flex);
}}});
function sendChatToOne(){
let msg = document.getElementById("chatMsg").value.trim();  
if(msg === ""){document.getElementById("chatMsg").focus(); return false; } 
//console.log("start send");
socket.emit('chat-msg', {msg: msg, sectionId: localStorage.getItem("sectionId"), sessionId: localStorage.getItem("sessionId")});
} 


function fshide(a){document.getElementById(a).style.display = "none";}
function fsshow(a){document.getElementById(a).style.display = "block";}
function fsshowError(a){
document.getElementById("error").innerHTML += a+"<br />"; 
document.getElementById("error").style.display = "block";}
function fsshowProgress(a,b){
document.getElementById(a).innerHTML = b;}
function fsclearCon(a){document.getElementById(a).innerHTML = "";}
function fshandleFiles(inputId) { 
fshide("error");
fsclearCon("error"); 
fsshow("progressInfoText");
let file = "";
const fileList = document.getElementById(inputId).files;//this.files; /* now you can work with the file list */
const numFiles = fileList.length;
for (let i = 0; i < numFiles; i++) {
let fs = fileList[i].size;
let fsmb = fs/(1000000);
let fsr = Math.ceil(fsmb.toFixed(2));
if(fsr > 12000){fsshowError(fileList[i].name+' is greater than 588MB');
 } else { 
let progText = document.createElement("section");   // Create element  className="row p-2 rowborder"
progText.setAttribute("id", "progText"+i); 
progText.setAttribute("class", "col-md-8"); 
let progPer = document.createElement("section");   // Create element 
progPer.setAttribute("id", "progPer"+i); 
progPer.setAttribute("class", "col-md-3 arigth"); 
let progCon = document.getElementById("progPer"); 
progCon.append(progText);
progCon.append(progPer);
fsshowProgress("progText"+i, fileList[i].name+". Size: "+fsr+"MB");
fssendFile(fileList[i], "progPer"+i);
//console.log("curr file length "+currFiles.length);
}} }
var fstoken = "none";
var fsapiToken = "none";
if(sessionStorage.getItem("signIn")){
fstoken = sessionStorage.getItem("signIn");
fsapiToken = sessionStorage.getItem("apiToken");
}   
function fssendFile(file, perc) {
  const uri = chatServer+"/upload/";
  const xhr = new XMLHttpRequest();
  const fd = new FormData();
  xhr.open("POST", uri, true);
  ///xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token} ${apiToken}`);
  xhr.upload.addEventListener("progress", function(e) {
  if (e.lengthComputable) {
  const percentage = Math.round((e.loaded * 100) / e.total);
  //self.ctrl.update(percentage);
  document.getElementById(perc).innerHTML = percentage+"%"; } }, false);
  xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
  let myArr = [{"status": 0, "msg": "Unexpected Error"}];
try {
myArr = JSON.parse(xhr.responseText);
  } catch (e) {
    myArr = [{"status": 0, "msg": "Unexpected Error"}];
  }
console.log(myArr);
if(myArr[0].status === 0){showError(myArr[0].msg)}  
} };
   fd.append('myFile', file);
   fd.append("sessionId", props.sessionId);
   fd.append("sectionId", props.sectionId);
   fd.append("formID", 12);
    // Initiate a multipart/form-data upload
   xhr.send(fd);
  }
  
window.addEventListener('load', (event) => { setInterval(runApp, 1000); stopFormSubmit('form1', 'form2'); reConnect();});
