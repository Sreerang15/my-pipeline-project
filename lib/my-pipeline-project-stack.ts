import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CodePipeline,
  CodePipelineSource,
  CodeBuildStep,
} from 'aws-cdk-lib/pipelines';
import * as cdk from 'aws-cdk-lib';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as logs from 'aws-cdk-lib/aws-logs'

export class MyPipelineProjectStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    console.log("test loggggggggggggggg  ss dd");


    

    const buildLogs = new logs.LogGroup(this,'BuildLogGroup',{
      retention : logs.RetentionDays.ONE_WEEK
    })

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyNewPipeline',
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.gitHub('Sreerang15/my-pipeline-project', 'master', {
          authentication: cdk.SecretValue.plainText('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'),
          trigger: GitHubTrigger.NONE
        }),
        installCommands: ['npm install'],
        commands: ['npm run build', 'npx cdk synth'],
        logging:{
          cloudWatch :{
            logGroup : buildLogs
          }
        }
      }),
    });
  }
}
