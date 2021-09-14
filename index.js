const aws = require("aws-sdk");
const cloudfront = new aws.CloudFront();
const codepipeline = new aws.CodePipeline();

exports.handler = async (event, context) => {
  // TODO implement
  console.log(
    event["CodePipeline.job"]["data"]["actionConfiguration"]["configuration"]
  );

  const jobId = event["CodePipeline.job"].id;

  const userParams =
    event["CodePipeline.job"]["data"]["actionConfiguration"]["configuration"][
      "UserParameters"
    ];

  const parsedParams = JSON.parse(userParams);

  const params = {
    DistributionId: parsedParams["distributionId"] /* required */,
    InvalidationBatch: {
      CallerReference: `Invalidation-LAMBDA-${new Date().getTime()}` /* required */,
      Paths: {
        Quantity: 1 /* required */,
        Items: ["/*"],
      },
    },
  };

  const putJobSuccess = async (message) => {
    const params = {
      jobId: jobId,
    };
    await codepipeline
      .putJobSuccessResult(params)
      .promise()
      .then(async () => {
        await context.succeed(message);
      })
      .catch(async (err) => {
        await context.fail(err);
        throw err;
      });
  };

  // Notify CodePipeline of a failed job
  const putJobFailure = async (message) => {
    const params = {
      jobId: jobId,
      failureDetails: {
        message: JSON.stringify(message),
        type: "JobFailed",
        externalExecutionId: context.awsRequestId,
      },
    };
    await codepipeline
      .putJobFailureResult(params)
      .promise()
      .then(async (err, data) => {
        await context.fail(message);
        throw err;
      });
  };

  console.log(parsedParams["distributionId"], parsedParams["objectPaths"]);

  if (!parsedParams["distributionId"] || !parsedParams["objectPaths"]) {
    await putJobFailure("distributionId not Exist");
    const response = {
      statusCode: 400,
    };
    return response;
  }

  await cloudfront
    .createInvalidation(params)
    .promise()
    .then(async () => {
      await putJobSuccess("Invalidation Succes");
    })
    .catch(async (err) => {
      await putJobFailure("Error for Invalidation");
      throw err;
    });

  const response = {
    statusCode: 200,
  };
  return response;
};
