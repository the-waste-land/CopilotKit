#!/usr/bin/env bash
set -e

REGISTRY="https://artifactory.gz.cvte.cn/artifactory/api/npm/npm-local"

echo "Publishing packages to local registry: $REGISTRY"

# 确保先构建所有包
echo "Building all packages..."
pnpm build

# 发布所有包
echo "Publishing @copilotkit/react-core..."
cd packages/react-core
pnpm publish --registry $REGISTRY --no-git-checks
cd ../..

echo "Publishing @copilotkit/react-textarea..."
cd packages/react-textarea
pnpm publish --registry $REGISTRY --no-git-checks
cd ../..

echo "Publishing @copilotkit/react-ui..."
cd packages/react-ui
pnpm publish --registry $REGISTRY --no-git-checks
cd ../..

echo "Publishing @copilotkit/runtime..."
cd packages/runtime
pnpm publish --registry $REGISTRY --no-git-checks
cd ../..

echo "Publishing @copilotkit/runtime-client-gql..."
cd packages/runtime-client-gql
pnpm publish --registry $REGISTRY --no-git-checks
cd ../..

echo "Publishing @copilotkit/sdk-js..."
cd packages/sdk-js
pnpm publish --registry $REGISTRY --no-git-checks
cd ../..

echo "Publishing @copilotkit/shared..."
cd packages/shared
pnpm publish --registry $REGISTRY --no-git-checks
cd ../..

echo "All packages published successfully to local registry!" 