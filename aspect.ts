import { Stack, StackProps, Aspects, IAspect } from "aws-cdk-lib";
import { Construct, IConstruct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import { Project } from "aws-cdk-lib/aws-codebuild";

export class CodeBuildLogRetentionAspect implements IAspect {
  private readonly retention: logs.RetentionDays;

  constructor(retention: logs.RetentionDays) {
    this.retention = retention;
  }

  visit(node: IConstruct): void {
    if (node instanceof Project) {
      console.log(node.projectName, "lklklklk");

      new logs.LogRetention(node, `LogRetention-${node.node.addr}`, {
        logGroupName: `/aws/codebuild/${node.projectName}`,
        retention: this.retention,
      });
    }
  }
}
