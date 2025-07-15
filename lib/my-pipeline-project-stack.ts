import { Stack, StackProps, Aspects, IAspect } from "aws-cdk-lib";
import { Construct, IConstruct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  CodeBuildStep,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import * as cdk from "aws-cdk-lib";
import { GitHubTrigger } from "aws-cdk-lib/aws-codepipeline-actions";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { LambdaStage } from "./lambda-stage";
import { Project } from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import * as signer from "aws-cdk-lib/aws-signer";
import { warn } from "console";
import { SignerClient, StartSigningJobCommand } from "@aws-sdk/client-signer";
import { CodeBuildLogRetentionAspect } from "../aspect";

//kkkk
export class MyPipelineProjectStacknew extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const signingProfile = new signer.SigningProfile(this, "MySigningProfile", {
      platform: signer.Platform.AWS_LAMBDA_SHA384_ECDSA,
    });

    // Code Signing Configuration
    const codeSigningConfig = new lambda.CodeSigningConfig(
      this,
      "MyCodeSigningConfig",
      {
        signingProfiles: [signingProfile],
        untrustedArtifactOnDeployment:
          lambda.UntrustedArtifactOnDeployment.ENFORCE,
      }
    );

    // Dummy Lambda to trigger asset stage
    new lambda.Function(this, "DummyLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"),
      codeSigningConfig: codeSigningConfig,
    });

    new lambda.Function(this, "DummyLambda2", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"),
      //codeSigningConfig: codeSigningConfig,
    });

    new lambda.Function(this, "DummyLambda3", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "entry.handler",
      code: lambda.Code.fromAsset("lambda"),
      functionName: "dummyLambda3",
      codeSigningConfig: codeSigningConfig,
    });

    // Define the synth step

    const buildAction = new CodeBuildStep("SynthStep", {
      input: CodePipelineSource.gitHub(
        "Sreerang15/my-pipeline-project",
        "master",
        {
          authentication: cdk.SecretValue.plainText(
            "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"
          ),
          trigger: GitHubTrigger.NONE,
        }
      ),
      installCommands: ["npm install"],
      commands: [
        "npm run build",
        "npx cdk synth",
        "cp sign-lambda.js cdk.out/",
      ],
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, "BuildLogGroup", {
            logGroupName: "",
          }),
        },
      },
    });

    // Define the pipeline
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "MyNewPipeline8",
      synth: buildAction,
    });

    const signStep = new CodeBuildStep("SignLambdaCode", {
      input: buildAction,
      installCommands: ["npm install @aws-sdk/client-signer"],
      commands: ["echo 'Triggering Signer Job...'", "node sign-lambda.js"],
      rolePolicyStatements: [
        new iam.PolicyStatement(
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              "signer:StartSigningJob",
              "signer:DescribeSigningJob",
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:PutObject",
            ],
            resources: [
              // Signer profile
              "arn:aws:signer:ap-south-1:807157871082:/signing-profiles/MySigningProfileB3B3644B_66tketJzwLks",

              // Source object for signing
              "arn:aws:s3:::cdk-hnb659fds-assets-807157871082-ap-south-1/016f688f9bfdd3b74c15138d88d915a58711405a83c78142677d648778174053.zip",

              // Optional: access to bucket for object version retrieval
              "arn:aws:s3:::cdk-hnb659fds-assets-807157871082-ap-south-1",

              // Destination prefix for signed artifact
              "arn:aws:s3:::honorbucket/signed/*",

              // Optional: root of destination bucket
              "arn:aws:s3:::honorbucket",
            ],
          })
        ),
      ],
    });

    // Add application stage
    const lambdaStage = new LambdaStage(this, "LambdaDeployStage");
    pipeline.addStage(lambdaStage, { pre: [signStep] });

    // Apply log retention aspect
    Aspects.of(this).add(
      new CodeBuildLogRetentionAspect(logs.RetentionDays.FIVE_YEARS)
    );
  }
}
