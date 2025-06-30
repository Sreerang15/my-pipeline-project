#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MyPipelineProjectStack } from '../lib/my-pipeline-project-stack';

const app = new cdk.App();
new MyPipelineProjectStack(app, 'MyPipelineProjectStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
