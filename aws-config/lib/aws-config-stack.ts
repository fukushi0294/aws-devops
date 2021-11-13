import * as cdk from '@aws-cdk/core';
import * as config from '@aws-cdk/aws-config';

export class AwsConfigStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new config.ManagedRule(this, 'AccessKeysRotated', {
      identifier: config.ManagedRuleIdentifiers.ACCESS_KEYS_ROTATED,
      inputParameters: {
         maxAccessKeyAge: 60 // default is 90 days
      },
      maximumExecutionFrequency: config.MaximumExecutionFrequency.TWELVE_HOURS // default is 24 hours
    });
    new config.CloudFormationStackDriftDetectionCheck(this, 'Drift', {
      ownStackOnly: true, // checks only the stack containing the rule
    });
  }
}
