# High-Speed Rail Defect System

高速铁路缺陷检测与可视化系统。项目整合了前端查询与可视化界面、后端数据服务、缺陷台账导出、2D/3D 分析结果展示等能力，适合作为完整 Web 项目的求职展示仓库。

![3D scatter result](docs/screenshots/visualization-3d-scatter.png)

## 项目亮点

- 前后端一体化工程结构，便于面试官快速查看完整系统实现。
- 支持线路、里程、时间、病害类型等条件查询，并展示检测结果与病害台账。
- 支持缺陷明细、历史记录、Excel 导出、2D/3D 可视化结果展示。
- 后端使用 Spring Boot、Spring Security、JWT、JPA、MySQL，前端使用 React、Vite、Axios、Bootstrap。
- 配置已改为环境变量方式，避免把数据库密码、脚本路径和密钥写死在代码中。

## 仓库结构

```text
High-Speed-Rail-Defect-System/
├─ backend/              # Spring Boot 后端服务
├─ frontend/             # React + Vite 前端应用
├─ docs/                 # 架构、接口与展示截图
├─ deploy/               # 本地依赖服务配置
└─ README.md             # 项目总览与启动入口
```

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React, Vite, Axios, React Router, i18next, Bootstrap |
| 后端 | Java 17, Spring Boot, Spring Security, Spring Data JPA, JWT |
| 数据库 | MySQL |
| 可视化 | Python 脚本生成 2D/3D 缺陷分析结果，前端展示与下载 |
| 导出 | Apache POI |

## 本地启动

### 1. 启动 MySQL

```bash
cd deploy
docker compose up -d
```

默认数据库为 `railline`，默认账号密码见 [deploy/docker-compose.yml](deploy/docker-compose.yml)。如果使用自己的数据库，请设置 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD`。

### 2. 启动后端

```bash
cd backend
./mvnw spring-boot:run
```

Windows 可以使用：

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

后端默认运行在 `http://localhost:8080`。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，默认请求 `http://localhost:8080/api`。

如需修改后端地址，在 `frontend/.env.local` 中配置：

```env
VITE_API_BASE=http://localhost:8080/api
```

## 核心功能

- 用户登录与 JWT 认证
- 线路、病害类型元数据查询
- 缺陷检测结果查询、筛选、排序和分页
- 病害台账查询、筛选、排序和分页
- 缺陷详情查看与历史记录展示
- 检测结果、台账和全部数据导出
- 2D 可视化生成、轮询/流式状态更新、结果展示
- 3D 散点图和幅值图生成、展示与下载

## 文档

- [系统架构](docs/architecture.md)
- [API 说明](docs/api.md)
- [后端说明](backend/README.md)
- [前端说明](frontend/README.md)

## 展示截图

| 3D 散点图 | 3D 幅值图 |
| --- | --- |
| ![3D scatter](docs/screenshots/visualization-3d-scatter.png) | ![3D amplitude](docs/screenshots/visualization-3d-amplitude.png) |

## 求职展示建议

建议在简历中只放这个主仓库链接：

```text
高速铁路缺陷检测与可视化系统：React + Spring Boot 前后端一体化项目
https://github.com/KFgituser/High-Speed-Rail-Defect-System
```

原前端、后端独立仓库可以保留，并在各自 README 顶部指向本仓库。
