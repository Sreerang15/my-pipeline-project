import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CodePipeline,
  CodePipelineSource,
  CodeBuildStep,
} from 'aws-cdk-lib/pipelines';
import * as cdk from 'aws-cdk-lib';

export class MyPipelineProjectStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyNewPipeline',
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.gitHub('Sreerang15/my-pipeline-project', 'master', {
          authentication: cdk.SecretValue.unsafePlainText('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'), // OR use cdk.SecretValue.plainText(process.env.GITHUB_TOKEN!)
        }),
        installCommands: ['npm install'],
        commands: ['npm run build', 'npx cdk synth'],
      }),
    });
  }
}
