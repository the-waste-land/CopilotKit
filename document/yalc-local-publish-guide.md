# Yalc 本地发布使用指南

Yalc 是一个用于本地开发和测试 npm 包的工具，它比 `npm link` 更可靠，能够模拟真实的包发布流程。

## 安装

```bash
# 全局安装
npm install -g yalc

# 或使用 yarn
yarn global add yalc

# 或使用 pnpm
pnpm add -g yalc
```

## 核心命令

### 1. 发布包到本地仓库

在你的包目录下执行：

```bash
# 发布到本地 yalc 仓库
yalc publish

# 发布并自动推送到所有依赖项目
yalc publish --push
```

### 2. 在项目中添加本地包

在需要使用该包的项目目录下：

```bash
# 添加本地包（会修改 package.json）
yalc add <package-name>

# 添加但使用 link 方式（不复制文件）
yalc add <package-name> --link

# 添加但不修改 package.json
yalc add <package-name> --pure
```

### 3. 更新本地包

当你修改了包的代码后：

```bash
# 在包目录下：重新发布并推送更新
yalc publish --push

# 或者在项目目录下：手动拉取更新
yalc update
yalc update <package-name>
```

### 4. 移除本地包

```bash
# 移除指定包
yalc remove <package-name>

# 移除所有 yalc 包
yalc remove --all
```

## 实际使用示例

假设你在开发一个 monorepo 项目，需要测试 `@copilotkit/react-ui` 包：

```bash
# 1. 进入包目录并构建
cd CopilotKit/packages/react-ui
pnpm build

# 2. 发布到本地 yalc 仓库
yalc publish

# 3. 在测试项目中添加
cd ../../../my-test-project
yalc add @copilotkit/react-ui

# 4. 安装依赖
pnpm install

# 5. 修改包代码后，更新
cd ../CopilotKit/packages/react-ui
pnpm build
yalc publish --push
```

## 常用选项

| 选项 | 说明 |
|------|------|
| `--push` | 发布后自动推送到所有依赖项目 |
| `--link` | 使用符号链接而非复制文件 |
| `--pure` | 不修改 package.json |
| `--no-scripts` | 跳过 npm 脚本 |
| `--changed` | 仅当文件有变化时才发布 |

## 文件存储位置

- macOS/Linux: `~/.yalc`
- Windows: `%USERPROFILE%\.yalc`

## 与 npm link 的区别

| 特性 | yalc | npm link |
|------|------|----------|
| 模拟真实发布 | ✅ | ❌ |
| 处理 peerDependencies | ✅ 更好 | ❌ 容易出问题 |
| 多版本支持 | ✅ | ❌ |
| 符号链接问题 | ✅ 无 | ❌ 常见 |

## 注意事项

1. 记得将 `.yalc` 和 `yalc.lock` 添加到 `.gitignore`
2. 发布前确保先执行构建命令
3. 使用 `--push` 可以省去手动 update 的步骤
4. 在 CI/CD 环境中不要使用 yalc 包

## 清理

```bash
# 在项目中移除所有 yalc 包并恢复原始依赖
yalc remove --all

# 重新安装依赖
pnpm install
```
