//env variable for aws profile

const AWS = require("aws-sdk");
const axios = require("axios").default;
const SLACK_URL = "https://hooks.slack.com/services/CHANGE";

async function getAllStacks(cloudformation) {
  let lastKey = null;
  let arr = [];
  const params = {};
  do {
    if (lastKey) {
      params.NextToken = lastKey;
      const result = await cloudformation.describeStacks(params).promise();
      lastKey = result.NextToken;
      arr = [...arr, ...result.Stacks];
    } else {
      const result = await cloudformation.describeStacks(params).promise();
      lastKey = result.NextToken;
      arr = [...arr, ...result.Stacks];
    }
  } while (lastKey);
  return arr;
}

exports.handler = async function detectDrifts() {
  const regions = ["ap-south-1"];

  for (const region of regions) {
    const cloudformation = new AWS.CloudFormation({ region });
    const stacks = await getAllStacks(cloudformation);
    const driftDetections = [];
    for (const stack of stacks) {
      if (!isStackInTransition(stack.StackStatus)) {
        const res = await cloudformation
          .detectStackDrift({ StackName: stack.StackName })
          .promise();
        driftDetections.push({
          driftDetectionId: res.StackDriftDetectionId,
          stackName: stack.StackName,
        });
      }
    }
    for (let i = 0; i < 5; i++) {
      if (driftDetections.length < 1) {
        break;
      }
      //wait 10 seconds
      console.log("round", i + 1);
      await sleep(10000);
      for (const driftIndex in driftDetections) {
        const driftDetection = driftDetections[driftIndex];
        const driftStatus = await cloudformation
          .describeStackDriftDetectionStatus({
            StackDriftDetectionId: driftDetection.driftDetectionId,
          })
          .promise();
        if (
          driftStatus.DetectionStatus !== "DETECTION_IN_PROGRESS" &&
          driftStatus.StackDriftStatus === "DRIFTED"
        ) {
          const resourceDrifts = await cloudformation
            .describeStackResourceDrifts({
              StackName: driftDetection.stackName,
              StackResourceDriftStatusFilters: [
                "IN_SYNC",
                "MODIFIED",
                "DELETED",
              ],
            })
            .promise();
          const url = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stack/detail?stackId=${driftStatus.StackId}`;
          const message = `Cloudformation Drift detected for the stack: ${url}`;
          //await sendSlackMessage({ message, data: resourceDrifts, url });
          console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");

          console.log(
            `Slack message sent for stack: ${driftDetection.stackName}`
          );
          driftDetections.splice(driftIndex, 1);
        }
      }
    }
  }
};

function sendSlackMessage(params) {
  const payload = {
    attachments: [
      {
        pretext: params.message,
        title: "Drift Detected",
        title_link: params.url,
        text: JSON.stringify(params.data),
        color: "#800000",
      },
    ],
  };
  return axios.request({
    url: SLACK_URL,
    method: "POST",
    data: payload,
  });
}

function isStackInTransition(stack) {
  const transitions = [
    "CREATE_IN_PROGRESS",
    "CREATE_FAILED",
    "ROLLBACK_FAILED",
    "DELETE_FAILED",
    "UPDATE_ROLLBACK_FAILED",
    "UPDATE_IN_PROGRESS",
    "REVIEW_IN_PROGRESS",
    "DELETE_IN_PROGRESS",
    "ROLLBACK_COMPLETE",
  ];
  if (transitions.find((x) => x === stack)) {
    return true;
  } else {
    false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// detectDrifts()
//   .then()
//   .catch((err) => console.error(err));
