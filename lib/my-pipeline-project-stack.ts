import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class LogCleanupStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const logCleanerFunction = new lambda.Function(this, 'LogCleanerLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const logs = new AWS.CloudWatchLogs();

        exports.handler = async () => {
          let nextToken;
          do {
            const response = await logs.describeLogGroups({ nextToken }).promise();
            const groupsToDelete = response.logGroups
              .filter(group => group.logGroupName.startsWith('abc-'));

            for (const group of groupsToDelete) {
              console.log('Deleting', group.logGroupName);
              await logs.deleteLogGroup({ logGroupName: group.logGroupName }).promise();
            }

            nextToken = response.nextToken;
          } while (nextToken);
        };
      `),
      timeout: cdk.Duration.minutes(1),
    });

    // IAM permissions
    logCleanerFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'logs:DescribeLogGroups',
        'logs:DeleteLogGroup',
      ],
      resources: ['*'], // You can scope this better if needed
    }));
  }
}
