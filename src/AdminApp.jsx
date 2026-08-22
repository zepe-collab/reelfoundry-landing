import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowSquareOut,
  Check,
  ImageSquare,
  SignIn,
  SignOut,
  SpinnerGap,
  UploadSimple,
} from "@phosphor-icons/react";
import { defaultSiteContent, mergeSiteContent } from "./siteContent";

function Field({ label, value, onChange, multiline = false, hint }) {
  const Element = multiline ? "textarea" : "input";
  return (
    <label className="admin-field">
      <span>{label}</span>
      <Element
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={multiline ? 3 : undefined}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function ImageField({ label, value, onChange, onUpload, uploading }) {
  const inputRef = useRef(null);
  return (
    <div className="admin-image-field">
      <div className="admin-image-preview">
        {value ? <img src={value} alt="" /> : <ImageSquare size={30} />}
      </div>
      <div className="admin-image-controls">
        <Field label={label} value={value} onChange={onChange} hint="可粘贴图片网址，或从电脑上传。" />
        <input
          ref={inputRef}
          className="admin-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file, onChange);
            event.target.value = "";
          }}
        />
        <button className="admin-secondary-button" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <SpinnerGap className="spin" size={18} /> : <UploadSimple size={18} />}
          {uploading ? "上传中" : "上传图片"}
        </button>
      </div>
    </div>
  );
}

function Gate({ session }) {
  if (!session?.signedIn) {
    return (
      <main className="admin-gate">
        <div className="admin-gate-card">
          <span className="admin-kicker">ReelFoundry Studio</span>
          <h1>管理你的产品页面</h1>
          <p>使用你的 ChatGPT 账号登录。管理入口只向站点所有者开放。</p>
          <a className="admin-primary-button" href="/signin-with-chatgpt?return_to=/admin">
            <SignIn size={20} /> 使用 ChatGPT 登录
          </a>
          <a className="admin-back-link" href="/">返回公开网站</a>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-gate">
      <div className="admin-gate-card">
        <span className="admin-kicker">ReelFoundry Studio</span>
        <h1>这个账号没有管理权限</h1>
        <p>当前登录账号不是该站点的所有者。请退出后使用创建 ReelFoundry 的账号重新登录。</p>
        <a className="admin-primary-button" href="/signout-with-chatgpt?return_to=/admin">
          <SignOut size={20} /> 更换账号
        </a>
        <a className="admin-back-link" href="/">返回公开网站</a>
      </div>
    </main>
  );
}

export function AdminApp() {
  const [session, setSession] = useState(null);
  const [content, setContent] = useState(defaultSiteContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then(async (nextSession) => {
        if (!active) return;
        setSession(nextSession);
        if (nextSession.admin) {
          const response = await fetch("/api/content");
          if (response.ok && active) setContent(mergeSiteContent(await response.json()));
        }
      })
      .catch(() => {
        if (active) setMessage("暂时无法连接管理服务，请稍后刷新。 ");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const warn = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const sections = useMemo(
    () => [
      ["hero", "首屏"],
      ["directions", "创意方向"],
      ["video", "成片展示"],
      ["local", "本地工作台"],
      ["cost", "费用与问答"],
      ["products", "产品展示"],
      ["download", "下载区域"],
    ],
    [],
  );

  const change = (producer) => {
    setContent((current) => producer(structuredClone(current)));
    setDirty(true);
    setMessage("");
  };

  const updateSection = (section, key, value) =>
    change((draft) => {
      draft[section][key] = value;
      return draft;
    });

  const updateListItem = (list, index, key, value) =>
    change((draft) => {
      draft[list][index][key] = value;
      return draft;
    });

  const updateProduct = (index, key, value) =>
    change((draft) => {
      draft.products.items[index][key] = value;
      return draft;
    });

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!response.ok) throw new Error("保存失败");
      setDirty(false);
      setMessage("修改已发布到公开页面。");
    } catch {
      setMessage("保存失败，请检查网络后重试。");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file, onUploaded) => {
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error("上传失败");
      onUploaded(payload.url);
      setMessage("图片已上传，记得点击保存修改。 ");
    } catch {
      setMessage("图片上传失败，请选择 8MB 以内的 JPG、PNG、WebP 或 GIF。 ");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-loading">
        <SpinnerGap className="spin" size={28} /> 正在打开管理后台…
      </main>
    );
  }

  if (!session?.admin) return <Gate session={session} />;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <span className="admin-kicker">ReelFoundry Studio</span>
          <strong>页面管理</strong>
          <small>{session.email}</small>
        </div>
        <nav aria-label="管理内容分区">
          {sections.map(([id, label]) => <a href={`#admin-${id}`} key={id}>{label}</a>)}
        </nav>
        <div className="admin-sidebar-actions">
          <a href="/" target="_blank" rel="noreferrer"><ArrowSquareOut size={18} />查看公开页面</a>
          <a href="/signout-with-chatgpt?return_to=/admin"><SignOut size={18} />退出登录</a>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p>内容管理</p>
            <h1>让页面始终保持新鲜。</h1>
            <span>保存后，访客刷新页面即可看到最新内容。</span>
          </div>
          <button className="admin-primary-button" type="button" onClick={save} disabled={saving || !dirty}>
            {saving ? <SpinnerGap className="spin" size={19} /> : <Check size={19} />}
            {saving ? "正在保存" : dirty ? "保存并发布" : "内容已保存"}
          </button>
        </header>

        {message ? <div className="admin-message" role="status">{message}</div> : null}

        <section className="admin-panel" id="admin-hero">
          <div className="admin-panel-heading"><span>01</span><div><h2>首屏</h2><p>访客第一眼看到的品牌承诺。</p></div></div>
          <div className="admin-grid admin-grid-two">
            <Field label="品牌名称" value={content.brand} onChange={(value) => change((draft) => ({ ...draft, brand: value }))} />
            <Field label="眉标题" value={content.hero.eyebrow} onChange={(value) => updateSection("hero", "eyebrow", value)} />
            <Field label="主标题" value={content.hero.title} multiline onChange={(value) => updateSection("hero", "title", value)} />
            <Field label="介绍文字" value={content.hero.intro} multiline onChange={(value) => updateSection("hero", "intro", value)} />
            <Field label="主按钮文字" value={content.hero.primaryCta} onChange={(value) => updateSection("hero", "primaryCta", value)} />
            <Field label="次按钮文字" value={content.hero.secondaryCta} onChange={(value) => updateSection("hero", "secondaryCta", value)} />
          </div>
          <ImageField label="首屏图片" value={content.hero.image} onChange={(value) => updateSection("hero", "image", value)} onUpload={upload} uploading={uploading} />
        </section>

        <section className="admin-panel" id="admin-directions">
          <div className="admin-panel-heading"><span>02</span><div><h2>创意方向</h2><p>编辑对话后出现的三个灵感卡片。</p></div></div>
          <div className="admin-card-list">
            {content.directions.map((item, index) => (
              <article className="admin-subcard" key={index}>
                <h3>方向 {index + 1}</h3>
                <Field label="名称" value={item.title} onChange={(value) => updateListItem("directions", index, "title", value)} />
                <Field label="说明" value={item.copy} multiline onChange={(value) => updateListItem("directions", index, "copy", value)} />
                <ImageField label="卡片图片" value={item.image} onChange={(value) => updateListItem("directions", index, "image", value)} onUpload={upload} uploading={uploading} />
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel" id="admin-video">
          <div className="admin-panel-heading"><span>03</span><div><h2>成片展示</h2><p>滚动到中段时出现的大画面。</p></div></div>
          <div className="admin-grid admin-grid-two">
            <Field label="短句" value={content.video.kicker} onChange={(value) => updateSection("video", "kicker", value)} />
            <Field label="标题" value={content.video.title} onChange={(value) => updateSection("video", "title", value)} />
          </div>
          <ImageField label="成片图片" value={content.video.image} onChange={(value) => updateSection("video", "image", value)} onUpload={upload} uploading={uploading} />
        </section>

        <section className="admin-panel" id="admin-local">
          <div className="admin-panel-heading"><span>04</span><div><h2>本地工作台</h2><p>说明启动器的核心优势。</p></div></div>
          <div className="admin-grid admin-grid-two">
            <Field label="眉标题" value={content.local.eyebrow} onChange={(value) => updateSection("local", "eyebrow", value)} />
            <Field label="主标题" value={content.local.title} onChange={(value) => updateSection("local", "title", value)} />
            {content.local.features.map((feature, index) => (
              <Field key={index} label={`优势 ${index + 1}`} value={feature} onChange={(value) => change((draft) => { draft.local.features[index] = value; return draft; })} />
            ))}
            <Field label="说明链接文字" value={content.local.linkLabel} onChange={(value) => updateSection("local", "linkLabel", value)} />
          </div>
        </section>

        <section className="admin-panel" id="admin-cost">
          <div className="admin-panel-heading"><span>05</span><div><h2>费用与问答</h2><p>让用户放心了解产品的收费方式。</p></div></div>
          <div className="admin-grid admin-grid-two">
            <Field label="眉标题" value={content.cost.eyebrow} onChange={(value) => updateSection("cost", "eyebrow", value)} />
            <Field label="标题" value={content.cost.title} multiline onChange={(value) => updateSection("cost", "title", value)} />
            <Field label="主要说明" value={content.cost.body} multiline onChange={(value) => updateSection("cost", "body", value)} />
            <Field label="补充说明" value={content.cost.note} multiline onChange={(value) => updateSection("cost", "note", value)} />
          </div>
          <div className="admin-card-list admin-faq-editors">
            {content.faq.map((item, index) => (
              <article className="admin-subcard" key={index}>
                <h3>问答 {index + 1}</h3>
                <Field label="问题" value={item.question} onChange={(value) => updateListItem("faq", index, "question", value)} />
                <Field label="回答" value={item.answer} multiline onChange={(value) => updateListItem("faq", index, "answer", value)} />
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel" id="admin-products">
          <div className="admin-panel-heading"><span>06</span><div><h2>产品展示</h2><p>管理 ReelFoundry 和预留的未来产品。</p></div></div>
          <div className="admin-grid admin-grid-two">
            <Field label="眉标题" value={content.products.eyebrow} onChange={(value) => updateSection("products", "eyebrow", value)} />
            <Field label="区域标题" value={content.products.title} multiline onChange={(value) => updateSection("products", "title", value)} />
            <Field label="区域介绍" value={content.products.intro} multiline onChange={(value) => updateSection("products", "intro", value)} />
          </div>
          <div className="admin-card-list">
            {content.products.items.map((product, index) => (
              <article className="admin-subcard" key={index}>
                <h3>{index === 0 ? "当前产品" : `产品位 ${index + 1}`}</h3>
                <Field label="状态" value={product.status} onChange={(value) => updateProduct(index, "status", value)} />
                <Field label="名称" value={product.title} onChange={(value) => updateProduct(index, "title", value)} />
                <Field label="说明" value={product.copy} multiline onChange={(value) => updateProduct(index, "copy", value)} />
                {index === 0 ? <ImageField label="产品图片" value={product.image} onChange={(value) => updateProduct(index, "image", value)} onUpload={upload} uploading={uploading} /> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel" id="admin-download">
          <div className="admin-panel-heading"><span>07</span><div><h2>下载区域</h2><p>页面末尾的行动邀请。</p></div></div>
          <div className="admin-grid admin-grid-two">
            <Field label="眉标题" value={content.download.eyebrow} onChange={(value) => updateSection("download", "eyebrow", value)} />
            <Field label="主标题" value={content.download.title} onChange={(value) => updateSection("download", "title", value)} />
            <Field label="介绍" value={content.download.copy} onChange={(value) => updateSection("download", "copy", value)} />
            <Field label="补充信息" value={content.download.meta} onChange={(value) => updateSection("download", "meta", value)} />
          </div>
        </section>

        <div className="admin-bottom-bar">
          <span>{dirty ? "有尚未保存的修改" : "所有修改都已保存"}</span>
          <button className="admin-primary-button" type="button" onClick={save} disabled={saving || !dirty}>
            {saving ? <SpinnerGap className="spin" size={19} /> : <Check size={19} />}
            {saving ? "正在保存" : "保存并发布"}
          </button>
        </div>
      </main>
    </div>
  );
}
