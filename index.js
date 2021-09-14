const aws = require("aws-sdk");
const cloudfront = new aws.CloudFront();

exports.handler = async (event) => {
  // TODO implement
  console.log(
    event["CodePipeline.job"]["data"]["actionConfiguration"]["configuration"]
  );
  const userParams =
    event["CodePipeline.job"]["data"]["actionConfiguration"]["configuration"][
      "UserParameters"
    ];

  console.log(userParams["distributionId"], userParams["objectPaths"]);

  const params = {
    DistributionId: userParams["distributionId"] /* required */,
    InvalidationBatch: {
      CallerReference: "" + new Date().getTime() /* required */,
      Paths: {
        Quantity: userParams["objectPaths"].length /* required */,
        Items: userParams["objectPaths"],
      },
    },
  };
  cloudfront.createInvalidation(params, (err, data) => {
    if (err) console.log(err, err.stack);
    else console.log(data); // successful response
  });
  return null;
};
