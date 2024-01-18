const { gql } = require('apollo-server-express');

const typeDefs = gql`

type Query {
    sideMenu: [Links]
    userStatus: [List]
    signIn(username: String!, password: String!, domain: String): [List]
    password(username: String!, domain: String, otp: String!, password: String!, confirmpassword: String!, frmMode: Int!): [List]
    getList(listid: Int, sectionid: Int, sessionid: Int, id: ID): [List]
    getSiteList(listid: Int, arg1: String, arg2: String): [List]
  }

type Mutation {
  addRecord(input: FormInput): List
  setUp(username: String, domain: String, fullname: String, country: String):[List]
  }
  
  type Links {
    title: String,
    addnew: Int,
    inid: Int,
    id: ID,
    description: String,
    itemId: Int,
    groupid: Int,
	sidegroup: Int,
  } 

  input FormInput {
    username: String, 
    id: Int,
	formid: Int,
	uuid: String,
    frmtype: Int,
    gender: String,
    value: String,
    fullname: String,
    valueblob: String,
    fieldtype: String,
    status: String,
    required: String,
	typeid: String,
    description: String,
    addnew: String,
    name: String,
    password: String,
    masterid: Int,
	confirmPassword: String,
    address: String,
    city: String,
    province: String,
    zip: String,
	country: String,
    phone: String,
    itemstatus: String,
	title: String,
	domain: String,
	selectfield: String,
    
	tbl: String,
    rowid: String,
    planid: String,
    total: String,
	string1:String,
	string2:String,
	string3:String,
	string4:String,
	string5:String,
	string6:String,
	
	string7:String,
	string8:String,
	string9:String,
	string10:String,
	string11:String,
	string12:String,
	string13:String,
	string14:String,
	string15:String,
	string16:String,
	
	string17:String,
	string18:String,
	string19:String,
	string20:String,
	string21:String,
	string22:String,
	string23:String,
	string24:String,
	string25:String,
	string26:String,
	
	string27:String,
  } 

type List {
id: ID,
planid: String,
inid: Int, 
date: String,
userid: Int, 
status: String,
typeid: String,
domain: String, 
username: String, 
address: String,
fieldtype: String,
masterid: Int,
city: String,
province: String,
country: String,
passowrd: String,
required: String,
msg: String,
selectfield: String,
title: String,
valueblob: String,
description: String,
fullname: String,
gender:String,
email: String,
name: String,
itemId: Int,
zip: String,
value: String,
phone: String,
completed: String,
itemstatus: String,
broken: String,
noanswer: String,
total: String,
addnew: String,
subone: [SubOne],
planstate: String,
string1:String,
string2:String,
string3:String,
string4:String,
string5:String,
string6:String,
string7:String,
string8:String,
string9:String,
string10:String,
string11:String,
string12:String,
string13:String,
string14:String,
string15:String,
string16:String,
string17:String,
string18:String,
string19:String,
string21:String,
string22:String,
string23:String,
string24:String,
string25:String,
string26:String,
string27:String,
tbl: String,
}

type SubOne {
s1inid: Int, 
s1itemId: Int,
s1title: String,
s1description: String,
s2: String,
s3: String,
s4: String,
s5: String,
s6: String,
s7: String,
s8: String,
s9: String,
s10: String,
s11: String,
s1status: Int,
s1id: ID                # "!" denotes a required field
}
type Sub2 {
s1inid: Int, 
s1itemId: Int,
s1title: String,
s1description: String,
s2: String,
s3: String,
s4: String,
s5: String,
s6: String,
s7: String,
s8: String,
s9: String,
s10: String,
s11: String,
s1status: Int,
s1id: ID                # "!" denotes a required field
}
type Sub3 {
s1inid: Int, 
s1itemId: Int,
s1title: String,
s1description: String,
s2: String,
s3: String,
s4: String,
s5: String,
s6: String,
s7: String,
s8: String,
s9: String,
s10: String,
s11: String,
s1status: Int,
s1id: ID                # "!" denotes a required field
}

 type Sub4 {
s1inid: Int, 
s1itemId: Int,
s1title: String,
s1description: String,
s2: String,
s3: String,
s4: String,
s5: String,
s6: String,
s7: String,
s8: String,
s9: String,
s10: String,
s11: String,
s1status: Int,
s1id: ID                # "!" denotes a required field
}

 type Sub5 {
s1inid: Int, 
s1itemId: Int,
s1title: String,
s1description: String,
s2: String,
s3: String,
s4: String,
s5: String,
s6: String,
s7: String,
s8: String,
s9: String,
s10: String,
s11: String,
s1status: Int,
s1id: ID                # "!" denotes a required field
}

`;

module.exports = typeDefs;
