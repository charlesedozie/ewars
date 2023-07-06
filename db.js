require('dotenv').config();
var mysql = require('mysql');
var con = mysql.createConnection({
host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE

});
//con.connect();
async function itemStatus (tbl, rowid, status, userId, domain, editid=0 ) {
  let sql = "UPDATE itemstatus SET status = 2, userid = "+con.escape(userId)+" WHERE (status = 1 AND rowid = "+con.escape(parseInt(rowid))+" AND domain = "+con.escape(domain)+" AND tbl = "+con.escape(parseInt(tbl))+" AND editid = "+con.escape(parseInt(editid))+")";
  let success = 0;   

con.query(sql, (error, results) => {
if (error) { return error; }
let addRec = SY_dbUpdate("INSERT INTO itemstatus (userid, tbl, rowid, domain, status, editid) VALUES ("+con.escape(userId)+", "+con.escape(tbl)+", "+con.escape(rowid)+", "+con.escape(domain)+", "+con.escape(status)+", "+con.escape(editid)+")");
if(addRec){  success = 1; }
return success; 
});
}
function query (sql) {
return new Promise((resolve, reject) => {
    con.query(sql, (error, results) => {
        if (error) { return error; }
        resultSet = results.map(result => Object.assign({}, result));
        return resolve(resultSet);
    });
    })
}

function SY_query (sql) {
    con.query(sql, (error, results) => {
        if (error) { return error; }
          resultSet = results.map(result => Object.assign({}, result));
          return resultSet;
      });
  }
function checkValue(sql) {
return new Promise((resolve, reject) => {
con.query(sql, (error, results) => {
    if (error) { return error; }
numRows = results.length;
return resolve(numRows);
});
})
}

  function SY_checkValue(sql) {
    //return new Promise((resolve, reject) => {
      con.query(sql, (error, results) => {
        if (error) { return error; }
        numRows = results.length;
        return numRows;
      });
   // })
  }
  
  
 /*
  


  function checkValue(sql) {// return 22;
    con.query(sql, (error, results) => {
          if (error) return error;
          resultSet = results.map(result => Object.assign({}, result));
          return resultSet;
      });
  }
  
   function checkValue(sql) {
    return 11;
    con.query(sql, (error, results) => {
      numRows = results.length;
          if (error) return error;
          //resultSet = results.map(result => Object.assign({}, result));
          return 11;//numRows;
      });
  }
 
function checkValue(sql) {
    return new Promise((resolve, reject) => {
      con.query(sql, (error, results) => {
        numRows = results.length;
        if (error) return reject(error);
        //resultSet = results.map(result => Object.assign({}, result));
        return resolve(numRows);
      });
    })
  }
*/
    
function dbUpdate(sql) {
return new Promise((resolve, reject) => {
    con.query(sql, (error, result) => {
        if (error) { return error; }
    return resolve(result);
    });
})
}
    
function SY_dbUpdate(sql) {
      con.query(sql, (error, result) => {
        if (error) { return error; }
      return result;
      });
  }


exports.query = query;
exports.dbUpdate = dbUpdate;
exports.checkValue = checkValue;
exports.SY_query = SY_query;
exports.SY_dbUpdate = SY_dbUpdate;
exports.itemStatus = itemStatus;
exports.SY_checkValue = SY_checkValue;