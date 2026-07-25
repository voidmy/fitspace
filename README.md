# FitSpace 健身系统

根据《健身系统需求说明》实现，包含微信原生小程序、Node.js API 服务和运营管理后台。当前使用 JSON 文件持久化，面向健身工作室和无人共享健身馆的演示与二次开发。

## 启动 Node 服务

要求 Node.js 18 或更高版本。服务端仅使用 Node 内置模块，无需安装第三方依赖。

```bash
cd /Users/lizhongquan/Desktop/miniWeb
npm start
```

启动后：

- 管理后台：`http://127.0.0.1:3100/admin/`
- API 健康检查：`http://127.0.0.1:3100/api/health`
- 本地默认管理员密码：`fitspace123`

开发时可使用热重启：

```bash
npm run dev
```

建议通过环境变量修改密码和端口：

```bash
ADMIN_PASSWORD='你的强密码' PORT=3100 npm start
```

## 运营管理后台

后台支持：

- 经营仪表盘、订单/预约/签到/核销汇总
- 小程序会员状态快照
- 广告轮播、门店、会员卡、训练项目管理
- 教练、器械、团课排期、能量商品管理
- 所有配置新增、编辑、删除
- 保存后写入 JSON，小程序重新进入页面后自动刷新

数据文件：

```text
server/data/catalog.json  小程序运营配置
server/data/clients.json  小程序会员与业务状态
```

JSON 写入采用临时文件替换，避免写入中断时产生半个 JSON 文件。

## 在微信开发者工具中运行

1. 打开微信开发者工具，选择「导入项目」。
2. 项目目录选择 `/Users/lizhongquan/Desktop/miniWeb`。
3. 确认 `project.config.json` 中的 `appid` 是你的小程序 AppID。
4. 导入后点击「编译」即可。

开发者工具模拟器默认连接：

```text
http://127.0.0.1:3100
```

可在小程序「我的 → 右上角设置」中修改并测试服务器地址。

真机调试时，`127.0.0.1` 指向手机自身，需要改为电脑的局域网 IP，例如当前网络下：

```text
http://172.16.10.5:3100
```

手机与电脑需连接同一网络。正式发布必须使用 HTTPS，并在微信公众平台配置合法 request 域名。

## 已实现

- 首页广告轮播、门店切换、训练项目和门店联系方式
- 门店器械、地图导航、客服微信/电话
- 新客参观票和 15 分钟自动退款规则演示
- 团购券码核销（演示有效码：`FIT2026`）
- 会员卡商品、模拟购买、本地订单
- 教练列表、客户成果、学员推荐、关注和私教预约
- 场内人数、分区实况与舒适度动态演示
- 我的会员卡、进场预约、课程预约、订单、训练记录
- 人脸录入、动态门禁密码、WiFi、签到和能量商城
- 后台配置自动拉取，服务器离线时回退到微信本地缓存
- 订单、预约、签到、参观票、核销和会员状态自动同步到 JSON 服务

## 服务端 API

公开接口：

```text
GET  /api/health
GET  /api/public/bootstrap
POST /api/public/client-state
```

后台接口：

```text
POST /api/admin/login
GET  /api/admin/dashboard
GET  /api/admin/clients
GET  /api/admin/config/:resource
PUT  /api/admin/config/:resource
GET  /api/admin/export
```

后台接口需要登录得到的 Bearer Token。

## 正式上线前需要接入

当前 Node + JSON 版本适合本地演示和早期验证。正式上线前建议完成：

- 将 JSON 存储替换为 MySQL、PostgreSQL 等数据库
- 微信登录、手机号绑定、服务端用户身份校验
- 微信支付、退款回调与退款状态通知
- 门禁设备、人脸识别服务与进出场记录
- 参观票 15 分钟规则引擎和自动退款任务
- 美团、抖音、大众点评真实核销接口
- 合规的视频监控直播流、权限控制和画面脱敏
- 微信客服、消息订阅、课程库存和预约并发控制
- 为公开写接口增加登录凭证、签名、限流和操作审计

## 主要目录

```text
pages/home/          首页
pages/mine/          我的
pages/cards/         会员卡售卖
pages/coach-detail/  教练成果与推荐
pages/live/          场内实况
pages/feature/       预约、门禁、人脸、WiFi、能量等功能
utils/api.js         小程序 API 客户端
utils/catalog.js     远程配置与本地兜底
utils/state.js       本地状态与服务器同步
server/index.js      Node API 服务入口
server/data/         JSON 数据
server/public/admin/ 运营管理后台
server/tests/        服务端自动化测试
```

## 验证

```bash
npm test
```
