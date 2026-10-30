<div align="center">

# ⭐ 星棋 (StarChess)

**一个现代化、精美且趣味十足的网页端国际象棋对战与智能AI辅助小程序**  
*仿多邻国 (Duolingo) 风格的扁平化鲜明 UI 交互，支持单机人机对战、Firebase 实时联机对局、多模型 AI 实时毒舌解说与对局复盘。*

[English](#-english-introduction) | [特性](#-核心功能特性) | [技术栈](#-技术栈) | [快速开始](#-快速开始)

</div>

---

## 📖 项目简介

**星棋** 是一款基于 Web 技术栈构建的趣味国际象棋对战应用。项目旨在打破传统国际象棋软件严肃、沉闷的界面风格，引入了类似 Duolingo（多邻国）的生动鲜明配色、卡片化圆角控件以及SVG自绘卡通棋子。

除了基础的本地/联机对弈功能外，项目深度接入了 **Stockfish 10** 引擎用于局面推演与难度分级，并创新性地接入了各大主流大模型 API（如 **DeepSeek**、**OpenAI GPT**、**Kimi/Moonshot**），让 AI 不仅能陪你对弈，还能根据你的每一步操作进行实时的个性化“毒舌”点评或战术辅导。

---

## ✨ 核心功能特性

### 1. 🤖 智能 AI 对局 (Lv.1 - Lv.20)
- 内置 **Stockfish 国际象棋引擎**（通过 Web Worker 在浏览器端异步运行）。
- 支持 20 级难度动态调节。当你战胜 AI 时自动晋升难度，战胜失败则会降低难度，极具成长感与挑战性。
- 支持自定义执棋颜色（执白、执黑或随机分配）。

### 2. 🌐 零后端 Firebase 实时联机对决
- 利用 **Firebase Realtime Database** 实现无服务器架构的 P2P 房主-客态联机对战。
- **一键邀请**：房主创建房间后可直接复制专属对战链接发送给好友。
- **实时同步**：棋盘走法与联机状态秒级同步。
- **集成聊天室**：联机对局界面底部嵌入消息滚动记录区，支持快捷短语和自定义文字发言，让对战更有互动乐趣。

### 3. 🔥 多模型 AI 实时互动与教练指导
- **AI 实时毒舌/自定义评价**：在 AI 对局中，开启实时 AI 模式后，大模型会根据 Stockfish 的评分波动和你的落子轨迹，以你设定的独特风格（如高傲、傲娇、毒舌等）对你的每一步棋进行即时吐槽。
- **AI 棋局复盘教练**：在对局或复盘时，随时呼出 AI 教练，结合当前棋盘的 FEN 串和最后一步走法，向教练提问获取专业战术指导。

### 4. 🎨 丰富的个性化主题
- 提供 7 种多邻国风格的高颜值主题配色一键切换：
  - 🌙 **暗夜黑**
  - 🌸 **樱花粉**
  - 🌊 **琉璃蓝**
  - 🟢 **经典绿** (默认)
  - 🍋 **柠檬黄**
  - 🍎 **烈焰红**
  - 🟣 **星云紫**

### 5. 📱 极致的响应式与移动端适配
- 完美适配各尺寸手机屏幕与平板。采用现代 `dvh`（动态视口高度）与比例约束，确保无论竖屏还是横屏，棋盘、评分栏、控制按钮均不会出现溢出或被浏览器地址栏遮挡。
- **纯点击悬浮交互**：针对移动端优化，摒弃了传统网页端难以精准拖拽的痛点，采用“点击选中棋子 -> 预览合法落点（红点/吃子红圈） -> 点击目标格移动”的丝滑点触逻辑。

### 6. 🔄 局后复盘与悔棋机制
- 支持单机模式下的**悔棋**功能。
- 本地自动缓存历史棋局步数（FEN 历史记录），支持在主页随时点击“**复盘上局**”通过前后导航按钮回顾整盘棋的精彩对决。

---

## 🛠 技术栈

项目为纯前端静态单页应用（SPA），无需搭建复杂后端服务器：

- **核心架构**：原生 HTML5、CSS3、JavaScript (ES6+)
- **棋盘与规则**：
  - [Chessboard.js](https://chessboardjs.com/)（棋盘UI渲染与坐标管理）
  - [Chess.js](https://github.com/jhlywa/chess.js)（国际象棋规则校验、走法生成、胜负判定）
- **AI 引擎**：[Stockfish.js](https://github.com/nmrugg/stockfish.js) (Web Worker 运行)
- **联机后端**：[Firebase Realtime Database](https://firebase.google.com/) (v8)
- **样式与排版**：纯手写 CSS（支持 CSS 变量主题切换、Flexbox 弹性布局、Keyframes 动画）
- **大模型支持**：DeepSeek API / OpenAI API / Moonshot (Kimi) API

---

## 🚀 快速开始

由于本项目是纯前端应用，你甚至不需要安装 Node.js 环境即可运行。

### 方法一：本地直接运行
1. 克隆或下载本项目到本地：
   ```bash
   git clone https://github.com/XUNJIANMAX/StarChess.git
   ```
2. 在本地双击打开 `index.html`，或者使用任意静态服务器（如 VS Code 的 **Live Server** 插件）打开即可体验。

### 方法二：部署上线
你可以将项目托管至任意静态网页托管服务（如 **GitHub Pages**、**Vercel**、**Netlify** 或 **Cloudflare Pages**）：
1. 将所有文件 (`index.html`, `style.css`, `app.js`) 上传至你的代码仓库。
2. 在托管平台开启静态托管，根目录直接指向 `index.html` 即可完成全球发布。

---

## ⚙️ 配置说明

### Firebase 配置
项目默认已内置了一组测试用的 Firebase 配置项。如果你需要搭建属于你自己的联机数据库通道，可以在 `app.js` 顶部修改 `firebaseConfig` 对象：
```javascript
const firebaseConfig = {
    apiKey: "你的ApiKey",
    authDomain: "你的AuthDomain",
    databaseURL: "你的DatabaseURL",
    projectId: "你的ProjectId",
    storageBucket: "你的StorageBucket",
    messagingSenderId: "你的SenderId",
    appId: "你的AppId"
};
```

### AI 密钥配置
在应用内点击 **设置 -> AI 对话风格设置** 或在对局中的 **AI 询问** 面板里，你可以输入你自己的 **DeepSeek / OpenAI / Kimi API Key**。密钥仅保存在你浏览器的 `localStorage` 中，绝对安全，不会上传至任何第三方服务器。

---

## 💡 界面预览与交互说明

- **修改昵称**：点击主页左上角的星棋手名称即可弹出修改框。
- **走棋提示**：选中己方棋子后，棋盘上会出现绿色圆点（可行走位置）或红色高亮圆圈（可吃子目标）。

---

## 👨‍💻 开发者

由 **XUN** 独立开发与维护。

- GitHub: [@XUNJIANMAX](https://github.com/XUNJIANMAX)

---

## 📝 License

本项目基于 [MIT License](LICENSE) 开源协议进行分发与使用。
