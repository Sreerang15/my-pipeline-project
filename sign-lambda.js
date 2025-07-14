// sign-lambda.js
const {
  SignerClient,
  StartSigningJobCommand,
} = require("@aws-sdk/client-signer");

async function startSigning() {
  const client = new SignerClient({ region: "ap-south-1" });

  const input = {
    source: {
      s3: {
        bucketName: "cdk-hnb659fds-assets-807157871082-ap-south-1",
        key: "016f688f9bfdd3b74c15138d88d915a58711405a83c78142677d648778174053.zip",
        version: "x56cG02kDf7LYM5tgTeQu77h8xIKxg68",
      },
    },
    destination: {
      s3: {
        bucketName: "honorbucket",
        prefix: "signed/",
      },
    },
    profileName: "MySigningProfileB3B3644B_66tketJzwLks",
    clientRequestToken: "unique-id-" + Date.now(),
  };

  const command = new StartSigningJobCommand(input);
  const response = await client.send(command);
  console.log("Signing Job Started:", response);
}

startSigning().catch(console.error);
