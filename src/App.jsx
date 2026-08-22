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
import { defaultSiteContent, mergeSiteContent } from "./siteContent";

function useSiteContent() {
  const [content, setContent] = useState(defaultSiteContent);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/content", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (value) setContent(mergeSiteContent(value));
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.warn("站点内容读取失败，已使用默认内容。", error);
      });
    return () => controller.abort();
  }, []);

  return content;
}

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
  const content = useSiteContent();
  const directions = content.directions;
  const questions = content.faq;
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
        <a className="wordmark" href="#top" aria-label={`${content.brand} 首页`}>
          {content.brand}
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
          {content.hero.primaryCta}
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
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1>{content.hero.title}</h1>
            <p className="hero-intro">
              {content.hero.intro}
            </p>

            <div className="hero-actions">
              <DownloadButton
                platform={detectedPlatform}
                primary
                onDownload={handleDownload}
              />
              <a className="button button-ghost" href="#process">
                <Play size={18} weight="fill" aria-hidden="true" />
                {content.hero.secondaryCta}
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
              src={content.hero.image}
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
            src={content.video.image}
            alt="旅行者在暖色夕阳海岸边的成片画面"
          />
          <div className="video-overlay">
            <p>{content.video.kicker}</p>
            <h2>{content.video.title}</h2>
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
            <p className="eyebrow">{content.local.eyebrow}</p>
            <h2>{content.local.title}</h2>
            <ul className="feature-list">
              {content.local.features.map((feature) => (
                <li key={feature}>
                  <CheckCircle size={22} weight="fill" />
                  {feature}
                </li>
              ))}
            </ul>
            <a className="text-link" href="#cost">
              {content.local.linkLabel} <ArrowRight size={18} />
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
            <p className="eyebrow">{content.cost.eyebrow}</p>
            <h2>{content.cost.title}</h2>
            <p>
              {content.cost.body}
            </p>
            <p className="cost-note">
              {content.cost.note}
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
              <p className="eyebrow">{content.products.eyebrow}</p>
              <h2>{content.products.title}</h2>
            </div>
            <p>{content.products.intro}</p>
          </div>

          <div className="product-grid" data-reveal>
            <article className="product-card product-card-live">
              <img
                src={content.products.items[0]?.image || content.hero.image}
                alt={`${content.products.items[0]?.title || content.brand} 产品画面`}
              />
              <div className="product-card-body">
                <div>
                  <span className="product-status">{content.products.items[0]?.status}</span>
                  <h3>{content.products.items[0]?.title}</h3>
                  <p>{content.products.items[0]?.copy}</p>
                </div>
                <a href="#top" aria-label="查看 ReelFoundry 产品介绍">
                  <ArrowUpRight size={22} />
                </a>
              </div>
            </article>

            {content.products.items.slice(1).map((product) => (
              <article className="product-card product-card-reserved" key={product.title}>
                <span className="reserved-icon" aria-hidden="true">
                  <Plus size={24} />
                </span>
                <div>
                  <span className="product-status">{product.status}</span>
                  <h3>{product.title}</h3>
                  <p>{product.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="download-section" id="download">
          <div data-reveal>
            <p className="eyebrow">{content.download.eyebrow}</p>
            <h2>{content.download.title}</h2>
            <p>{content.download.copy}</p>

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

            <p className="download-meta">{content.download.meta}</p>
            <p className="download-message" aria-live="polite">
              {downloadMessage}
            </p>
          </div>
        </section>
      </main>

      <footer>
        <a className="wordmark" href="#top">{content.brand}</a>
        <div>
          <a href="#products">产品</a>
          <a href="#process">创作过程</a>
          <a href="#cost">费用说明</a>
          <a href="#download">下载</a>
        </div>
        <p>© 2026 {content.brand}</p>
      </footer>
    </div>
  );
}
