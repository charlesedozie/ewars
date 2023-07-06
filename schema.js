const { gql } = require('apollo-server-express');

const typeDefs = gql`

type Query {
    sideMenu: [Links]
    userStatus: [List]
    signIn(username: String!, password: String!, domain: String): [List]
    password(username: String!, domain: String, otp: String!, password: String!, confirmpassword: String!, frmMode: Int!): [List]
    getList(listid: Int, sectionid: Int, sessionid: Int, id: ID): [List]
    getSiteList(listid: Int!, section: String): [List]
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
    formid: Int,
    frmtype: Int,
    gender: Int,
    fullname: String,
    status: Int,
    description: String,
    password: String,
    confirmPassword: String,
    confirmpassword: String,
    address: String,
    city: String,
    province: String,
    zip: String,
    country: Int,
    phone: String,
    itemstatus: Int,
    title: String,
    id: Int,
    domain: String,
    tbl: Int,
    rowid: Int,
    planid: Int,
    total: Int,
	uuid: String,
	planstate: Int,
	stringone:String,
	stringtwo:String,
	stringthree:String,
	stringfour:String,
	stringfive:String,
	stringsix:String,
	stringseven:String,
	stringeigth:String,
	stringnine:String,
	stringten:String,
	stringeleven:String,
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
  } 

type List {
id: ID,
planid: ID,
inid: Int, 
date: String,
userid: Int, 
status: Int,
typeid: Int, 
domain: String, 
username: String, 
address: String,
city: String,
province: String,
country: Int,
passowrd: String,
msg: String,
title: String,
description: String,
fullname: String,
gender:Int,
email: String,
name: String,
itemId: Int,
zip: String,
phone: String,
completed: String,
broken: String,
noanswer: String,
total: Int,
addnew: Int,
subone: [SubOne],
planstate: Int,
stringone:String,
stringtwo:String,
stringthree:String,
stringfour:String,
stringfive:String,
stringsix:String,
stringseven:String,
stringeigth:String,
stringnine:String,
stringten:String,
stringeleven:String,
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
tbl: Int,
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
