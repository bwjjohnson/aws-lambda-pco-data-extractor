# aws-lambda-pco-data-extractor
A NodeJS AWS Lambda function to get PlanningCenterOnline data

This app makes use of the node-lambda package:
  https://www.npmjs.com/package/node-lambda

To test running the function locally, run this:
  ./node_modules/node-lambda/bin/node-lambda run --configFile deploy.env

Where the deploy.env file contains the unencrypted credentials as
environment variables, and a line with 'decrypted=true'.

To update credentials for PCO, login to the AWS Console, and
update the Lambda function configuration:
  Create a Lambda Function Using Environment Variables To Store
  Sensitive Information
  http://docs.aws.amazon.com/lambda/latest/dg/tutorial-env_console.html

PCO API Credentials can be managed here:
  https://api.planningcenteronline.com/oauth/applications/

PCO API Documentation can be found here:
  https://planningcenter.github.io/api-docs

