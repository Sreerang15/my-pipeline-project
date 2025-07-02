#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MyPipelineProjectStacknew } from '../lib/my-pipeline-project-stack';

const app = new cdk.App();
new MyPipelineProjectStacknew(app, 'MyPipelineProjectStack1', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
