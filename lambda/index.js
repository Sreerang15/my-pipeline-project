import {
  CloudFormationClient,
  DetectStackDriftCommand,
  DescribeStackDriftDetectionStatusCommand,
  DescribeStackResourceDriftsCommand,
} from "@aws-sdk/client-cloudformation";

const STACK_NAME = "MyPipelineProjectStack1"; // change or set via env
const REGION = "ap-south-1"; // change if needed

const client = new CloudFormationClient({ region: REGION });

async function main() {
  console.log(`🔎 Starting drift detection for stack: ${STACK_NAME}`);

  // Step 1: Trigger drift detection
  const detectResp = await client.send(
    new DetectStackDriftCommand({ StackName: STACK_NAME })
  );
  if (!detectResp.StackDriftDetectionId) {
    throw new Error("Failed to start drift detection");
  }
  const detectionId = detectResp.StackDriftDetectionId;
  console.log(`Drift detection started. Id: ${detectionId}`);

  // Step 2: Poll until detection is complete
  let detectionStatus = "DETECTION_IN_PROGRESS";
  const timeoutMs = 30 * 60 * 1000; // 30 minutes
  const intervalMs = 5000;
  const startTime = Date.now();

  while (detectionStatus === "DETECTION_IN_PROGRESS") {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error("Timeout waiting for drift detection to complete");
    }
    await new Promise((r) => setTimeout(r, intervalMs));

    const statusResp = await client.send(
      new DescribeStackDriftDetectionStatusCommand({
        StackDriftDetectionId: detectionId,
      })
    );

    detectionStatus = statusResp.DetectionStatus;
    console.log(`Detection status: ${detectionStatus}`);

    if (detectionStatus === "DETECTION_FAILED") {
      throw new Error(
        `❌ Drift detection failed: ${statusResp.DetectionStatusReason}`
      );
    }
  }

  // Step 3: Inspect drifted resources
  const driftResp = await client.send(
    new DescribeStackResourceDriftsCommand({
      StackName: STACK_NAME,
    })
  );

  const driftedResources = (driftResp.StackResourceDrifts || []).filter(
    (r) => r.ResourceDriftStatus !== "IN_SYNC"
  );

  if (driftedResources.length > 0) {
    console.error("⚠️ Drift detected in resources:");
    driftedResources.forEach((r) =>
      console.error(
        ` - ${r.LogicalResourceId} (${r.ResourceType}): ${r.ResourceDriftStatus}`
      )
    );
    process.exit(1); // exit with failure
  }

  console.log(`✅ Stack ${STACK_NAME} is in sync. No drift found.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
