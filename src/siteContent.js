export const defaultSiteContent = {
  brand: "Pixel Core",
  hero: {
    eyebrow: "AI 产品与 Skills 工作室",
    title: "把灵感交给 AI，打磨成真正好用的产品。",
    intro: "Pixel Core 专注于用 AI 打造产品与 Skills，让创意更快从想法走向可用、可分享的作品。",
    primaryCta: "探索产品",
    secondaryCta: "认识 ReelFoundry",
    image: "/assets/pixel-core/hero-travel.png"
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
    eyebrow: "Pixel Core Products",
    title: "选择一件产品，查看它完整的创作故事。",
    intro: "左右切换舞台上的产品，下面的场景、流程、视觉展示与行动区域会一起更新。",
    items: [
      {
        status: "现已推出",
        title: "ReelFoundry",
        copy: "把你的照片和想法，变成一段值得分享的视频。",
        image: "/assets/pixel-core/reelfoundry-card.png",
        features: [
          "用对话把模糊想法变成可执行的创意方案",
          "从照片、脚本、分镜到视频，在一个流程里完成",
          "本地启动器免费，模型与 API 成本由用户掌控"
        ],
        type: "live",
        story: {
          eyebrow: "Conversation to creation",
          title: "从一次对话开始，创意自然展开。",
          description: "不用先学提示词，也不用先决定镜头。告诉 Agent 你想表达什么，它会逐步帮你找到主题、节奏和叙事方向。",
          prompts: [
            "我想把这次旅行做成一段温暖的短片。",
            "更喜欢治愈日常，节奏慢一点，温暖一些。"
          ],
          steps: [
            { title: "理解想法", text: "把自然语言整理成可执行的创作方案。" },
            { title: "组织素材", text: "照片、脚本、分镜在同一个项目里保持关联。" },
            { title: "生成成片", text: "选择模型后生成预览，并继续通过对话调整。" }
          ],
          visualImage: "/assets/pixel-core/storyboard-card.png",
          visualEyebrow: "Storyboard",
          visualTitle: "每一个镜头，都先有清晰的理由。",
          visualText: "Agent 会把故事拆成镜头，保留人物、场景与情绪的连续性，再交给模型生成。",
          workspaceImage: "/assets/pixel-core/motioncanvas-card.png",
          workspaceEyebrow: "Local creative workspace",
          workspaceTitle: "本地运行，创作由你掌控。",
          workspaceText: "启动器免费下载。你可以按效果与成本自由选择模型，API 费用直接由对应服务产生。",
          bullets: ["项目与素材在本地统一管理", "模型可以随时切换", "费用来源清楚透明"],
          ctaEyebrow: "Start your next story",
          ctaTitle: "免费获取 ReelFoundry 启动器",
          ctaText: "Windows 与 macOS 版本将从这里进入下载流程。",
          ctaLabel: "查看下载方式"
        }
      },
      {
        status: "即将推出 · 概念占位",
        title: "产品概念 02",
        copy: "第二件 AI 产品的完整展示位置，等待下一次灵感落地。",
        image: "/assets/pixel-core/motioncanvas-card.png",
        features: [
          "保留独立价值主张与真实使用场景",
          "从输入、工作流到结果拥有完整叙事",
          "确定产品之前不虚构功能与上线状态"
        ],
        type: "reserved",
        story: {
          eyebrow: "Product story template",
          title: "下一件产品，也从用户的一句话开始。",
          description: "这是第二个产品的完整内容占位。未来确定方向后，这一整段会替换为它自己的场景、工作流和使用结果。",
          prompts: [
            "我想解决一个重复、耗时，但很适合交给 AI 的任务。",
            "先帮我梳理用户真正需要的结果。"
          ],
          steps: [
            { title: "定义问题", text: "从用户语言里找到真正值得解决的任务。" },
            { title: "编排流程", text: "把能力组合成一条可理解、可操作的路径。" },
            { title: "交付结果", text: "让用户清楚知道最后会得到什么。" }
          ],
          visualImage: "/assets/pixel-core/motioncanvas-card.png",
          visualEyebrow: "Full product narrative",
          visualTitle: "不是一张卡片，而是一整套产品故事。",
          visualText: "切换产品后，从首个场景、能力说明到最终交付，全部内容都会一起更新。",
          workspaceImage: "/assets/pixel-core/storyboard-card.png",
          workspaceEyebrow: "Reserved product slot",
          workspaceTitle: "结构已经准备好，内容等产品决定。",
          workspaceText: "保留与 ReelFoundry 同等完整的篇幅，但不会提前虚构产品能力或上线状态。",
          bullets: ["独立价值主张", "完整功能叙事", "明确交付与状态"],
          ctaEyebrow: "Coming soon",
          ctaTitle: "产品概念 02 正在等待定义",
          ctaText: "选定真实产品后，这里会替换成它自己的行动入口。",
          ctaLabel: "返回产品舞台"
        }
      },
      {
        status: "即将推出 · 概念占位",
        title: "产品概念 03",
        copy: "第三件 AI 产品的独立叙事空间，为 Pixel Core 的下一步预留。",
        image: "/assets/pixel-core/storyboard-card.png",
        features: [
          "展示产品如何从输入开始带用户走向结果",
          "突出最有辨识度的能力而不是堆砌功能",
          "完整说明获取方式、运行环境与成本结构"
        ],
        type: "reserved",
        story: {
          eyebrow: "The next Pixel Core product",
          title: "给未知方向，留出足够完整的舞台。",
          description: "这是第三个产品的内容占位。它证明产品流转页可以承载不同产品，而不是把所有产品压缩成同一种介绍。",
          prompts: [
            "我有一个新想法，但还不知道它应该是什么产品。",
            "先从最有价值的使用场景开始。"
          ],
          steps: [
            { title: "发现机会", text: "找到最值得产品化的 AI 使用方式。" },
            { title: "讲清过程", text: "用真实场景串联能力与价值。" },
            { title: "说明交付", text: "把获取、运行和成本讲得足够透明。" }
          ],
          visualImage: "/assets/pixel-core/storyboard-card.png",
          visualEyebrow: "Flexible content system",
          visualTitle: "相同框架，不同产品拥有不同节奏。",
          visualText: "图片、文案、功能段落和行动按钮均由当前选中的产品控制。",
          workspaceImage: "/assets/pixel-core/reelfoundry-card.png",
          workspaceEyebrow: "Pixel Core standard",
          workspaceTitle: "简洁、清晰，也要保留产品个性。",
          workspaceText: "每件产品沿用统一品牌秩序，同时保留自己的图像、口吻和核心体验。",
          bullets: ["统一品牌层级", "独立产品画面", "整页内容联动"],
          ctaEyebrow: "Coming soon",
          ctaTitle: "产品概念 03 仍是空白画布",
          ctaText: "等真实产品出现，再为它写下准确的故事。",
          ctaLabel: "返回产品舞台"
        }
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
  const heroSource = source.hero || {};
  return {
    ...defaultSiteContent,
    ...source,
    hero: {
      ...defaultSiteContent.hero,
      ...heroSource,
      image:
        !heroSource.image || heroSource.image === "/assets/reelfoundry/hero-travel.png"
          ? defaultSiteContent.hero.image
          : heroSource.image
    },
    video: { ...defaultSiteContent.video, ...source.video },
    local: { ...defaultSiteContent.local, ...source.local },
    cost: { ...defaultSiteContent.cost, ...source.cost },
    products: {
      ...defaultSiteContent.products,
      ...source.products,
      items: defaultSiteContent.products.items.map((item, index) => {
        const sourceItem = Array.isArray(source.products?.items)
          ? source.products.items[index]
          : null;
        const legacyProductImages = [
          "/assets/reelfoundry/hero-travel.png",
          "/assets/reelfoundry/storyboard-strip.png",
          "/assets/reelfoundry/final-video.png"
        ];
        const sourceStory = sourceItem?.story || {};
        return {
          ...item,
          ...sourceItem,
          image:
            !sourceItem?.image || sourceItem.image === legacyProductImages[index]
              ? item.image
              : sourceItem.image,
          features: item.features.map((feature, featureIndex) =>
            sourceItem?.features?.[featureIndex] ?? feature
          ),
          story: {
            ...item.story,
            ...sourceStory,
            prompts: Array.isArray(sourceStory.prompts) ? sourceStory.prompts : item.story.prompts,
            steps: item.story.steps.map((step, stepIndex) => ({
              ...step,
              ...(Array.isArray(sourceStory.steps) ? sourceStory.steps[stepIndex] : null)
            })),
            bullets: Array.isArray(sourceStory.bullets) ? sourceStory.bullets : item.story.bullets
          }
        };
      })
    },
    download: { ...defaultSiteContent.download, ...source.download },
    directions: Array.isArray(source.directions) ? source.directions : defaultSiteContent.directions,
    faq: Array.isArray(source.faq) ? source.faq : defaultSiteContent.faq
  };
}
