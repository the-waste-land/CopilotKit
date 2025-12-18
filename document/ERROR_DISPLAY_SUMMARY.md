# CopilotKit 错误显示规则总结

## 错误显示矩阵

| 错误类型 | 错误代码 | Visibility | 开发环境 | 生产环境 | 说明 |
|---------|---------|-----------|---------|---------|------|
| **业务关键错误** | | | | | |
| 网络错误 | `NETWORK_ERROR` | `BANNER` | ✅ 显示 | ✅ 显示 | 网络连接失败、超时等 |
| 认证失败 | `AUTHENTICATION_ERROR` | `BANNER` | ✅ 显示 | ✅ 显示 | API key 错误、token 过期 |
| API 未找到 | `API_NOT_FOUND` | `BANNER` | ✅ 显示 | ✅ 显示 | CopilotKit API 端点不存在 |
| Agent 未找到 | `AGENT_NOT_FOUND` | `BANNER` | ✅ 显示 | ✅ 显示 | LangGraph agent 不存在 |
| 远程端点未找到 | `REMOTE_ENDPOINT_NOT_FOUND` | `BANNER` | ✅ 显示 | ✅ 显示 | 远程服务端点不可达 |
| 资源未找到 | `NOT_FOUND` | `BANNER` | ✅ 显示 | ✅ 显示 | 通用 404 错误 |
| 配置错误 | `CONFIGURATION_ERROR` | `BANNER` | ✅ 显示 | ✅ 显示 | 配置参数错误 |
| 缺少 API Key | `MISSING_PUBLIC_API_KEY_ERROR` | `BANNER` | ✅ 显示 | ✅ 显示 | 需要但未提供 API key |
| 需要升级 | `UPGRADE_REQUIRED_ERROR` | `BANNER` | ✅ 显示 | ✅ 显示 | 功能需要付费版本 |
| **一般错误** | | | | | |
| 未知错误 | `UNKNOWN` | `TOAST` | ✅ 显示 | ✅ 显示 | 未分类的错误 |
| **开发时错误** | | | | | |
| 版本不匹配 | `VERSION_MISMATCH` | `DEV_ONLY` | ✅ 显示 | ❌ 隐藏 | 前后端版本不一致 |
| API 误用 | `MISUSE` | `DEV_ONLY` | ✅ 显示 | ❌ 隐藏 | 开发者使用 API 不当 |
| **静默错误** | | | | | |
| 自定义静默 | (任意) | `SILENT` | ❌ 隐藏 | ❌ 隐藏 | 仅记录到控制台 |

## 错误处理路径

### 1. GraphQL 错误 (use-copilot-runtime-client.ts)
```typescript
handleGQLErrors: (error) => {
  // 检查 visibility
  if (visibility === ErrorVisibility.SILENT) return;
  if (visibility === ErrorVisibility.DEV_ONLY && !isDev) return;
  
  // BANNER 和 TOAST 在所有环境显示
  setBannerError(error);
}
```

### 2. GraphQL 警告 (use-copilot-runtime-client.ts)
```typescript
handleGQLWarning: (message) => {
  // 版本不匹配只在开发环境显示
  if (isVersionMismatch && !isDev) {
    console.warn("(hidden in production)");
    return;
  }
  
  // 其他警告在所有环境显示
  setBannerError(error);
}
```

### 3. Messages 错误 (copilot-messages.tsx)
```typescript
handleGraphQLErrors: (error) => {
  // 检查 visibility
  if (visibility === ErrorVisibility.SILENT) return;
  if (visibility === ErrorVisibility.DEV_ONLY && !isDev) return;
  
  // BANNER 和 TOAST 在所有环境显示
  setBannerError(error);
}
```

### 4. Stream 读取错误 (use-chat.ts)
```typescript
catch (readError) {
  // 总是显示 (NETWORK_ERROR)
  setBannerError(new CopilotKitError({
    code: CopilotKitErrorCode.NETWORK_ERROR,
  }));
}
```

### 5. Agent 状态错误 (use-chat.ts)
```typescript
if (status.reason === "UNKNOWN_ERROR") {
  // 从响应中提取错误代码和 visibility
  // 根据 visibility 决定是否显示
  setBannerError(structuredError);
}
```

## 控制开发模式

### 启用开发模式（显示 DEV_ONLY 错误）
```tsx
<CopilotKit showDevConsole={true}>
  {children}
</CopilotKit>
```

### 生产模式（隐藏 DEV_ONLY 错误）
```tsx
<CopilotKit showDevConsole={false}>  // 或不设置
  {children}
</CopilotKit>
```

## 常见场景

### 场景 1: 用户 API Key 错误
- **错误**: `AUTHENTICATION_ERROR`
- **Visibility**: `BANNER`
- **开发环境**: ✅ 显示红色横幅
- **生产环境**: ✅ 显示红色横幅
- **用户体验**: 用户看到明确的错误提示

### 场景 2: 开发者忘记更新包版本
- **错误**: `VERSION_MISMATCH`
- **Visibility**: `DEV_ONLY`
- **开发环境**: ✅ 显示横幅提醒更新
- **生产环境**: ❌ 不显示，仅控制台警告
- **用户体验**: 最终用户不会看到技术细节

### 场景 3: 网络连接失败
- **错误**: `NETWORK_ERROR`
- **Visibility**: `BANNER`
- **开发环境**: ✅ 显示红色横幅
- **生产环境**: ✅ 显示红色横幅
- **用户体验**: 用户知道需要检查网络

### 场景 4: Agent 配置错误
- **错误**: `AGENT_NOT_FOUND`
- **Visibility**: `BANNER`
- **开发环境**: ✅ 显示横幅，列出可用 agents
- **生产环境**: ✅ 显示横幅，列出可用 agents
- **用户体验**: 清楚知道哪些 agent 可用

## 修复历史

### 修复 1: ToastProvider 启用控制
- **问题**: `ToastProvider` 的 `enabled` 被 `showDevConsole` 控制
- **影响**: 生产环境所有错误都不显示
- **修复**: `ToastProvider` 始终启用，只在错误处理时检查 visibility

### 修复 2: copilot-messages.tsx 错误过滤
- **问题**: 生产环境所有 GraphQL 错误都被隐藏
- **影响**: 业务关键错误不显示给用户
- **修复**: 只隐藏 `DEV_ONLY` 错误，`BANNER` 和 `TOAST` 错误正常显示

### 修复 3: 版本不匹配警告
- **问题**: 版本不匹配在生产环境也显示
- **影响**: 用户看到技术细节
- **修复**: 版本不匹配只在开发环境显示

## 测试清单

- [ ] 生产环境 (`showDevConsole={false}`)
  - [ ] 认证错误显示 ✅
  - [ ] 网络错误显示 ✅
  - [ ] Agent 未找到显示 ✅
  - [ ] 版本不匹配不显示 ✅
  
- [ ] 开发环境 (`showDevConsole={true}`)
  - [ ] 认证错误显示 ✅
  - [ ] 网络错误显示 ✅
  - [ ] Agent 未找到显示 ✅
  - [ ] 版本不匹配显示 ✅
  - [ ] API 误用显示 ✅

## 添加新错误类型

### 1. 定义错误代码
```typescript
// errors.ts
export enum CopilotKitErrorCode {
  MY_NEW_ERROR = "MY_NEW_ERROR",
}
```

### 2. 配置错误
```typescript
// errors.ts
export const ERROR_CONFIG = {
  [CopilotKitErrorCode.MY_NEW_ERROR]: {
    statusCode: 400,
    visibility: ErrorVisibility.BANNER,  // 选择合适的 visibility
    severity: Severity.WARNING,
  },
};
```

### 3. 使用错误
```typescript
throw new CopilotKitError({
  message: "My custom error message",
  code: CopilotKitErrorCode.MY_NEW_ERROR,
});
```

## 最佳实践

1. **业务逻辑错误**: 使用 `BANNER` 或 `TOAST`，让用户知道发生了什么
2. **开发配置问题**: 使用 `DEV_ONLY`，不要打扰最终用户
3. **内部调试信息**: 使用 `SILENT`，只记录到控制台
4. **错误消息**: 写清楚、用户友好的错误消息，避免技术术语
5. **提供帮助**: 在错误消息中包含解决方案或文档链接
