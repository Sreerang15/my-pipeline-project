import { Stack, StackProps, Aspects, IAspect } from 'aws-cdk-lib';
import { Construct, IConstruct } from 'constructs';
import {
  CodePipeline,
  CodePipelineSource,
  CodeBuildStep,
} from 'aws-cdk-lib/pipelines';
import * as cdk from 'aws-cdk-lib';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaStage } from './lambda-stage';
import { Project } from 'aws-cdk-lib/aws-codebuild';

class CodeBuildLogRetentionAspect implements IAspect {
  private readonly retention: logs.RetentionDays;

  constructor(retention: logs.RetentionDays) {
    this.retention = retention;
  }

  visit(node: IConstruct): void {
    if (node instanceof Project) {
      new logs.LogRetention(node, `LogRetention-${node.node.addr}`, {
        logGroupName: `/aws/codebuild/${node.projectName}`,
        retention: this.retention,
      });
    }
  }
}

export class MyPipelineProjectStacknew extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Dummy Lambda to trigger asset stage
    new lambda.Function(this, 'DummyLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    // Define the synth step
    const buildAction = new CodeBuildStep('SynthStep', {
      input: CodePipelineSource.gitHub('Sreerang15/my-pipeline-project', 'master', {
        authentication: cdk.SecretValue.plainText('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'),
        trigger: GitHubTrigger.NONE,
      }),
      installCommands: ['npm install'],
      commands: ['npm run build', 'npx cdk synth'],
    });

    // Define the pipeline
    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyNewPipeline8',
      synth: buildAction,
    });

    // Add application stage
    const lambdaStage = new LambdaStage(this, 'LambdaDeployStage');
    pipeline.addStage(lambdaStage);

    // Apply log retention aspect
    Aspects.of(this).add(new CodeBuildLogRetentionAspect(logs.RetentionDays.THREE_DAYS));
  }
}