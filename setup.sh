#!/bin/bash

echo "🚀 Setting up Susahous Asset Upload Platform..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check if Pulumi is installed
if ! command -v pulumi &> /dev/null; then
    echo "❌ Pulumi is not installed. Please install Pulumi first:"
    echo "https://www.pulumi.com/docs/get-started/install/"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Install infrastructure dependencies
echo "🏗️ Installing infrastructure dependencies..."
cd infrastructure
pnpm install
cd ..

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
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
EOF
    echo "✅ Created .env.local file. Please update with your AWS credentials."
else
    echo "✅ .env.local already exists."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your AWS credentials"
echo "2. Deploy infrastructure: pnpm run deploy:infra"
echo "3. Start development server: pnpm dev"
echo ""
echo "Password for the platform: 8!6G#"
