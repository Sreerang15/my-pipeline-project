import { Stack, StackProps , IAspect ,Aspects} from 'aws-cdk-lib';
import { Construct , IConstruct  } from 'constructs';
import {
  CodePipeline,
  CodePipelineSource,
  CodeBuildStep,
} from 'aws-cdk-lib/pipelines';
import * as cdk from 'aws-cdk-lib';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as logs from 'aws-cdk-lib/aws-logs'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaStage } from './lambda-stage';

class AssetLogRetentionAspect implements IAspect {

  constructor(private readonly days: number){}

  visit(node: IConstruct): void {
    if (node instanceof logs.CfnLogGroup && node.retentionInDays === undefined) {

node.retentionInDays = this.days
    }
  }
}

export class MyPipelineProjectStacknew extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
   
    //cdk.Aspects.of(this).add(new AssetLogRetentionAspect(5));

// const logicalId = Names.uniqueId(this); // Deterministic across synths
// const logGroupName = `/aws/codebuild/${logicalId}`;

// const buildLogs = new logs.LogGroup(this, 'BuildLogGroup', {
//   retention: logs.RetentionDays.FIVE_DAYS,
// });



new lambda.Function(this, 'DummyLambda', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'), // <- this triggers the Assets stage
});


  
    const buildAction = new CodeBuildStep('SynthStep', {
      input: CodePipelineSource.gitHub('Sreerang15/my-pipeline-project', 'master', {
        authentication: cdk.SecretValue.plainText('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'),
        trigger: GitHubTrigger.NONE,
      }),
      installCommands: ['npm install'],
      commands: ['npm run build', 'npx cdk synth'],
        //      logging:{
        //   cloudWatch :{
        //     enabled:true,
        //     logGroup : buildLogs
        //   }
        // }
    });

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyNewPipeline8',
      synth: buildAction,
    });
const lambdaStage = new LambdaStage(this, 'LambdaDeployStage');
pipeline.addStage(lambdaStage);
    //cdk.Aspects.of(this).add(new AssetLogRetentionAspect(7));



  }
}


