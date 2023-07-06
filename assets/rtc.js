// Start RTC
var stream, pc1, rtcType;
const servers = null;

const servers = {
iceServers: [     // Information about ICE servers - Use your own!
{
urls: "turn:socket.1and1chat.com:3478?transport=tcp",  // A TURN server
username: "demain",
credential: "5Fwgq@14"
}
]
};

var sendOffer = false;
var localVideo = document.getElementById('localVideo');
var localAudio = document.getElementById('localAudio');
var remoteVideo = document.getElementById('remoteVideo');
var remoteAudio = document.getElementById('remoteAudio');
var useScreen = document.getElementById('useScreen');

var scrollPlaceHlder = document.getElementById("chatMsg");
function rtcStatus(text, className = ""){
if(document.getElementById('RTCStatus') && text !== "" && text !== "undefined"){
document.getElementById('RTCStatus').innerText = text;}
if(document.getElementById('RTCStatusChange') && className !== "" && className !== null){
document.getElementById('RTCStatusChange').className = className;}
}

// Start RTC
window.closeVideoCall = async function()
{
log("Closing the call");
// Close the RTCPeerConnection
if (pc1) {
log("--> Closing the peer connection 1");
pc1.ontrack = null;
pc1.onremovetrack = null;
pc1.onremovestream = null;
pc1.onnicecandidate = null;
pc1.oniceconnectionstatechange = null;
pc1.onsignalingstatechange = null;
pc1.onicegatheringstatechange = null;
pc1.onnegotiationneeded = null;


window.toggle("remoteAudio", "id", "none");
window.toggle("remoteVideo", "id", "none");
window.toggle("localAudio", "id", "none");
window.toggle("localVideo", "id", "none");
window.toggle("screenArea", "id", "none");
window.toggle("useScreenClose","id","none");

if(document.getElementById('RTCStatus')){document.getElementById('RTCStatus').innerText = "Connection Closed";}
if(document.getElementById('RTCStatusChange')){document.getElementById('RTCStatusChange').className = "modal-header alert alert-danger";}	

if (localVideo.srcObject) {
  log("--> Closing local video");
localVideo.pause();
localVideo.srcObject.getTracks().forEach(track => { track.stop(); });
localVideo.srcObject = null;
}
if (remoteVideo.srcObject) {
remoteVideo.pause();
remoteVideo.srcObject.getTracks().forEach(track => { track.stop(); });
remoteVideo.srcObject = null;
}
if (localAudio.srcObject) {
  log("--> Closing local video");
localAudio.pause();
localAudio.srcObject.getTracks().forEach(track => { track.stop(); });
localAudio.srcObject = null;
}
if (remoteAudio.srcObject) {
remoteAudio.pause();
remoteAudio.srcObject.getTracks().forEach(track => { track.stop(); });
remoteAudio.srcObject = null;
}

if (useScreen.srcObject) {
  useScreen.pause();
  useScreen.srcObject.getTracks().forEach(track => { track.stop(); });
  useScreen.srcObject = null;
  }
// Close the peer connection
pc1.close();
pc1 = null;
stream = null;
}
log("--> Closed");
window.toggle("callBtns");
return true;
// Disable the hangup button
} // end closeVideoCall



window.closeVideoCallScreen = async function()
{
log("Closing the call");
// Close the RTCPeerConnection
if (pc1) {
log("--> Closing the peer connection 1");
pc1.ontrack = null;
pc1.onremovetrack = null;
pc1.onremovestream = null;
pc1.onnicecandidate = null;
pc1.oniceconnectionstatechange = null;
pc1.onsignalingstatechange = null;
pc1.onicegatheringstatechange = null;
pc1.onnegotiationneeded = null;

// Close the peer connection
pc1.close();
pc1 = null;
stream = null;
}
log("--> Closed");
return true;
// Disable the hangup button
} // end closeVideoCallTemp

async function createPeerConnection() {
log("Setting up a connection...");
// Create an RTCPeerConnection which knows to use our chosen
// STUN server.
pc1 = new RTCPeerConnection(servers);
// Set up event handlers for the ICE negotiation process.
pc1.onicecandidate = handleICECandidateEvent;
pc1.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
pc1.ontrack = handleTrackEvent;
pc1.onnegotiationneeded = handleNegotiationNeededEvent;
pc1.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
pc1.onsignalingstatechange = handleSignalingStateChangeEvent;
pc1.onremovetrack = handleRemoveTrackEvent;
}
function log(text) {  var time = new Date();}
function log_error(text) {  var time = new Date(); }
function handleRemoveTrackEvent(event) {/*
if(document.getElementById("received_video")){
var stream = document.getElementById("received_video").srcObject;
var trackList = stream.getTracks();

if (trackList.length == 0) {
//closeVideoCall();
}
}
*/}
function hangUpCall(msg) {
window.closeVideoCall();
window.socket.emit('RTC', {msg: {msg:msg, rtcType: rtcType, sessionId: localStorage.getItem("sessionId"), type: "hang-up"}})
}

function handleHangUpMsg(msg) {
log("*** Received hang up notification from other peer");
if (remoteVideo.srcObject) {
remoteVideo.pause();
remoteVideo.srcObject.getTracks().forEach(track => { track.stop();});
remoteVideo.srcObject = null;
remoteVideo.srcObject = null;
}
if (remoteAudio.srcObject) {
remoteAudio.pause();
remoteAudio.srcObject.getTracks().forEach(track => { track.stop();});
remoteAudio.srcObject = null;
remoteAudio.srcObject = null;
}
window.closeVideoCall();
window.toggle("remoteError");
window.toggle("connectImg", "id", "none");
window.toggle("remoteAudio", "id", "none");
window.toggle("remoteVideo", "id", "none");
if(document.getElementById('remoteError')){document.getElementById('remoteError').innerText = msg;};
if(document.getElementById('useScreenClose')){document.getElementById('useScreenClose').innerText = msg;};
if(document.getElementById('ringingAudio') && document.getElementById('ringingAudio').style.display === "block"){
document.getElementById('ringCancel').innerText = msg+ " Click here to dismiss";
window.toggle("ringCancel");
window.toggle("ringingAudio", "id", "none");
}
window.toggle("useScreenClose");
}


function handleDisconnection(msg) {
log("*** Received Disconnection notification");
if (remoteVideo.srcObject) {
remoteVideo.pause();
remoteVideo.srcObject.getTracks().forEach(track => { track.stop();});
remoteVideo.srcObject = null;
remoteVideo.srcObject = null;
}
if (remoteAudio.srcObject) {
remoteAudio.pause();
remoteAudio.srcObject.getTracks().forEach(track => { track.stop();});
remoteAudio.srcObject = null;
remoteAudio.srcObject = null;
}}

function call() {
if (!pc1) { createPeerConnection();  }
if(stream){ 
const videoTracks = stream.getVideoTracks();
const audioTracks = stream.getAudioTracks();
stream.getTracks().forEach(track => pc1.addTrack(track, stream));
}}

function handleICEGatheringStateChangeEvent(event) {
log("*** ICE gathering state changed to: " + pc1.iceGatheringState);
}

function handleSignalingStateChangeEvent(event) {
log("*** WebRTC signaling state changed to: " + pc1.signalingState);
switch(pc1.signalingState) {
case "closed":
window.closeVideoCallScreen();  
window.toggle("remoteError","id","block");  
if(document.getElementById("remoteError")){document.getElementById("remoteError").innerText = "Poor Signal! Connection Closed";}
//setRTCStatus("Poor Quality Signal! Connection Ended", "modal-header alert alert-danger");
//window.closeVideoCall();
break;
case "offer":
case "stable":
break;
}
}
async function handleNegotiationNeededEvent() {
if (pc1) {
log("*** Negotiation needed");
log("*** RTC Type "+rtcType);
pc1.createOffer().then(function(offer) {
return pc1.setLocalDescription(offer);
}).then(function() { 
sendOffer = true; 
window.socket.emit('RTC', {msg: {rtcType: rtcType, sessionId: localStorage.getItem("sessionId"), sdp: pc1.localDescription, type: "offer", offerStatus:window.offerStatus}});
}).catch(reportError);
}}


function reSetDefaults(title="", alertClass="modal-header alert alert-primary m-0"){
//if(!pc1){
window.toggle("continue","class","block");
window.toggle("mediaCon","class","none");
window.toggle("connectImg","class","none");
window.toggle("remoteError","id","none");
window.toggle("connectImg","id","none");
if(document.getElementById('RTCStatus')){document.getElementById('RTCStatus').innerText = title;}
if(document.getElementById('RTCStatusChange')){document.getElementById('RTCStatusChange').className = alertClass;}
}//}
  

function reportError(errMessage) {
log_error(`Error ${errMessage.name}: ${errMessage.message}`);
}


function handleICECandidateEvent(event) {
log(" handleICECandidateEvent started");
if (event.candidate && sendOffer) {
log("*** Outgoing ICE candidate: " + event.candidate);
window.socket.emit('RTC', {msg: {rtcType: rtcType, sessionId: localStorage.getItem("sessionId"), candidate: event.candidate, type: "new-ice-candidate", offerStatus:window.offerStatus}}); }}

async function handleVideoOfferMsg(msg) { 
if (!pc1) {createPeerConnection();}
switch(msg.rtcType) {
case "screen":  
window.toggle("screenArea");
window.toggle("iniArea","id","none");
if (parseInt(window.offerStatus) === 0) { if(msg.offerStatus){window.offerStatus = msg.offerStatus;}
openRTCModal('screen', 'Incoming Presentation');
reSetDefaults('Incoming Presentation');
rtcStatus("Incoming Presentation");
}
break;
case "video":  
window.toggle("iniArea");
window.toggle("screenArea","id","none");
//openRTCModal();
//rtcStatus("Incoming Video Conversation ");
if (parseInt(window.offerStatus) === 0) { if(msg.offerStatus){window.offerStatus = msg.offerStatus;}
  openRTCModal('video', 'Video Conversation');
  reSetDefaults('Video Conversation');
  rtcStatus("Incoming Video Conversation ");
  }
break;
case "audio":
window.toggle("iniArea");
window.toggle("screenArea","id","none");
if (parseInt(window.offerStatus) === 0) {  
if(msg.offerStatus){window.offerStatus = msg.offerStatus;}
openRTCModal('audio', 'Audio Conversation');
reSetDefaults('Audio Conversation');
rtcStatus("Incoming Audio Conversation ");
//if(document.getElementById('openAudioModal')){document.getElementById('openAudioModal').click();rtcStatus("Incoming Audio Conversation ");} 
}
break;
default:
log("RTC rtcType not defined or no match");
break;
}



log("Received video chat offer from ");
let desc = new RTCSessionDescription(msg.sdp);
log("create SessionDescription "+desc);
log("  set Remote Description success ");


if(!desc) return;
pc1.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(function() {
return pc1.createAnswer();}).then(function(answer) {
return pc1.setLocalDescription(answer);}).then(function() {
log("  create answer success ");
window.socket.emit('RTC', {msg: {rtcType: rtcType, sessionId: localStorage.getItem("sessionId"), sdp: pc1.localDescription, type: "answer", offerStatus:window.offerStatus}});
}).catch(handleGetUserMediaError);
}
// Responds to the "video-answer" message sent to the caller
// once the callee has decided to accept our request to talk.
async function handleVideoAnswerMsg(msg) {
  log("*** Call recipient has accepted our call");
  // Configure the remote description, which is the SDP payload
  // in our "video-answer" message.
  var desc = new RTCSessionDescription(msg.sdp);
  if(pc1){ await pc1.setRemoteDescription(desc).catch(reportError); }}

function rtcError(error, mediaCon){
switch(mediaCon) {
case "local":
window.toggle("localError");
if(document.getElementById("localError")){document.getElementById("localError").innerText = error;}
log("local");
break;
case "remote":
window.toggle("localError");
if(document.getElementById("localError")){document.getElementById("localError").innerText = error;}
log("remote");
break;
default:
log("Error not found ");
break;
}	
}

function handleGetUserMediaError(etype, msg) {
switch(etype) {
case "local":
log("Unable to open your call because no camera and/or microphone were found.");
//handleGetUserMediaError("Unable to open your call because no camera and/or microphone were found.");
break;
case "SecurityError":
case "PermissionDeniedError":
break;
default:
log("Error opening your camera and/or microphone: " + msg);
//handleGetUserMediaError("Error opening your camera and/or microphone: " + ename);
break;}
window.closeVideoCall();
}

function handleTrackEvent(event) { 
let remoteVideo = document.getElementById("remoteVideo");
let remoteAudio = document.getElementById("remoteAudio");
let screenVideo = document.getElementById("useScreen");
if((rtcType === "screen") && screenVideo && screenVideo.srcObject !== event.streams[0]){ 
screenVideo.srcObject = event.streams[0];
}
if((rtcType === "video") && remoteVideo && remoteVideo.srcObject !== event.streams[0]){  remoteVideo.srcObject = event.streams[0];}
if(rtcType === "audio" && remoteAudio && remoteAudio.srcObject !== event.streams[0]){
	remoteAudio.srcObject = event.streams[0];
}}

function handleICEConnectionStateChangeEvent(event) {
log("*** ICE connection state changed to " + pc1.iceConnectionState);
switch(pc1.iceConnectionState) {
case "closed":
case "failed":
case "disconnected":
if(rtcType === "screen"){ window.closeVideoCallScreen(); }
else {window.closeVideoCall();}
//setRTCStatus("Connection ended by the other peer", "modal-header alert alert-primary");
window.toggle("remoteError","id","block");  
if(document.getElementById("remoteError")){document.getElementById("remoteError").innerText = "Poor Signal! Connection Closed";}
//handleDisconnection("Disconnected");
break;
}
}

// A new ICE candidate has been received from the other peer. Call
// RTCPeerConnection.addIceCandidate() to send it along to the
// local ICE framework.
async function handleNewICECandidateMsg(candidate) {
if(!pc1){createPeerConnection();}
//var candidate = new RTCIceCandidate(msg.candidate);
log("*** Adding received ICE candidate: " + JSON.stringify(candidate));
pc1.addIceCandidate(candidate).catch(reportError);
}

window.socket.on("RTC", (data) => { 
type = data.msg.type;
rtcType = data.msg.rtcType;
if(data.msg.type !== "undefined"){
switch(data.msg.type) {
case "offer":
window.toggle("ringingAudio","id","none");
window.toggle("ringCancel","id","none");
if (parseInt(window.offerStatus) === 0 || (data.msg.offerStatus && data.msg.offerStatus === window.offerStatus)) {
handleVideoOfferMsg(data.msg);}
break;
case "ended":
break;
case "new-ice-candidate": // A new ICE candidate has been received
if (parseInt(window.offerStatus) === 0 || (data.msg.offerStatus && data.msg.offerStatus === window.offerStatus)) {
handleNewICECandidateMsg(data.msg.candidate);}
break;
case "hang-up": 
handleHangUpMsg(data.msg.msg);
break;
case "screen-change": 
window.closeVideoCallScreen();
break;
case "answer":  // Callee has answered our offer
if (parseInt(window.offerStatus) === 0 || (data.msg.offerStatus && data.msg.offerStatus === window.offerStatus)) {
handleVideoAnswerMsg(data.msg);}
break;
default:
// code block
} 
}
});
// non rtc