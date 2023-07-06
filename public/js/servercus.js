var script = document.createElement('script');
script.src = "https://www.paypal.com/sdk/js?client-id=AZjmoDgzXn_DkASbmBRfQBtvFAq7NSGdMx8N3hgueXAsTkjACzxi_72S4uWobNQmk9lL-6fiAJRUdIeY";
document.head.appendChild(script);
var ioServer = "https://io.1and1chat.com";
window.chatServer = "https://api.1and1chat.com"; 
var domainName = document.domain;
window.socket = window.io(ioServer, { autoConnect: false }); // establish connection to socket server
window.apiEnd = window.chatServer;
//var content = {userID: "NA", sessionID:"NA"}; // update content var
//socket.auth = { content }; // set socket authentication with content var


function swapSection (a,b){ 
document.getElementById(a).style.display = "none"; document.getElementById(a).classList.add("hideElem");
document.getElementById(b).style.display = "block";document.getElementById(b).classList.remove("hideElem");
}
// start rtc
function log(text) {  var time = new Date();  console.log("[" + time.toLocaleTimeString() + "] " + text);}
function log_error(text) {  var time = new Date();  
console.trace("[" + time.toLocaleTimeString() + "] " + text);
console.log("[" + time.toLocaleTimeString() + "] " + text);
}

window.myPeerConnection = null;    // RTCPeerConnection
window.transceiver = null;         // RTCRtpTransceiver
window.mediaConstraints; // Initialize Media Contraints
window.remoteVideo; // Initialize Renote Stream
window.localVideo; // Initialize Local Stream
window.remoteAudio; // Initialize Local Stream
window.localAudio; // Initialize Local Stream
window.webStream; // Initialize Local Stream
window.rtcType; // Initialize Local Stream
window.sectionId, window.sessionId, window.type;


async function startRTC(){
log("Starting to prepare an invitation");
if (window.myPeerConnection) {
if(document.getElementById("RTCStatus")){
window.document.getElementById("RTCStatus").innerHTML = "You can't start a connection because you already have one open!";}
if(document.getElementById('RTCStatusChange')){
window.document.getElementById('RTCStatusChange').className = "modal-header alert alert-info";}
} else {

// Call createPeerConnection() to create the RTCPeerConnection.
// When this returns, myPeerConnection is our RTCPeerConnection
// and webcamStream is a stream coming from the camera. They are
// not linked together in any way yet.

log("Setting up connection: ");
createPeerConnection();
// Get access to the webcam stream and attach it to the
// "preview" box (id "local_video").
if (!window.webStream && rtcType !== 'undefined' && rtcType !== null && rtcType === 'screen') {
try {
window.webStream = await navigator.mediaDevices.getDisplayMedia(window.mediaConstraints);
handleSuccess(window.webStream)
} catch(err) {
handleGetUserMediaError(err);
if(document.getElementById("RTCStatus")){window.document.getElementById("RTCStatus").innerHTML = err;}
if(document.getElementById('RTCStatusChange')){document.getElementById('RTCStatusChange').className = "modal-header alert alert-danger";}
return;
}
// Add the tracks from the stream to the RTCPeerConnection
try {
//window.webStream.getTracks().forEach(transceiver = track => window.myPeerConnection.addTransceiver(track, {streams: [window.webStream]})
window.webStream.getTracks().forEach(transceiver = track => window.myPeerConnection.addTransceiver(track, {streams: [window.webStream]})
);
} catch(err) {
handleGetUserMediaError(err);
}
}  // end getdispkay media


if (!window.webStream && window.rtcType !== 'undefined' && window.rtcType !== null && (window.rtcType === 'video')) {
try {
window.webStream = await navigator.mediaDevices.getUserMedia(window.mediaConstraints);
handleSuccess(window.webStream)
} catch(err) {
handleGetUserMediaError(err);
if(document.getElementById("RTCStatus")){window.document.getElementById("RTCStatus").innerHTML = err;}
if(document.getElementById('RTCStatusChange')){document.getElementById('RTCStatusChange').className = "modal-header alert alert-danger";}
return;
}
// Add the tracks from the stream to the RTCPeerConnection
try {
window.webStream.getTracks().forEach(
transceiver = track => window.myPeerConnection.addTransceiver(track, {streams: [window.webStream]})
);
} catch(err) {
handleGetUserMediaError(err);
}
}  // end get user media

if (!window.webStream && window.rtcType !== 'undefined' && window.rtcType !== null && window.rtcType === 'audio') {
try {
window.webStream = await navigator.mediaDevices.getUserMedia(window.mediaConstraints);
handleSuccessAudio(window.webStream)
} catch(err) {
handleGetUserMediaError(err);
if(document.getElementById("RTCStatus")){window.document.getElementById("RTCStatus").innerHTML = err;}
if(document.getElementById('RTCStatusChange')){document.getElementById('RTCStatusChange').className = "modal-header alert alert-danger";}
return;
}
// Add the tracks from the stream to the RTCPeerConnection
try {
window.webStream.getTracks().forEach(transceiver = track => window.myPeerConnection.addTransceiver(track, {streams: [window.webStream]})
);
} catch(err) {
handleGetUserMediaError(err);
}
}  // end getdispkay media// JavaScript Document

}} // end startRTC()
 
async function createPeerConnection() {
log("Setting up a connection...");
// Create an RTCPeerConnection which knows to use our chosen
// STUN server.
window.myPeerConnection = new RTCPeerConnection({
iceServers: [     // Information about ICE servers - Use your own!
{
urls: "turn:socket.1and1chat.com:3478?transport=tcp",  // A TURN server
username: "demain",
credential: "5Fwgq@14"
}
]
});
// Set up event handlers for the ICE negotiation process.
window.myPeerConnection.onicecandidate = handleICECandidateEvent;
window.myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
window.myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
window.myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
window.myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
window.myPeerConnection.ontrack = handleTrackEvent;
}

function handleSuccess(stream) {
localVideo.srcObject = stream;
stream.getTracks().forEach(track => {window.myPeerConnection.addTrack(track, stream);});
stream.getVideoTracks()[0].addEventListener('ended', () => {
log_error('The user has ended sharing the screen');
if(document.getElementById("closeCurRTC")){window.document.getElementById("closeCurRTC").click();}
window.socket.emit('RTC', {msg: {rtcType: window.rtcType, sessionId: window.sessionId, type: "ended"}});
closeVideoCall();
});
}

function handleSuccessAudio(stream) {
const audioTracks = stream.getAudioTracks();
localAudio.srcObject = stream;
console.log('Using audio device: ' + audioTracks[0].label);
stream.oninactive = function() {
console.log('Stream ended');
window.socket.emit('RTC', {msg: {rtcType: window.rtcType, sessionId: window.sessionId, type: "ended"}});

};
//window.stream = stream; // make variable available to browser console
localAudio.srcObject = stream;
}
// Create the RTCPeerConnection which knows how to talk to our
// selected STUN/TURN server and then uses getUserMedia() to find
// our camera and microphone and add that stream to the connection for
// use in our video call. Then we configure event handlers to get
// needed notifications on the call.

async function handleNegotiationNeededEvent() {
log("*** Negotiation needed");
try {
log("---> Creating offer");
const offer = await window.myPeerConnection.createOffer();
// If the connection hasn't yet achieved the "stable" state,
// return to the caller. Another negotiationneeded event
// will be fired when the state stabilizes.
if (window.myPeerConnection.signalingState != "stable") {
log("     -- The connection isn't stable yet; postponing...")
return;
}
// Establish the offer as the local peer's current
// description.
log("---> Setting local description to the offer");
await window.myPeerConnection.setLocalDescription(offer);

// Send the offer to the remote peer.

log("---> Sending the offer to the remote peer");
window.socket.emit('RTC', {msg: {rtcType: window.rtcType, sessionId: window.sessionId, sdp: window.myPeerConnection.localDescription, type: "offer"}});
} catch(err) {
log("*** The following error occurred while handling the negotiationneeded event:");
reportError(err);
};
}


function handleGetUserMediaError(e) {
log_error(e);
switch(e.name) {
case "NotFoundError":
log("Unable to open your call because no camera and/or microphone" +
"were found.");
break;
case "SecurityError":
case "PermissionDeniedError":
// Do nothing; this is the same as the user canceling the call.
window.document.getElementById("RTCStatus").innerHTML = "Security Error / Permission Denied";
document.getElementById('RTCStatusChange').className = "modal-header alert alert-warning";
break;
default:
log("Error opening your camera and/or microphone: " + e.message);
break;
}
// Make sure we shut down our end of the RTCPeerConnection so we're
// ready to try again.
closeVideoCall();
}

function closeVideoCall() {
log("Closing the call");
// Close the RTCPeerConnection
if (window.myPeerConnection) {
log("--> Closing the peer connection");
// Disconnect all our event listeners; we don't want stray events
// to interfere with the hangup while it's ongoing.
window.myPeerConnection.ontrack = null;
window.myPeerConnection.onnicecandidate = null;
window.myPeerConnection.oniceconnectionstatechange = null;
window.myPeerConnection.onsignalingstatechange = null;
window.myPeerConnection.onicegatheringstatechange = null;
window.myPeerConnection.onnotificationneeded = null;
// Stop all transceivers on the connection
window.myPeerConnection.getTransceivers().forEach(transceiver => {
transceiver.stop();});
// Stop the webcam preview as well by pausing the <video>
// element, then stopping each of the getUserMedia() tracks
// on it.
if (localVideo.srcObject) {
localVideo.pause();
localVideo.srcObject.getTracks().forEach(track => {
track.stop();});}

if (localAudio.srcObject) {
localAudio.pause();
localAudio.srcObject.getTracks().forEach(track => {
track.stop();
});
}
// Close the peer connection
window.myPeerConnection.close();
window.myPeerConnection = null;
window.webStream = null;
window.showElem("curRTCSourceSelect");
//if(localVideo){localVideo.load();}
}
log("--> Closed");
return true;
// Disable the hangup button
} // end closeVideoCall


function showElem (a){ 
if(document.getElementById(a)){document.getElementById(a).style.display = "block";}
if(document.getElementById(a)){document.getElementById(a).classList.remove("hideElem");}
}
function hideElem (a){ 
if(document.getElementById(a)){document.getElementById(a).style.display = "none"; }
if(document.getElementById(a)){document.getElementById(a).classList.add("hideElem");}
}
async function handleVideoOfferMsg(msg) {
// If we're not already connected, create an RTCPeerConnection
// to be linked to the caller.
log("Received video chat offer from ");
if (!window.myPeerConnection) {createPeerConnection();}
// We need to set the remote description to the received SDP offer
// so that our local WebRTC layer knows how to talk to the caller.
var desc = new RTCSessionDescription(msg.sdp);
// If the connection isn't stable yet, wait for it...

if (window.myPeerConnection.signalingState === "stable") {
log("  - But the signaling state is stable");

// Set the local and remove descriptions for rollback; don't proceed
// until both return.
await Promise.all([
window.myPeerConnection.setLocalDescription(),
window.myPeerConnection.setRemoteDescription(desc)
]);
return;
}
if (window.myPeerConnection.signalingState != "stable") {
log("  - But the signaling state isn't stable, so triggering rollback");

// Set the local and remove descriptions for rollback; don't proceed
// until both return.
await Promise.all([
window.myPeerConnection.setLocalDescription({type: "rollback"}),
window.myPeerConnection.setRemoteDescription(desc)
]);
return;
} else {
log ("  - Setting remote description");
await window.myPeerConnection.setRemoteDescription(desc);
}
// Get the webcam stream if we don't already have it

//remoteVideo.srcObject = window.webStream;
// Add the camera stream to the RTCPeerConnection   0:354:97


log("---> Creating and sending answer to caller");
if(document.getElementById("RTCStatus")){window.document.getElementById("RTCStatus").innerHTML = "Connected";}
await window.myPeerConnection.setLocalDescription(await window.myPeerConnection.createAnswer()).then(() => {
window.socket.emit('RTC', {msg: {rtcType: window.rtcType, sessionId: window.sessionId, sdp: window.myPeerConnection.localDescription, type: "answer"}}); });
}

// Called by the WebRTC layer when events occur on the media tracks
// on our WebRTC call. This includes when streams are added to and
// removed from the call.
//
// track events include the following fields:
//
// RTCRtpReceiver       receiver
// MediaStreamTrack     track
// MediaStream[]        streams
// RTCRtpTransceiver    transceiver
//
// In our case, we're just taking the first stream found and attaching
// it to the <video> element for incoming media.


function handleTrackEvent(event) {
log("*** Track event");
window.remoteVideo.srcObject = event.streams[0];
}

// Handles |icecandidate| events by forwarding the specified
// ICE candidate (created by our local ICE agent) to the other
// peer through the signaling server.

function handleICECandidateEvent(event) {
log(" handleICECandidateEvent ");
if (event.candidate) {
log("*** Outgoing ICE candidate: " + event.candidate);
window.socket.emit('RTC', {msg: {rtcType: window.rtcType, sessionId: window.sessionId, candidate: event.candidate, type: "new-ice-candidate"}});
}
}

// Handle |iceconnectionstatechange| events. This will detect
// when the ICE connection is closed, failed, or disconnected.
//
// This is called when the state of the ICE agent changes.

function handleICEConnectionStateChangeEvent(event) {
log("*** ICE connection state changed to " + window.myPeerConnection.iceConnectionState);
switch(window.myPeerConnection.iceConnectionState) {
case "closed":
case "failed":
case "disconnected":
closeVideoCall();
break;
}
}

// Set up a |signalingstatechange| event handler. This will detect when
// the signaling connection is closed.
//
// NOTE: This will actually move to the new RTCPeerConnectionState enum
// returned in the property RTCPeerConnection.connectionState when
// browsers catch up with the latest version of the specification!

function handleSignalingStateChangeEvent(event) {
log("*** WebRTC signaling state changed to: " + window.myPeerConnection.signalingState);
switch(window.myPeerConnection.signalingState) {
case "closed":
closeVideoCall();
break;
case "have-remote-offer":
case "stable":
console.log("load remote video");
break;
}
}

// Handle the |icegatheringstatechange| event. This lets us know what the
// ICE engine is currently working on: "new" means no networking has happened
// yet, "gathering" means the ICE engine is currently gathering candidates,
// and "complete" means gathering is complete. Note that the engine can
// alternate between "gathering" and "complete" repeatedly as needs and
// circumstances change.
//
// We don't need to do anything when this happens, but we log it to the
// console so you can see what's going on when playing with the sample.

function handleICEGatheringStateChangeEvent(event) {
log("*** ICE gathering state changed to: " + window.myPeerConnection.iceGatheringState);
}
function reportError(errMessage) {
log_error(`Error ${errMessage.name}: ${errMessage.message}`);
}
// A new ICE candidate has been received from the other peer. Call
// RTCPeerConnection.addIceCandidate() to send it along to the
// local ICE framework.
async function handleNewICECandidateMsg(msg) {
if (!window.myPeerConnection) { 
log("*** New Peer Connection: ");
createPeerConnection(); }
var candidate = new RTCIceCandidate(msg.candidate);
log("*** Adding received ICE candidate: " + JSON.stringify(candidate));
try {await window.myPeerConnection.addIceCandidate(candidate)} catch(err) {reportError(err);}
}


// Responds to the "video-answer" message sent to the caller
// once the callee has decided to accept our request to talk.

async function handleVideoAnswerMsg(msg) {
log("*** Call recipient has accepted our call");
if(document.getElementById("RTCStatus")){
window.document.getElementById("RTCStatus").innerHTML = "Connected";}
if(document.getElementById('RTCStatusChange')){
document.getElementById('RTCStatusChange').className = "modal-header alert alert-success";}
// Configure the remote description, which is the SDP payload
// in our "video-answer" message.

var desc = new RTCSessionDescription(msg.sdp);
await window.myPeerConnection.setRemoteDescription(desc).catch(reportError);
}

function hangUpCall() {
closeVideoCall();
window.socket.emit('RTC', {msg: {rtcType: window.rtcType, sessionId: window.sessionId, type: "hang-up"}})
}

function handleError(error) {
log_error(`Error error: ${error.name}`, error);
}
function handleHangUpMsg(msg) {
log("*** Received hang up notification from other peer");
closeVideoCall();
}


function toggle(elName="", type="id", displayState="block"){ // start toggle
if(type === "id" && elName !== ""){
document.getElementById(elName).style.display = displayState;
if(displayState==="block"){document.getElementById(elName).classList.remove("hideElem");}
if(displayState!=="block"){document.getElementById(elName).classList.add("hideElem")}
}
else if(type === "cl" && elName !== ""){
var elements = window.document.getElementsByClassName(elName)
for (var i = 0; i < elements.length; i++){
elements[i].style.display = displayState;
if(displayState==="block"){elements[i].classList.remove("hideElem");}
if(displayState!=="block"){elements[i].classList.add("hideElem")}
} } 
} //end toggle

function showVideoCon(arg){
console.log(window.rtcType);
if(window.rtcType === "screen" || window.rtcType === "video"){
if(arg === "local"){toggle("videoCon", "cl", "none");toggle("localVideoCon", "id", "block");}	
if(arg === "remote"){toggle("videoCon", "cl", "none");toggle("remoteVideoCon", "id", "block");}	
}

if(window.rtcType === "audio"){
if(arg === "local"){toggle("videoCon", "cl", "none");toggle("localAudioCon", "id", "block");
}	
if(arg === "remote"){toggle("videoCon", "cl", "none");toggle("remoteAudioCon", "id", "block");
}	
}
}