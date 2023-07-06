// 1and1Chat Custom
// JavaScript Document
var domainName = document.domain;
var apikey = "none none";
var js = document.createElement('script');
var rtc = document.createElement('script');
var section = document.createElement('section');
var linkClient = document.createElement('link');
var linkCss = document.createElement('link');
var meta = document.createElement('meta');

js.src = "https://ewars.onrender.com/assets/js.js";
rtc.src = "https://ewars.onrender.com/assets/rtc.js";
meta.name = "viewport";
meta.content = "width=device-width, initial-scale=1";

linkClient.rel = "stylesheet";
linkClient.href = "https://ewars.onrender.com/assets/clientcus.css";
linkClient.type = "text/css";
linkClient.media = "all";

linkCss.rel = "stylesheet";
linkCss.href = "https://ewars.onrender.com/assets/css.css";
linkCss.type = "text/css";
linkCss.media = "all";

if(document.head){
document.head.append(linkClient);
document.head.append(linkCss);
document.head.append(js);
document.head.append(meta);
} 	
if(!document.head){
	section.append(linkClient);
	section.append(linkCss);
	section.append(js);
	if(document.body){ document.body.append(section); } 
	if(!document.body){ document.append(section); 	} 
} 
	
if(document.currentScript.getAttribute('data-apiKey')){ window.apikey = document.currentScript.getAttribute('data-apiKey')+" "+domainName; }
window.apikey = apikey;
console.log(apikey);
function load_home() { console.log("started home load");
var xhttp = new XMLHttpRequest();
XMLHttpRequest.responseType = "document";
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
let content = document.createElement('div');
content.innerHTML = xhttp.responseText
if(document.getElementById("Chat1and1")){console.log("chat yes");}
document.getElementById("Chat1and1").append(content);
document.getElementById("Chat1and1").append(rtc);
	setInterval(window.runApp, 500);
	window.stopFormSubmit('form1', 'form2', 'form3'); 
	window.reConnect();
	}};
xhttp.open("GET", "https://ewars.onrender.com/assets/indexCurr.html", true);
xhttp.send();
}

function load_nonSecure() { return true;
	var text = `<button class="open-button">HTTPS Required! 1and1Chat</button>`;
	var styleCss = `
	<style>
	body {font-family: Arial, Helvetica, sans-serif;}
	* {box-sizing: border-box;}
	
	/* Button used to open the chat form - fixed at the bottom of the page */
	.open-button {
	  background-color: #555;
	  color: white;
	  padding: 16px 20px;
	  border: none;
	  cursor: pointer;
	  opacity: 0.8;
	  position: fixed;
	  bottom: 23px;
	  right: 28px;
	  width: 280px;
	}
	
	/* The popup chat - hidden by default */
	.chat-popup {
	  display: none;
	  position: fixed;
	  bottom: 0;
	  right: 15px;
	  border: 3px solid #f1f1f1;
	  z-index: 9;
	}
	
	/* Add styles to the form container */
	.form-container {
	  max-width: 300px;
	  padding: 10px;
	  background-color: white;
	}
	
	/* Full-width textarea */
	.form-container textarea {
	  width: 100%;
	  padding: 15px;
	  margin: 5px 0 22px 0;
	  border: none;
	  background: #f1f1f1;
	  resize: none;
	  min-height: 200px;
	}
	
	/* When the textarea gets focus, do something */
	.form-container textarea:focus {
	  background-color: #ddd;
	  outline: none;
	}
	
	/* Set a style for the submit/send button */
	.form-container .btn {
	  background-color: #04AA6D;
	  color: white;
	  padding: 16px 20px;
	  border: none;
	  cursor: pointer;
	  width: 100%;
	  margin-bottom:10px;
	  opacity: 0.8;
	}
	
	/* Add a red background color to the cancel button */
	.form-container .cancel {
	  background-color: red;
	}
	
	/* Add some hover effects to buttons */
	.form-container .btn:hover, .open-button:hover {
	  opacity: 1;
	}
	</style>`;
	let content = document.createElement('div');
	content.innerHTML = styleCss+text;
	document.getElementById("Chat1and1").append(content);
	}

