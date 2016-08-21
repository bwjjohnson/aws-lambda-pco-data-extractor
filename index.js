'use strict';

let s3crypt = require('node-s3-encryption-client');

exports.handler = (event, context, callback) => {
  console.log('event: ' + JSON.stringify(event));
  if (event.putCreds) {
    putCreds(event.putCreds);
  } else {
    getCreds('pco', function(err, data){
      if (err) console.log(err, err.stack);
      else console.log(data);
    });
  }
}

function putCreds(creds){
  if (!creds.name) {
    
  }
  var kmsParams = {
    KeyId: 'arn:aws:kms:us-east-1:008838943100:alias/planningcenteronline',
    KeySpec: 'AES_256'
  };
  var putParams = {
    Bucket: 'www.downtowncornerstone.org',
    Key: 'creds/' + creds.name + '.accessKey',
    Body: creds.accessKey,
    KmsParams: kmsParams
  };
  console.log(putParams);
  s3crypt.putObject(putParams, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
      console.log(data);
      putParams.Key = 'creds/' + creds.name + '.secretKey';
      putParams.Body = creds.secretKey
      putParams.KmsParams = kmsParams;
      delete putParams.Metadata;
      console.log(putParams);
      s3crypt.putObject(putParams, function(err, data) {
        if (err) console.log(err, err.stack);
        else {
          console.log(data);
          console.log('Credentials Saved!');
        }
      });
    }
  });
}

function getCreds(name, callback){
  var getParams = {
    Bucket: 'www.downtowncornerstone.org',
    Key: 'creds/' + name + '.accessKey',
  };
  s3crypt.getObject(getParams, function(err, data1) {
    if (err) callback(err, null);
    else {
      // console.trace(data1);
      getParams.Key = 'creds/' + name + '.secretKey',
      s3crypt.getObject(getParams, function(err, data2) {
        if (err) callback(err, null);
        else {
          // console.trace(data2);
          callback(null, {accessKey: data1.Body, secretKey: data2.Body});
        }
      });
    }
  });
};

