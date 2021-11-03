import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudtrail from '@aws-cdk/aws-cloudtrail';

export class CfTemplatePipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new s3.Bucket(this, 'cf-template-pipeline-source-bucket', {
      bucketName: 'cf-template-pipeline-source-bucket',
      versioned: true
    });
  
    const pipeline = new codepipeline.Pipeline(this, 'CfTemplatePipeline', {
      pipelineName: 'CfTemplatePipeline',
    });

    const sourceOutput = new codepipeline.Artifact('SourceArtifact');

    const trail = new cloudtrail.Trail(this, 'CloudTrail', {
      trailName: 'cf-template-s3-listener'
    });
    trail.addS3EventSelector([{
      bucket: sourceBucket,
      objectPrefix: 'stacks.zip',
    }], {
      readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [new codepipeline_actions.S3SourceAction({
        actionName: 'S3Source',
        bucket: sourceBucket,
        bucketKey: 'stacks.zip',
        output: sourceOutput,
        trigger: codepipeline_actions.S3Trigger.EVENTS
      })]
    });
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction({
          actionName: 'PrepareChanges',
          stackName: 'OurStack',
          changeSetName: 'StagedChangeSet',
          adminPermissions: true,
          templatePath: sourceOutput.atPath('template.yaml'),
          runOrder: 1,
        }),
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'ApproveChanges',
          runOrder: 2,
        }),
        new codepipeline_actions.CloudFormationExecuteChangeSetAction({
          actionName: 'ExecuteChanges',
          stackName: 'OurStack',
          changeSetName: 'StagedChangeSet',
          runOrder: 3,
        }),
      ],
    });
    
  }
}
