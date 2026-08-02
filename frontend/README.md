# Frontend

React + Vite 前端应用，提供登录、缺陷查询、病害台账、详情查看、数据导出和 2D/3D 可视化展示页面。

## 环境要求

- Node.js 18+
- npm

## 启动

```bash
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

## 配置后端地址

本地开发默认请求：

```text
http://localhost:8080/api
```

如需修改，创建 `frontend/.env.local`：

```env
VITE_API_BASE=http://localhost:8080/api
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |

## 页面模块

- `/`: 登录页
- `/query`: 缺陷查询与台账页面
- `/visualization/2d`: 2D 可视化结果页面
- `/visualization/3d`: 3D 可视化结果页面
