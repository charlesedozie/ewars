var script = document.createElement('script');
script.src = "";
//script.src = "https://www.paypal.com/sdk/js?client-id=AZjmoDgzXn_DkASbmBRfQBtvFAq7NSGdMx8N3hgueXAsTkjACzxi_72S4uWobNQmk9lL-6fiAJRUdIeY";
// sandbox = ARasUEyy0ByVkfcoEpgdS6b8cm_7YFfKPIZfOhK87maoMMf5Vdlce0OnNhvQmlC0XO-S6pfWUg1ptEJB
// live = AZjmoDgzXn_DkASbmBRfQBtvFAq7NSGdMx8N3hgueXAsTkjACzxi_72S4uWobNQmk9lL-6fiAJRUdIeY
document.head.appendChild(script);
//var ioServer = "https://io.1and1chat.com";
window.chatServer = "https://app.socket.com.ng"; 
//window.chatServer = "https://api.1and1chat.com"; 
var domainName = document.domain;
window.apiEnd = window.chatServer;


window.iniHead = function (){ 
let docTitle = `Early Warning and Response System`;
if(!document.title){ 
let titleEle = document.createElement('title');
document.head.append(titleEle); }
document.title = docTitle; }

window.iniHead(); 
// start rtc
function toggle(elName="", type="id", displayState="block"){ // start toggle
if(type === "id" && elName !== ""){
if(document.getElementById(elName)){
document.getElementById(elName).style.display = displayState;
if(displayState==="block"){document.getElementById(elName).classList.remove("hideElem");}
if(displayState!=="block"){document.getElementById(elName).classList.add("hideElem")}
}}
else if(type === "cl" && elName !== ""){
if(window.document.getElementsByClassName(elName)){
var elements = window.document.getElementsByClassName(elName)
for (var i = 0; i < elements.length; i++){
elements[i].style.display = displayState;
if(displayState==="block"){elements[i].classList.remove("hideElem");}
if(displayState!=="block"){elements[i].classList.add("hideElem")}
}}} 
} //end toggle



// start Web RTC

window.sectionId=-1;
window.call = async function()
{
if(!window.pc1){createPeerConnection(); }
if(window.stream){  
//const videoTracks = window.stream.getVideoTracks();
//const audioTracks = window.stream.getAudioTracks();
window.stream.getTracks().forEach(track => window.pc1.addTrack(track, window.stream));
}}

const createPeerConnection = async function()
{
window.pc1 = new RTCPeerConnection(servers);
window.pc1.onicecandidate = handleICECandidateEvent;
window.pc1.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
window.pc1.ontrack = handleTrackEvent;
window.pc1.onnegotiationneeded = handleNegotiationNeededEvent;
window.pc1.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
window.pc1.onsignalingstatechange = handleSignalingStateChangeEvent;
//window.pc1.onremovetrack = handleRemoveTrackEvent;
}
///const servers = null;

const servers = {
iceServers: [     // Information about ICE servers - Use your own!
{
urls: "turn:socket.1and1chat.com:3478?transport=tcp",  // A TURN server
username: "demain",
credential: "5Fwgq@14"
}
]
};

function handleRemoveTrackEvent(event) {
  /*
if(document.getElementById("received_video")){
var stream = document.getElementById("received_video").srcObject;
var trackList = stream.getTracks();

if (trackList.length == 0) {
//closeVideoCall();
}
}
*/
}

if(!window.content){var content;}
function rtcStatus(text, className = ""){
if(document.getElementById('RTCStatus') && text !== "" && text !== "undefined"){
document.getElementById('RTCStatus').innerText = text;}
if(document.getElementById('RTCStatusChange') && className !== "" && className !== null){
document.getElementById('RTCStatusChange').className = className;}
}

window.hangUpCall = function (msg) {
window.closeVideoCall();
//setRTCStatus("Connection Closed", "modal-header alert alert-danger");
window.socket.emit('RTC', {msg: {msg:msg, rtcType: window.rtcType, sessionId: window.sessionId, type: "hang-up", offerStatus:window.offerStatus}})
}

function handleHangUpMsg(msg) {
let remoteVideo = document.getElementById("remoteVideo");
let remoteAudio = document.getElementById("remoteAudio");

if (remoteVideo && remoteVideo.srcObject) {
remoteVideo.pause();
remoteVideo.srcObject.getTracks().forEach(track => { track.stop();});
remoteVideo.srcObject = null;
remoteVideo.srcObject = null;
}
if (remoteAudio && remoteAudio.srcObject) {
remoteAudio.pause();
remoteAudio.srcObject.getTracks().forEach(track => { track.stop();});
remoteAudio.srcObject = null;
remoteAudio.srcObject = null;
}
window.closeVideoCall();
window.toggle("remoteError");
window.toggle("screenAreaClose");
window.toggle("continue", "cl", "none");
window.toggle("connectImg", "id", "none");
window.toggle("remoteAudio", "id", "none");
window.toggle("remoteVideo", "id", "none");
if(document.getElementById('remoteError')){document.getElementById('remoteError').innerText = msg;};
if(document.getElementById('screenAreaClose')){document.getElementById('screenAreaClose').innerText = msg;};
}
function handleICEGatheringStateChangeEvent(event) {
}

function handleSignalingStateChangeEvent(event) {
if (window.pc1) {
switch(window.pc1.signalingState) {
case "closed":
window.closeVideoCall();
window.hangUpCall("Call Ended! Lost / Poor Signal.");
window.toggle("remoteError");
if(document.getElementById('remoteError')){document.getElementById('remoteError').innerText = "Call Ended! Lost / Poor Signal.";};
break;
case "offer":
case "stable":
break;
}}
}
var sendOffer = false;
async function handleNegotiationNeededEvent() {
if (window.pc1.signalingState === "closed") return;
if (window.pc1) {
window.pc1.createOffer().then(function(offer) {
return window.pc1.setLocalDescription(offer);
}).then(function() { 
sendOffer = true; 
window.socket.emit('RTC', {msg: {rtcType: window.rtcType, sessionId: window.sessionId, sdp: window.pc1.localDescription, type: "offer", offerStatus:window.offerStatus}});
}).catch(reportError);
}}
function reportError(errMessage) {}
function handleICECandidateEvent(event) {
if (event.candidate && sendOffer && window.pc1.iceGatheringState !== "complete") {
window.socket.emit('RTC', {msg: {rtcType: window.rtcType, sessionId: window.sessionId, candidate: event.candidate, type: "new-ice-candidate", offerStatus:window.offerStatus}}); }}

window.openModalOffer = async function()
{  if(window.rtcType === "audio" && document.getElementById("openAudioModal")){document.getElementById("openAudioModal").click(); rtcStatus("Incoming Audio Conversation"); toggle("RTCSelectAudioOffer"); }
if(window.rtcType === "video" && document.getElementById("openVideoModal")){document.getElementById("openVideoModal").click(); rtcStatus("Incoming Video Conversation"); toggle("RTCSelectAudioOffer");} }

async function handleVideoOfferMsg(msg) {
switch(msg.rtcType) {
case "screen":
break;
case "video":  
break;
case "audio":
break;
default:
break;
}

if (!window.pc1) {createPeerConnection();}
let desc = new RTCSessionDescription(msg.sdp);


window.pc1.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(function() { return window.pc1.createAnswer();}).then(function(answer) { return window.pc1.setLocalDescription(answer);}).then(function() {
window.socket.emit('RTC',{msg: {rtcType: window.rtcType, sessionId: window.sessionId, sdp: window.pc1.localDescription, type: "answer", offerStatus:window.offerStatus}});
}).catch(handleGetUserMediaError);}




var setRemoteDesc = false;	
async function handleVideoAnswerMsg(msg) {
var desc = new RTCSessionDescription(msg.sdp);
if(pc1){ await pc1.setRemoteDescription(desc).catch(reportError); setRemoteDesc = true;}}

function handleGetUserMediaError(e) {
switch(e.name) {
case "NotFoundError":
break;
case "SecurityError":
case "PermissionDeniedError":
// Do nothing; this is the same as the user canceling the call.
//window.document.getElementById("RTCStatus").innerHTML = "Security Error / Permission Denied";
//document.getElementById('RTCStatusChange').className = "modal-header alert alert-warning";
break;
default:
break;
}
// Make sure we shut down our end of the RTCPeerConnection so we're
// ready to try again.
window.closeVideoCall();
}


// In our case, we're just taking the first stream found and attaching
// it to the <video> element for incoming media.

function handleTrackEvent(event) { 

let remoteVideo = document.getElementById("remoteVideo");
let remoteAudio = document.getElementById("remoteAudio");
if(window.rtcType === "video" && remoteVideo && remoteVideo.srcObject !== event.streams[0]){
  remoteVideo.srcObject = event.streams[0];
	window.toggle("connectImg","id","none");
	window.toggle("remoteVideo");  
  remoteVideo.play();
remoteVideo.muted = false;
}
if(window.rtcType === "audio" && remoteAudio && remoteAudio.srcObject !== event.streams[0]){
	remoteAudio.srcObject = event.streams[0];
	window.toggle("connectImg","id","none");
	window.toggle("remoteAudio"); 
  remoteAudio.play();
remoteAudio.muted = false;
}
}

function handleICEConnectionStateChangeEvent(event) {
if (window.pc1) {
switch(window.pc1.iceConnectionState) {
case "closed":
case "failed":
case "disconnected":
//setRTCStatus("Signal Lost!", "modal-header alert alert-danger");
//window.closeVideoCall();
//window.hangUpCall("Call Ended! Poor / Lost Signal.");
if(document.getElementById('remoteError')){document.getElementById('remoteError').innerText = "Call Ended! Lost / Poor Signal.";};
break;
}}}


// A new ICE candidate has been received from the other peer. Call
// RTCPeerConnection.addIceCandidate() to send it along to the
// local ICE framework.
async function handleNewICECandidateMsg(msg) {
  if(!window.pc1){createPeerConnection();}
  if(!setRemoteDesc) return;
 var candidate = new RTCIceCandidate(msg.candidate);
  window.pc1.addIceCandidate(candidate).catch(reportError);}
/*
window.socket.on("RTC", (data) => { 
type = data.msg.type;
window.rtcType = data.msg.rtcType;
if(data.msg.type !== "undefined"){
switch(data.msg.type) {
case "offer":
if (!window.pc1 && parseInt(window.offerStatus) === 0) { 
//window.toggle("ringingAudio");
//window.toggle("ringCancel","id","none");
//window.toggle("showRing");
if(data.msg.offerStatus){window.offerStatus = offerStatus;}}
if (parseInt(window.offerStatus) === 0 || (data.msg.offerStatus && data.msg.offerStatus === window.offerStatus)) {
handleVideoOfferMsg(data.msg);}
break;
case "ended":
//handleHangUpMsg(data.msg);
break;
case "request-com":
handleHangUpMsg(data.msg);
//window.toggle("ringingAudio");  
//window.toggle("showRing");  
//window.toggle("ringCancel","id","none"); 
break;
case "new-ice-candidate": // A new ICE candidate has been received
if (parseInt(window.offerStatus) === 0 || (data.msg.offerStatus && data.msg.offerStatus === window.offerStatus)) {
handleNewICECandidateMsg(data.msg);}
break;
case "hang-up": // The other peer has hung up the call
handleHangUpMsg(data.msg.msg);
window.toggle("showRing","id","none");
window.toggle("ringCancel");
if(document.getElementById("ringCancel")){document.getElementById("ringCancel").innerHTML = data.msg.msg+ " Click here to dismiss";}
window.closeVideoCall();
break;
case "answer":  // Callee has answered our offer
if (parseInt(window.offerStatus) === 0 || (data.msg.offerStatus && data.msg.offerStatus === window.offerStatus)) {
handleVideoAnswerMsg(data.msg);}
break;
default:
// code block
} 
}
}); // end on rtc
*/
window.closeVideoCall = async function()
{
// Close the RTCPeerConnection
if (window.pc1) {
//let localVideo = document.getElementById("localVideo");
//let remoteVideo = document.getElementById("remoteVideo");
//let localAudio = document.getElementById("localAudio");
//let remoteAudio = document.getElementById("remoteAudio");
let remoteVideo = document.getElementById("remoteVideo");
let remoteAudio = document.getElementById("remoteAudio");
let localVideo = document.getElementById("localVideo");
let localAudio = document.getElementById("localAudio");

window.toggle("remoteAudio", "id", "none");
window.toggle("remoteVideo", "id", "none");
window.toggle("localAudio", "id", "none");
window.toggle("localVideo", "id", "none");
window.toggle("screenArea", "id", "none");

if(document.getElementById('RTCStatus')){document.getElementById('RTCStatus').innerText = "Connection Closed";}
if(document.getElementById('RTCStatusChange')){document.getElementById('RTCStatusChange').className = "modal-header alert alert-danger";}	

if(localAudio && localAudio.srcObject){
localAudio.pause();
localAudio.srcObject.getTracks().forEach(track => { track.stop();});
localAudio.srcObject = null;
}
if(remoteAudio && remoteAudio.srcObject){
remoteAudio.pause();
remoteAudio.srcObject.getTracks().forEach(track => { track.stop();});
remoteAudio.srcObject = null;
}
if(localVideo && localVideo.srcObject){
localVideo.pause();
localVideo.srcObject.getTracks().forEach(track => { track.stop();});
localVideo.srcObject = null;
}
if(remoteVideo && remoteVideo.srcObject){
remoteVideo.pause();
remoteVideo.srcObject.getTracks().forEach(track => { track.stop();});
remoteVideo.srcObject = null;
}


window.pc1.ontrack = null;
window.pc1.onremovetrack = null;
window.pc1.onremovestream = null;
window.pc1.onnicecandidate = null;
window.pc1.oniceconnectionstatechange = null;
window.pc1.onsignalingstatechange = null;
window.pc1.onicegatheringstatechange = null;
window.pc1.onnegotiationneeded = null;
window.pc1.close();
window.pc1 = null;
}
if(window.document.getElementById("connectImg")){
window.toggle("connectImg","id","none");
}
window.stopVideo();
return true;
// Disable the hangup button
} // end closeVideoCall



window.closeVideoCallTemp = async function()
{
// Close the RTCPeerConnection
if (window.pc1) {
window.pc1.ontrack = null;
window.pc1.onremovetrack = null;
window.pc1.onremovestream = null;
window.pc1.onnicecandidate = null;
window.pc1.oniceconnectionstatechange = null;
window.pc1.onsignalingstatechange = null;
window.pc1.onicegatheringstatechange = null;
window.pc1.onnegotiationneeded = null;
window.pc1.close();
window.pc1 = null;
}
return true;
// Disable the hangup button
} // end closeVideoCallTemp


window.stopVideo = async function ()
{ 
var y = document.getElementsByTagName("VIDEO");
var i; for (i = 0; i < y.length; i++) { y[i].pause();
if(y[i].srcObject){
y[i].srcObject.getTracks().forEach(track => { track.stop();});
y[i].srcObject = null;}
}
y = document.getElementsByTagName("AUDIO"); for (i = 0; i < y.length; i++) { y[i].pause();}
}

window.offerStatus = 0;
window.generateUniqSerial = function() {
  return 'xxxx-xxxx-xxx-xxxx'.replace(/[x]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
window.is_url = function (str)
{
  regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        if (regexp.test(str)) { return true; }
        else { return false; }
}


















