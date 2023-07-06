// JavaScript Document
var script = document.createElement('script');
script.src = "https://www.paypal.com/sdk/js?client-id=ARasUEyy0ByVkfcoEpgdS6b8cm_7YFfKPIZfOhK87maoMMf5Vdlce0OnNhvQmlC0XO-S6pfWUg1ptEJB";
document.head.appendChild(script);


//var ioServer = "http://home.com:456";
var ioServer = "https://io.1and1chat.com";
//var chatServer = "http://home.com:433"; 
var chatServer = "https://gql.1and1chat.com"; 
var domainName = document.domain;
var socket = window.io(ioServer, { autoConnect: false }); // establish connection to socket server
var apiEnd = chatServer;
//var content = {userID: "NA", sessionID:"NA"}; // update content var
//socket.auth = { content }; // set socket authentication with content var
