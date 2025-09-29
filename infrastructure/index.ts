import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Reference existing S3 bucket
const bucket = aws.s3.Bucket.get(
  "asset-upload-platform-sunny",
  "asset-upload-platform-sunny"
);

// Configure bucket to block public access by default
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "susahaus-asset-upload-pab",
  {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// Create a bucket policy that allows uploads from the application
const bucketPolicy = new aws.s3.BucketPolicy(
  "susahaus-asset-upload-policy",
  {
    bucket: bucket.id,
    policy: bucket.arn.apply((bucketArn) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowUploads",
            Effect: "Allow",
            Principal: {
              AWS: "*", // In production, you'd want to restrict this to specific IAM roles
            },
            Action: ["s3:PutObject"],
            Resource: `${bucketArn}/*`,
          },
          {
            Sid: "AllowReads",
            Effect: "Allow",
            Principal: {
              AWS: "*",
            },
            Action: ["s3:GetObject"],
            Resource: `${bucketArn}/*`,
          },
        ],
      })
    ),
  },
  { dependsOn: bucketPublicAccessBlock }
);

// Add CORS configuration for browser uploads (non-deprecated resource)
const bucketCors = new aws.s3.BucketCorsConfiguration(
  "susahaus-asset-upload-cors",
  {
    bucket: bucket.id,
    corsRules: [
      {
        allowedMethods: ["PUT", "GET", "HEAD"],
        allowedOrigins: [
          "https://image-upload-platform.vercel.app",
          "http://localhost:3000",
        ],
        allowedHeaders: ["*"],
        exposeHeaders: ["ETag"],
        maxAgeSeconds: 3000,
      },
    ],
  }
);

// Export the bucket information
export const bucketName = bucket.id;
export const bucketArn = bucket.arn;
