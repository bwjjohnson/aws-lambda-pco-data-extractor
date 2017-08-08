'use strict';

const AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
let s3 = new AWS.S3({apiVersion: '2006-03-01'});
const https = require('https');
const deasync = require('deasync');

const decrypted = process.env['decrypted'];
const rawAppId = process.env['app_id'];
const rawSecret = process.env['secret'];
let decryptedAppId;
let decryptedSecret;

function processEvent(event, context, callback) {
  if (decryptedAppId !== undefined && decryptedSecret !== undefined){
    let pcoData = getPCOData();
    console.log("pcoData = " + JSON.stringify(pcoData));
    uploadDataToS3(pcoData);
  }
}

exports.handler = (event, context, callback) => {
  if (decrypted) {
    decryptedAppId = rawAppId;
    decryptedSecret = rawSecret;
    processEvent(event, context, callback);
  } else {
    decryptData(rawAppId, decryptedAppId, event, context, callback);
    decryptData(rawSecret, decryptedSecret, event, context, callback);
  }
};

function decryptData(encrypted, decrypted, event, context, callback){
  const kms = new AWS.KMS();
  kms.decrypt({ CiphertextBlob: new Buffer(encrypted, 'base64') }, (err, data) => {
    if (err) {
      console.log('Decrypt error:', err);
      return callback(err);
    }
    decrypted = data.Plaintext.toString('ascii');
    processEvent(event, context, callback);
  });
}

function getPCOData(){
  var teamByDate = {};
  var service_types = callPCO('/services/v2/service_types');
  var gatheringId = service_types.data.filter( function(type) {
    return type.attributes.name == "Gatherings"; })[0].id;
  console.log("gaterhingId = " + gatheringId);

  var plans = callPCO('/services/v2/service_types/' + gatheringId + '/plans?per_page=2');
  var nextPage = plans.links.next;
  console.log("nextPage = " + nextPage);
  for (var plan of plans.data) {
    var planDate = new Date(plan.attributes.dates).toISOString().substr(0,10);
    console.log("planDate = " + planDate);
    console.log("planId = " + plan.id);
    var teammates = callPCO('/services/v2/service_types/' + gatheringId + '/plans/' + plan.id + '/team_members');
    var team = [];
    for ( var person of teammates.data ) {
      var name = person.attributes.name.replace(/[a-z] ?/g,'');
      var position = person.attributes.team_position_name.replace(/_/,'');;
      //console.log("name = " + name);
      //console.log("position = " + position);
      team.push({name: name, position: position});
    }
    console.log("team = " + JSON.stringify(team));
    teamByDate[planDate] = team;
  }
  return teamByDate;
}

function callPCO(path){
  console.log("calling PCO for resource: " + path);
  var options = {
     host: 'api.planningcenteronline.com',
     port: 443,
     path: path,
     headers: {
       'Authorization': 'Basic ' + new Buffer(decryptedAppId + ':' + decryptedSecret).toString('base64')
     }
  };
  var response;
  var request = https.get(options, function(res){
    var body = "";
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      // console.log(body);
      response = JSON.parse(body);
    })
    res.on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  });
  while(response === undefined) {
    deasync.runLoopOnce();
  }
  return response;
};

function uploadDataToS3(obj){
  var json = JSON.stringify(obj);
  var uploadParams = {
    Bucket: 'media.downtowncornerstone.org',
    Key: 'teamDataByDate.json',
    Body: json,
    ContentType: 'application/json'};
  s3.upload(uploadParams, function(err, data) {
    if (err) {
      console.log("Error uploading data: ", err);
    } else {
      console.log("Successfully updated data at " + uploadParams.Bucket + '/' + uploadParams.Key);
    }
  });
}

