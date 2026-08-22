export const defaultSiteContent = {
  brand: "ReelFoundry",
  hero: {
    eyebrow: "本地运行的 AI 视频创意搭档",
    title: "把你的照片和想法，变成一段值得分享的视频。",
    intro: "和 ReelFoundry 聊聊你的想法，它会帮你完善创意、设计故事与镜头，并一步步生成视频。",
    primaryCta: "免费下载",
    secondaryCta: "观看创作过程",
    image: "/assets/reelfoundry/hero-travel.png"
  },
  directions: [
    {
      title: "治愈日常",
      copy: "把旅行里的安静片刻，剪成一段温柔的日记。",
      image: "/assets/reelfoundry/final-video.png"
    },
    {
      title: "公路记忆",
      copy: "跟着路途向前，让沿途风景成为故事的节奏。",
      image: "/assets/reelfoundry/hero-travel.png"
    },
    {
      title: "城市漫游",
      copy: "把街巷、灯光和偶遇，写成一封给城市的信。",
      image: "/assets/reelfoundry/final-video.png"
    }
  ],
  video: {
    kicker: "从灵感，到成片。",
    title: "每一个想法，都值得被看见。",
    image: "/assets/reelfoundry/final-video.png"
  },
  local: {
    eyebrow: "Local creative workspace",
    title: "本地运行，创作由你掌控。",
    features: [
      "项目与素材由本地启动器统一管理。",
      "自由选择模型，按照效果与成本切换。",
      "对话、分镜和成片保留在同一个创作空间。"
    ],
    linkLabel: "了解费用与数据说明"
  },
  cost: {
    eyebrow: "Simple and transparent",
    title: "启动器免费。模型费用，清楚透明。",
    body: "ReelFoundry 不收取启动器订阅费。只有在调用你选择的 AI 模型时，才会产生相应的 API 使用费用。",
    note: "实际费用由模型服务商按其公开规则结算，并会因模型、画面数量与视频时长而不同。"
  },
  faq: [
    {
      question: "需要付费才能使用 ReelFoundry 吗？",
      answer: "不需要。ReelFoundry 启动器免费下载，Windows 与 macOS 均可使用。"
    },
    {
      question: "模型调用如何计费？",
      answer: "当你调用 AI 模型时，由所选模型服务商按照其公布的 API 计费规则结算。费用会因模型、画面数量和视频时长而不同。"
    },
    {
      question: "我的素材会保存在哪里？",
      answer: "项目与素材由本地启动器管理。调用模型时，完成任务所需的内容会发送给你选择的模型服务商，请同时阅读相应服务商的隐私说明。"
    },
    {
      question: "可以使用不同的模型吗？",
      answer: "可以。ReelFoundry 计划支持多种主流模型，让你根据效果、速度和成本自由选择。"
    }
  ],
  products: {
    eyebrow: "More from the foundry",
    title: "一个产品先做好，更多创作工具慢慢加入。",
    intro: "这里已经预留后续产品的展示入口。未来的新产品可以沿用 ReelFoundry 的完整介绍结构，接入自己的文案、视觉和下载方式。",
    items: [
      {
        status: "现已开放",
        title: "ReelFoundry",
        copy: "把照片和想法，变成一段值得分享的视频。",
        image: "/assets/reelfoundry/hero-travel.png",
        type: "live"
      },
      {
        status: "预留产品位 02",
        title: "下一款产品",
        copy: "可接入同一套长页内容结构。",
        image: "",
        type: "reserved"
      },
      {
        status: "预留产品位 03",
        title: "未来产品",
        copy: "可接入同一套长页内容结构。",
        image: "",
        type: "reserved"
      }
    ]
  },
  download: {
    eyebrow: "Start your next story",
    title: "免费下载 ReelFoundry",
    copy: "在 Windows 与 macOS 上开启你的创作旅程。",
    meta: "启动器免费 · 支持主流 AI 模型 · 本地项目空间"
  }
};

export function mergeSiteContent(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    ...defaultSiteContent,
    ...source,
    hero: { ...defaultSiteContent.hero, ...source.hero },
    video: { ...defaultSiteContent.video, ...source.video },
    local: { ...defaultSiteContent.local, ...source.local },
    cost: { ...defaultSiteContent.cost, ...source.cost },
    products: { ...defaultSiteContent.products, ...source.products },
    download: { ...defaultSiteContent.download, ...source.download },
    directions: Array.isArray(source.directions) ? source.directions : defaultSiteContent.directions,
    faq: Array.isArray(source.faq) ? source.faq : defaultSiteContent.faq
  };
}
