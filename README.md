# Susahous Asset Upload

A brutalist-themed image upload platform built with Next.js, AWS S3, and Pulumi for infrastructure management.

## Features

- **Brutalist Design**: Bold, high-contrast UI with sharp edges and monospace fonts
- **Password Protection**: Simple password-based authentication (password: `8!6G#`)
- **Rate Limiting**: 300 images per day limit to prevent abuse
- **Batch Upload**: Upload up to 150 images at once
- **File Validation**: Image type and size validation (max 10MB per file)
- **Gallery View**: Browse and download uploaded images
- **AWS S3 Integration**: Secure cloud storage with signed URLs
- **Pulumi Infrastructure**: Infrastructure as code for AWS resources

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui with custom brutalist styling
- **Storage**: AWS S3
- **Infrastructure**: Pulumi
- **Authentication**: Basic HTTP authentication
- **Rate Limiting**: In-memory rate limiting (use Redis in production)

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set up AWS Credentials

Create a `.env.local` file in the root directory:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=susahaus-asset-upload

# Application Configuration
UPLOAD_PASSWORD=8!6G#
MAX_IMAGES_PER_DAY=300
MAX_IMAGES_PER_UPLOAD=150
MAX_FILE_SIZE_MB=10
```

### 3. Deploy Infrastructure with Pulumi

```bash
cd infrastructure
pnpm install
pulumi stack init dev
pulumi up
```

This will create:

- S3 bucket for image storage
- IAM user with appropriate permissions
- Bucket policies for secure access

After deployment, copy the output values to your `.env.local` file.

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Login**: Enter the password `8!6G#` to access the platform
2. **Upload**: Drag and drop or select up to 150 images (max 10MB each)
3. **Gallery**: View and download all uploaded images
4. **Rate Limits**: Maximum 300 images per day per IP address

## API Endpoints

- `POST /api/auth` - Authenticate with password
- `POST /api/upload` - Upload images (requires authentication)
- `GET /api/gallery` - Get list of uploaded images (requires authentication)

## Security Features

- Password protection for all upload operations
- Rate limiting to prevent abuse
- File type validation (images only)
- File size limits
- Secure S3 storage with private access
- Signed URLs for image access

## Production Considerations

- Replace in-memory rate limiting with Redis
- Use proper session management instead of basic auth
- Add HTTPS enforcement
- Implement proper logging and monitoring
- Add backup and disaster recovery
- Consider using AWS CloudFront for image delivery

## License

MIT License
# image-upload-platform
