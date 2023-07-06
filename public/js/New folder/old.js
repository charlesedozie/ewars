<script>
//localStorage.clear();
/*
var defOffline = true;
var defOnline = false;
var defMsgAlert = false;
var defAwaitingAgent = false;
var defConnectForm = true;
var dafActiveChat = false;
*/

var offlineSubmitStatus = 0;
var closeResMsg = 0;
var isSubmittingOffline = 0;
var mgtState;

var connectChat = 0;
var nextAgent = 0;
var activeChat = 0;
var nextAgentError = 0;
var connecting = 0;

var isSessionActive = 0;
var agentSocket;
var apikey = "4bbf90b4-be78-4a2c-8ba2-e152c8832b79"

async function mgState(){
await checkAgent().then(function (){
if(checkAgentStatus === 0){
document.getElementById("offline").style.display = "block";
document.getElementById("defOnline").style.display = "none";

//offlineSubmitStatus = 0;
closeResMsg = 0;
isSubmittingOffline = 0;

connectChat = 0;
nextAgent = 0;
activeChat = 0;
nextAgentError = 0;
connecting = 0;

isSessionActive = 0;
//localStorage.clear();
} 
else {
document.getElementById("offline").style.display = "none";
document.getElementById("defOnline").style.display = "block";
}
});
updateAgentID();
if(closeResMsg === 1){
document.getElementById("offlineSubmitSuccess").style.display = "none";
document.getElementById("offlineSubmitError").style.display = "none";
document.getElementById("offLineSubmitting").style.display = "none";
} 
if(offlineSubmitStatus === 0){
document.getElementById("offlineDefMsg").style.display = "block";
document.getElementById("offlineSubmitSuccess").style.display = "none";
document.getElementById("offlineSubmitError").style.display = "none";
document.getElementById("offLineSubmitting").style.display = "none";
document.getElementById("offLineFormCon").style.display = "block";
} 
if(isSessionActive === 0){
document.getElementById("nextAgentError").style.display = "none";
document.getElementById("activeChat").style.display = "none";
document.getElementById("nextAgent").style.display = "none";
document.getElementById("connectChat").style.display = "block";
document.getElementById("connecting").style.display = "none";
}

if(isSessionActive > 0){
updateQueue();
}
if(isSessionActive === 1){
document.getElementById("nextAgentError").style.display = "none";
document.getElementById("activeChat").style.display = "none";
document.getElementById("nextAgent").style.display = "block";
document.getElementById("connectChat").style.display = "none";
document.getElementById("connecting").style.display = "none";
}
if(isSessionActive === 2){
document.getElementById("nextAgentError").style.display = "none";
document.getElementById("activeChat").style.display = "block";
document.getElementById("nextAgent").style.display = "none";
document.getElementById("connectChat").style.display = "none";
document.getElementById("connecting").style.display = "none";
}
if(isSessionActive === 3){
document.getElementById("nextAgentError").style.display = "block";
document.getElementById("activeChat").style.display = "none";
document.getElementById("nextAgent").style.display = "none";
document.getElementById("connectChat").style.display = "none";
document.getElementById("connecting").style.display = "none";
}
if(isSessionActive === 4){
document.getElementById("nextAgentError").style.display = "none";
document.getElementById("activeChat").style.display = "none";
document.getElementById("nextAgent").style.display = "none";
document.getElementById("connectChat").style.display = "none";
document.getElementById("connecting").style.display = "block";
}/*
if(isSessionActive === 1){
document.getElementById("offline").style.display = "none";
document.getElementById("defOnline").style.display = "block";
} */

mgtState = setTimeout (mgState, 1000);   
}



//var ioServer = "https://gql.dredgeresources.com:488"; 
//var chatServer = "https://gql.dredgeresources.com:444";







function updateQueue() { 
let xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = async function() {
if (this.readyState == 4 && this.status == 200) {
var myArr = JSON.parse(this.responseText);
if(myArr.agentReady === 1){isSessionActive = 2;}
if(myArr.status !== 0 && myArr.agentReady !== 1){
document.getElementById("queue").innerHTML = myArr.queueMsg+": "+myArr.queue;
} else {document.getElementById("queue").innerHTML = myArr.queueMsg;}
};
}
xmlhttp.open("POST", chatServer+"/offline/?checkagent=yes&domain="+domainName+"&userID="+localStorage.getItem("userID"), true);
xmlhttp.setRequestHeader("Accept", "application/json");
xmlhttp.setRequestHeader("Authorization", "Bearer " +apikey+" "+apikey);
xmlhttp.setRequestHeader("Content-Type", "application/json");
xmlhttp.send();
return false;
} 

function updateAgentID() { 
let xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = async function() {
if (this.readyState == 4 && this.status == 200) {
var myArr = JSON.parse(this.responseText);
if(myArr.status === 1) { localStorage.setItem('agentID', myArr.agentID);}

//logText(myArr.status+" Rigth "+myArr.agentID);
};
}
xmlhttp.open("POST", chatServer+"/offline/?updateAgentID="+localStorage.getItem("userID"), true);
xmlhttp.setRequestHeader("Accept", "application/json");
xmlhttp.setRequestHeader("Authorization", "Bearer " +apikey+" "+apikey);
xmlhttp.setRequestHeader("Content-Type", "application/json");
xmlhttp.send();
return false;
} 
function iniChatOnLoad(){ 
var content;
logText("Rigth");
console.log(localStorage.getItem('userID')); 
let userID; 
let sessionID;  
if(typeof localStorage.getItem('userID') !== 'undefined' && localStorage.getItem('userID') !== null && typeof localStorage.getItem('sessionID') !== 'undefined' && localStorage.getItem('sessionID') !== null){
userID = localStorage.getItem('userID'); 
sessionID = localStorage.getItem('sessionID');  
}

if(userID !== null && sessionID !== null && typeof sessionID !== 'undefined' && typeof userID !== 'undefined'){ // start localstorage found con
logText("local storage exitis");   
let xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = async function() { // start make request con
if (this.readyState == 4 && this.status == 200) { // start request ready con
var myArr = JSON.parse(this.responseText);
if(myArr.status > 0){
content = {userID: userID, sessionID: sessionID};
socket.auth = { content }; // set socket authentication with content var
socket.connect();
logText("Connected");
logText("User Id on reload "+userID);
logText("Session Id on reload "+sessionID); 
logText("user actively chatting");
checkAgentStatus=1;

if(myArr.status === 1){isSessionActive=2;} // end session still active con
if(myArr.status === 13){isSessionActive=1;} // end start session waiting
} //else { localStorage.clear(); }
} //else { localStorage.clear(); }
}
xmlhttp.open("POST", chatServer+"/offline/?domain="+domainName+"&checkSessionStatus="+sessionID, true);
xmlhttp.setRequestHeader("Accept", "application/json");
xmlhttp.setRequestHeader("Authorization", "Bearer " +apikey+" "+apikey);
xmlhttp.setRequestHeader("Content-Type", "application/json");
xmlhttp.send();
}
//else { localStorage.clear(); }
// end make request con
} // end start localstorage found con
function resetForm(){
if(socket){socket.disconnect();}
localStorage.clear();
isSessionActive = 0;
}
function resetOfflIneForm(x){ document.getElementById(x).reset(); }

socket.on("agent-msg", (data) => { 
logText("agent-msg");
//isSessionActive=2;
});
function sendChatToOne(){
let msg = document.getElementById("chatMsg").value.trim();  
if(msg === ""){document.getElementById("chatMsg").focus(); return false; } 
//ownMsg(msg);
logText("msg sent and to"+localStorage.getItem("agentID") +" msg"+ msg);
socket.emit('visitor-msg', {to:localStorage.getItem("agentID"), msg: msg, session: localStorage.getItem("sessionID")});
logText("msg sent and"+localStorage.getItem("agentID") +" msg"+ msg);
addMsg(msg, 2)
} 
 
socket.on("chat-msg", (data) => { 
logText("msg "+data.msg);
addMsg(data.msg, 1)
//document.getElementById("agentName").innerHTML="Active Chat";
//document.getElementById("chat-content").style.display = "block";
//document.getElementById("queueCon").style.display = "none";
});

function addMsg(msg, owner){
let newMsg = "";
let objDiv = document.getElementById("msgWrapper");
objDiv.scrollTop = objDiv.scrollHeight;
if(!isNaN(owner) && owner === 2){
newMsg = document.getElementById("msgWrapper").innerHTML+`<div class="media media-chat chatmsgWidth"><div class="media-body chatmsgWidth"><p>${msg}</p></div></div>`;}
if(!isNaN(owner) && owner === 1){
newMsg = document.getElementById("msgWrapper").innerHTML+`<div class="media media-chat media-chat-reverse chatmsgWidth"><div class="media-body chatmsgWidth"><img class="avatar" src="https://img.icons8.com/color/36/000000/administrator-male.png" alt="...">
<p>${msg}</p></div></div>`;}
document.getElementById("msgWrapper").innerHTML = newMsg;

}


//window.addEventListener('load', (event) => { mgState(); });
//window.addEventListener('load', (event) => { iniChatOnLoad(); });

//start new
var onlineStatus = 0;
var isChatActive = false;



function updateChatInterface () {
return new Promise((resolve, reject) => {
if (!isChatActive && onlineStatus === 0) {    
document.getElementById("offlineInterface").style.display = "block";
document.getElementById("onlineInterface").style.display = "none";
return resolve(true);  } else {return false; } });} // updateChatInterface

function failureCallback(){    return true; }
async function iniChat(){ // start iniChat
await checkOnlineStatus()
.then(function (){updateChatInterface();})
.then(function() {
//setTimeout (iniChat(), 2000);
})
} // end iniChat

//window.addEventListener('load', (event) => { iniChat(); });
</script>