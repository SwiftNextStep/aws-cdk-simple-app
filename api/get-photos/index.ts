import {
  APIGatewayProxyEventV2,
  Context,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { Bucket } from '@aws-cdk/aws-s3';

const s3 = new S3();
const bucketName = process.env.PHOTO_BUCKET_NAME!;

async function generateUrl(
  object: S3.Object
): Promise<{ filename: string; url: string }> {
  const url = await s3.getSignedUrlPromise('getObject', {
    Bucket: bucketName,
    Key: object.Key!,
    Expires: 24 * 60 * 60,
  });
  return {
    filename: object.Key!,
    url,
  };
}

async function getPhotos(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> {
  console.log('I got the bucket name and it is ' + bucketName);
  try {
    const { Contents: results } = await s3
      .listObjects({ Bucket: bucketName })
      .promise();
    const photos = await Promise.all(
      results!.map((result) => generateUrl(result))
    );
    return {
      statusCode: 200,
      body: JSON.stringify(photos),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message,
    };
  }
}

export { getPhotos };
