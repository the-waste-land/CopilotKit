# PNG 图片压缩与 JPG 大小控制方案

## 需求概述

1. **PNG 图片**：自动转换为 JPG 并压缩到 200KB 以下
2. **JPG 图片**：超过 250KB 时弹窗提示，用户确认后压缩到 250KB 以下，拒绝则阻止上传

## 实施步骤

### 1. 创建图片压缩工具模块

在 [`packages/react-ui/src/lib/image-compression.ts`](packages/react-ui/src/lib/image-compression.ts) 创建压缩工具函数：

- `compressImage()`: 核心压缩函数，使用 Canvas API
- `convertPngToJpg()`: PNG 转 JPG，自适应质量直到达到 200KB 以下
- `compressJpgIfNeeded()`: JPG 超过 250KB 时返回需要压缩的标记
- `getImageSizeInKB()`: 计算 base64 图片大小（KB）

技术细节：

- 使用 Canvas API 绘制图片并导出为压缩格式
+- 二分法自适应调整 JPEG 质量参数
+- 最多尝试 10 次迭代以避免无限循环

### 2. 创建用户确认弹窗组件

在 [`packages/react-ui/src/components/chat/ImageCompressionDialog.tsx`](packages/react-ui/src/components/chat/ImageCompressionDialog.tsx) 创建确认对话框：

- 显示文件名和当前大小
- 提供"压缩"和"取消"两个选项
- 简洁的样式，与现有 UI 保持一致

### 3. 修改文件上传处理逻辑

在 [`Chat.tsx`](packages/react-ui/src/components/chat/Chat.tsx) 的两个上传入口添加压缩处理：

**`handleFileUpload` 函数** (480-534 行)：

- 读取文件后，检查是否为图片
- PNG：调用 `convertPngToJpg()` 自动转换
- JPG：检查大小，超过 250KB 则显示确认弹窗
- 用户确认后调用压缩函数

**`handlePaste` 函数** (356-410 行)：

- 同样的逻辑应用到粘贴上传

### 4. 状态管理

添加状态来管理：

- 等待用户确认的图片队列
- 弹窗显示状态
- 当前待确认的图片信息

## 关键代码位置

- 图片压缩工具：新建 `packages/react-ui/src/lib/image-compression.ts`
- 确认弹窗组件：新建 `packages/react-ui/src/components/chat/ImageCompressionDialog.tsx`
- 上传逻辑修改：`packages/react-ui/src/components/chat/Chat.tsx` (两处)

## 注意事项

- 保持最小化变更原则，只修改文件上传处理部分
- 压缩过程在浏览器端完成，不影响后端
- 添加适当的错误处理和用户提示
- 保持现有代码风格和结构

