# biohacker.fun

biohacker.fun 的站点仓库。当前托管的是 **项目 001 · netadmin-toolbox** 的落地页。

## 站点构成

纯静态，无构建步骤、无依赖：

```
index.html            单页全部内容（内联 SVG，无外部图片依赖）
404.html              错误页（不依赖资源，单独成才）
assets/css/site.css   样式（变量 → 版式 → 版块 → 响应 → 降级）
assets/css/fonts.css  自托管字体声明（103 个 woff2 子集 + unicode-range 分段）
assets/js/site.js     交互（无框架，9 个模块，含 reduced-motion 降级）
assets/pay-wechat.png 收款码（全站唯一位图）
assets/og.png         分享预览图 1200×630（由 .ref/og.html 生成）
assets/favicon.svg    站点图标
CNAME                 自定义域名 biohacker.fun
```

## 本地预览

字体是自托管的，浏览器在 `file://` 下会用 CORS 拦掉 woff2，**直接双击 index.html 看到的是回退字体**。请用任意静态服务器：

```bash
python -m http.server 8765 --bind 127.0.0.1
# http://127.0.0.1:8765/index.html
```

## 部署

GitHub Pages，`main` 分支根目录，legacy 构建（无 Actions）。
推送到 `main` 即自动发布，通常 30–60 秒后生效。

> 本机若 `github.com` 被网络策略拦截，可用 `.ref/deploy_pages.py` 走 Git Data API 发布，
> 效果等价于一次整树替换。

## 内容维护

- 模块图谱、分组、筛选条由工具的 `--list` 输出生成，改工具后需同步
- 版本号、下载体积、徽章链接以 GitHub Releases 为准
- 页面不含第三方统计与外部请求
