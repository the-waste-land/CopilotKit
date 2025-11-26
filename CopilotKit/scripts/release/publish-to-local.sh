#!/usr/bin/env bash
set -e

# 发布到本地 Artifactory
echo "Publishing to local Artifactory..."
pnpm changeset publish --registry https://artifactory.gz.cvte.cn/artifactory/api/npm/npm-local

echo "Published successfully to local registry!" 