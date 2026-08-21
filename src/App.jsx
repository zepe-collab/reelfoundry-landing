import { useEffect, useMemo, useState } from "react";
import {
  AppleLogo,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CaretDown,
  ChatCircleDots,
  CheckCircle,
  Circle,
  DownloadSimple,
  FilmSlate,
  ImageSquare,
  List,
  Monitor,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Sparkle,
  SquaresFour,
  User,
  WindowsLogo,
  X,
} from "@phosphor-icons/react";

const directions = [
  {
    title: "治愈日常",
    copy: "把旅行里的安静片刻，剪成一段温柔的日记。",
    image: "/assets/reelfoundry/final-video.png",
  },
  {
    title: "公路记忆",
    copy: "跟着路途向前，让沿途风景成为故事的节奏。",
    image: "/assets/reelfoundry/hero-travel.png",
  },
  {
    title: "城市漫游",
    copy: "把街巷、灯光和偶遇，写成一封给城市的信。",
    image: "/assets/reelfoundry/final-video.png",
  },
];

const questions = [
  {
    question: "需要付费才能使用 ReelFoundry 吗？",
    answer:
      "不需要。ReelFoundry 启动器免费下载，Windows 与 macOS 均可使用。",
  },
  {
    question: "模型调用如何计费？",
    answer:
      "当你调用 AI 模型时，由所选模型服务商按照其公布的 API 计费规则结算。费用会因模型、画面数量和视频时长而不同。",
  },
  {
    question: "我的素材会保存在哪里？",
    answer:
      "项目与素材由本地启动器管理。调用模型时，完成任务所需的内容会发送给你选择的模型服务商，请同时阅读相应服务商的隐私说明。",
  },
  {
    question: "可以使用不同的模型吗？",
    answer:
      "可以。ReelFoundry 计划支持多种主流模型，让你根据效果、速度和成本自由选择。",
  },
];

function usePlatform() {
  return useMemo(() => {
    if (typeof navigator === "undefined") return "Windows";
    const platform = `${navigator.platform} ${navigator.userAgent}`.toLowerCase();
    return platform.includes("mac") ? "macOS" : "Windows";
  }, []);
}

function DownloadButton({ platform, primary = false, onDownload }) {
  const Icon = platform === "macOS" ? AppleLogo : WindowsLogo;
  return (
    <button
      className={primary ? "button button-primary" : "button button-secondary"}
      onClick={() => onDownload(platform)}
      type="button"
    >
      <Icon size={20} weight="fill" aria-hidden="true" />
      下载 {platform} 版
    </button>
  );
}

export function App() {
  const detectedPlatform = usePlatform();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(detectedPlatform);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [videoActive, setVideoActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.16 },
    );

    const elements = document.querySelectorAll("[data-reveal]");
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const handleDownload = (platform) => {
    setSelectedPlatform(platform);
    setDownloadMessage(
      `已为你选择 ${platform} 版本。当前是界面原型，正式安装包上线后会从这里开始下载。`,
    );
    document.querySelector("#download")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="ReelFoundry 首页">
          ReelFoundry
        </a>

        <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="主导航">
          <a href="#products" onClick={() => setMenuOpen(false)}>
            产品
          </a>
          <a href="#process" onClick={() => setMenuOpen(false)}>
            创作过程
          </a>
          <a href="#cost" onClick={() => setMenuOpen(false)}>
            费用说明
          </a>
          <a href="#download" onClick={() => setMenuOpen(false)}>
            下载
          </a>
        </nav>

        <button
          className="nav-download"
          type="button"
          onClick={() => handleDownload(detectedPlatform)}
        >
          免费下载
        </button>

        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={22} /> : <List size={22} />}
        </button>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">本地运行的 AI 视频创意搭档</p>
            <h1>把你的照片和想法，变成一段值得分享的视频。</h1>
            <p className="hero-intro">
              和 ReelFoundry 聊聊你的想法，它会帮你完善创意、设计故事与镜头，并一步步生成视频。
            </p>

            <div className="hero-actions">
              <DownloadButton
                platform={detectedPlatform}
                primary
                onDownload={handleDownload}
              />
              <a className="button button-ghost" href="#process">
                <Play size={18} weight="fill" aria-hidden="true" />
                观看创作过程
              </a>
            </div>

            <p className="platform-note">
              <WindowsLogo size={17} weight="fill" aria-hidden="true" />
              Windows
              <AppleLogo size={17} weight="fill" aria-hidden="true" />
              macOS
              <span>启动器免费</span>
            </p>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <img
              src="/assets/reelfoundry/hero-travel.png"
              alt=""
              fetchPriority="high"
            />
          </div>

          <a className="scroll-cue" href="#process" aria-label="向下查看创作过程">
            向下探索
            <ArrowDown size={18} />
          </a>
        </section>

        <section className="conversation-section" id="process">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Conversation to creation</p>
            <h2>从一次对话开始，创意自然展开。</h2>
          </div>

          <div className="conversation-flow">
            <div className="message message-user" data-reveal>
              <span>我想把这次旅行做成一段温暖的短片。</span>
              <div className="avatar avatar-user" aria-hidden="true">
                <User size={20} weight="fill" />
              </div>
            </div>

            <div className="message message-ai" data-reveal>
              <div className="avatar avatar-ai" aria-hidden="true">
                <Sparkle size={22} weight="fill" />
              </div>
              <div>
                <strong>太好了，我们先一起找到方向。</strong>
                <p>你希望视频更像治愈日记、公路电影，还是城市漫游？</p>
              </div>
            </div>

            <div className="direction-block" data-reveal>
              <p className="step-label">AI 提出 3 个创作方向</p>
              <div className="direction-grid">
                {directions.map((direction, index) => (
                  <article className="direction-card" key={direction.title}>
                    <div className={`direction-image direction-image-${index + 1}`}>
                      <img src={direction.image} alt={`${direction.title}风格预览`} />
                      <span className="mini-play" aria-hidden="true">
                        <Play size={14} weight="fill" />
                      </span>
                    </div>
                    <h3>{direction.title}</h3>
                    <p>{direction.copy}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="message message-user message-user-short" data-reveal>
              <span>我更喜欢治愈日常，节奏慢一点，温暖一些。</span>
              <div className="avatar avatar-user" aria-hidden="true">
                <User size={20} weight="fill" />
              </div>
            </div>

            <div className="message message-ai message-ai-small" data-reveal>
              <div className="avatar avatar-ai" aria-hidden="true">
                <Sparkle size={22} weight="fill" />
              </div>
              <div>
                <strong>明白了。我为你整理成一个分镜故事。</strong>
              </div>
            </div>

            <div className="storyboard" data-reveal>
              <div className="step-label-row">
                <p className="step-label">AI 生成分镜脚本</p>
                <span>5 个镜头 · 温暖旅行日记</span>
              </div>
              <img
                src="/assets/reelfoundry/storyboard-strip.png"
                alt="由五个旅行镜头组成的铅笔分镜草图"
              />
              <ol>
                <li>
                  <strong>01 清晨醒来</strong>
                  <span>窗外的光落进房间</span>
                </li>
                <li>
                  <strong>02 走进旅途</strong>
                  <span>沿着海边慢慢向前</span>
                </li>
                <li>
                  <strong>03 偶遇片刻</strong>
                  <span>一个微笑被镜头留下</span>
                </li>
                <li>
                  <strong>04 黄昏日落</strong>
                  <span>海面染成温暖的金色</span>
                </li>
                <li>
                  <strong>05 回望旅程</strong>
                  <span>故事停在最好的瞬间</span>
                </li>
              </ol>
            </div>

            <div className="message message-ai message-ai-small" data-reveal>
              <div className="avatar avatar-ai" aria-hidden="true">
                <Sparkle size={22} weight="fill" />
              </div>
              <div>
                <strong>分镜已经准备好，现在生成一段预览片吧。</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={videoActive ? "video-section video-active" : "video-section"}>
          <img
            src="/assets/reelfoundry/final-video.png"
            alt="旅行者在暖色夕阳海岸边的成片画面"
          />
          <div className="video-overlay">
            <p>从灵感，到成片。</p>
            <h2>每一个想法，都值得被看见。</h2>
            <button
              type="button"
              className="video-play"
              aria-label={videoActive ? "暂停预览" : "播放预览"}
              aria-pressed={videoActive}
              onClick={() => setVideoActive((value) => !value)}
            >
              {videoActive ? <Pause size={32} weight="fill" /> : <Play size={32} weight="fill" />}
            </button>
            <span className="video-status">
              {videoActive ? "正在播放创作预览" : "18 秒创作预览"}
            </span>
          </div>
        </section>

        <section className="local-section" id="local">
          <div className="local-copy" data-reveal>
            <p className="eyebrow">Local creative workspace</p>
            <h2>本地运行，创作由你掌控。</h2>
            <ul className="feature-list">
              <li>
                <CheckCircle size={22} weight="fill" />
                项目与素材由本地启动器统一管理。
              </li>
              <li>
                <CheckCircle size={22} weight="fill" />
                自由选择模型，按照效果与成本切换。
              </li>
              <li>
                <CheckCircle size={22} weight="fill" />
                对话、分镜和成片保留在同一个创作空间。
              </li>
            </ul>
            <a className="text-link" href="#cost">
              了解费用与数据说明 <ArrowRight size={18} />
            </a>
          </div>

          <div className="launcher" data-reveal aria-label="ReelFoundry 启动器界面预览">
            <div className="launcher-topbar">
              <div className="window-dots" aria-hidden="true">
                <Circle size={9} weight="fill" />
                <Circle size={9} weight="fill" />
                <Circle size={9} weight="fill" />
              </div>
              <span>ReelFoundry</span>
              <span className="launcher-more">•••</span>
            </div>
            <div className="launcher-body">
              <aside className="launcher-sidebar">
                <strong>ReelFoundry</strong>
                <button className="launcher-nav active" type="button">
                  <Sparkle size={16} weight="fill" /> 新建项目
                </button>
                <button className="launcher-nav" type="button">
                  <SquaresFour size={16} /> 项目
                </button>
                <button className="launcher-nav" type="button">
                  <ImageSquare size={16} /> 素材库
                </button>
                <button className="launcher-nav" type="button">
                  <ChatCircleDots size={16} /> 对话
                </button>
              </aside>

              <div className="launcher-main">
                <p className="launcher-greeting">下午好，准备好继续创作了吗？</p>
                <div className="launcher-prompt">告诉我你的想法…</div>
                <div className="launcher-chips">
                  <span>旅行照片</span>
                  <span>家庭时光</span>
                  <span>产品故事</span>
                  <span>节日回忆</span>
                </div>
                <p className="recent-label">最近项目</p>
                <div className="recent-grid">
                  <div>
                    <img src="/assets/reelfoundry/final-video.png" alt="海边旅行项目" />
                    <strong>温柔海岸</strong>
                  </div>
                  <div>
                    <img src="/assets/reelfoundry/hero-travel.png" alt="山间旅行项目" />
                    <strong>山间日记</strong>
                  </div>
                  <div>
                    <img src="/assets/reelfoundry/final-video.png" alt="城市故事项目" />
                    <strong>城市漫游</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cost-section" id="cost">
          <div className="cost-copy" data-reveal>
            <p className="eyebrow">Simple and transparent</p>
            <h2>启动器免费。<br />模型费用，清楚透明。</h2>
            <p>
              ReelFoundry 不收取启动器订阅费。只有在调用你选择的 AI 模型时，才会产生相应的 API 使用费用。
            </p>
            <p className="cost-note">
              实际费用由模型服务商按其公开规则结算，并会因模型、画面数量与视频时长而不同。
            </p>
          </div>

          <div className="faq-list" data-reveal>
            {questions.map((item, index) => (
              <details key={item.question} open={index === 0}>
                <summary>
                  <span className="faq-icon" aria-hidden="true">
                    {index === 0 ? (
                      <DownloadSimple size={19} />
                    ) : index === 1 ? (
                      <FilmSlate size={19} />
                    ) : index === 2 ? (
                      <ShieldCheck size={19} />
                    ) : (
                      <Monitor size={19} />
                    )}
                  </span>
                  {item.question}
                  <CaretDown size={18} className="faq-caret" />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="products-heading" data-reveal>
            <div>
              <p className="eyebrow">More from the foundry</p>
              <h2>一个产品先做好，更多创作工具慢慢加入。</h2>
            </div>
            <p>
              这里已经预留后续产品的展示入口。未来的新产品可以沿用 ReelFoundry
              的完整介绍结构，接入自己的文案、视觉和下载方式。
            </p>
          </div>

          <div className="product-grid" data-reveal>
            <article className="product-card product-card-live">
              <img
                src="/assets/reelfoundry/hero-travel.png"
                alt="ReelFoundry 旅行视频创作画面"
              />
              <div className="product-card-body">
                <div>
                  <span className="product-status">现已开放</span>
                  <h3>ReelFoundry</h3>
                  <p>把照片和想法，变成一段值得分享的视频。</p>
                </div>
                <a href="#top" aria-label="查看 ReelFoundry 产品介绍">
                  <ArrowUpRight size={22} />
                </a>
              </div>
            </article>

            {["下一款产品", "未来产品"].map((name, index) => (
              <article className="product-card product-card-reserved" key={name}>
                <span className="reserved-icon" aria-hidden="true">
                  <Plus size={24} />
                </span>
                <div>
                  <span className="product-status">预留产品位 0{index + 2}</span>
                  <h3>{name}</h3>
                  <p>可接入同一套长页内容结构。</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="download-section" id="download">
          <div data-reveal>
            <p className="eyebrow">Start your next story</p>
            <h2>免费下载 ReelFoundry</h2>
            <p>在 Windows 与 macOS 上开启你的创作旅程。</p>

            <div className="download-actions">
              <DownloadButton
                platform="Windows"
                primary={selectedPlatform === "Windows"}
                onDownload={handleDownload}
              />
              <DownloadButton
                platform="macOS"
                primary={selectedPlatform === "macOS"}
                onDownload={handleDownload}
              />
            </div>

            <p className="download-meta">启动器免费 · 支持主流 AI 模型 · 本地项目空间</p>
            <p className="download-message" aria-live="polite">
              {downloadMessage}
            </p>
          </div>
        </section>
      </main>

      <footer>
        <a className="wordmark" href="#top">ReelFoundry</a>
        <div>
          <a href="#products">产品</a>
          <a href="#process">创作过程</a>
          <a href="#cost">费用说明</a>
          <a href="#download">下载</a>
        </div>
        <p>© 2026 ReelFoundry</p>
      </footer>
    </div>
  );
}
