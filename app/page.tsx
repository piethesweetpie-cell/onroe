"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { BookOpen, Camera, Gamepad2, ImageIcon, Layers, PencilLine, Sparkles, UserRound, UsersRound, WandSparkles } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import styles from "./page.module.css"

const styleMap = styles as Record<string, string>

const FADE_UP_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", duration: 0.8 } },
}

const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

function FloatCard({ title, imageSrc, rotation = -5, delay = "0s", duration = "6.5s", style }: {
  title: string; imageSrc: string; rotation?: number; delay?: string; duration?: string; style?: React.CSSProperties
}) {
  return (
    <div style={{ position: "absolute", ...style }}>
      <div className={s("float-card")} style={{ "--fc-rot": `${rotation}deg`, "--fc-delay": delay, "--fc-dur": duration } as React.CSSProperties}>
        <div className={s("float-card-head")}>
          <span className={s("float-card-dot")} />
          <span className={s("float-card-title")}>{title}</span>
          <span className={s("float-card-menu")}>•••</span>
        </div>
        <div className={s("float-card-img")}>
          <img src={imageSrc} alt={title} />
        </div>
      </div>
    </div>
  )
}

function s(classNames: string) {
  return classNames
    .split(/\s+/)
    .filter(Boolean)
    .map((className) => styleMap[className] ?? className)
    .join(" ")
}

function HubLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

export default function HubPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]")
    const scrolledClass = styleMap["is-scrolled"]
    const visibleClass = styleMap["is-visible"]

    const onScroll = () => {
      nav?.classList.toggle(scrolledClass, window.scrollY > 30)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(visibleClass)
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )

    Array.from(document.getElementsByClassName(styleMap.reveal)).forEach((element) => {
      revealObserver.observe(element)
    })

    return () => {
      window.removeEventListener("scroll", onScroll)
      revealObserver.disconnect()
    }
  }, [])

  return (
    <div className={styles.hubRoot}>
      <nav className={s("nav")} data-nav="">
          <div className={s("nav-inner")}>
            <HubLink className={s("brand")} href="/">ONROE</HubLink>
            <div className={s("nav-links")}>
              <HubLink className={s("nav-link")} href="/productroe">ProductRoe</HubLink>
              <HubLink className={s("nav-link")} href="/characterroe">CharacterRoe</HubLink>
              <HubLink className={s("nav-link")} href="/titleroe">TitleRoe</HubLink>
              <HubLink className={s("portfolio-nav-link")} href="/portfolio">Portfolio</HubLink>
            </div>
          </div>
        </nav>
      
        <main>
          <section className={s("section hero")}>
            <div className={s("hero-glow-left")} aria-hidden="true"></div>
            <div className={s("hero-glow-right")} aria-hidden="true"></div>
            <div className={s("hero-copy reveal")}>
              <h1>
                <span className={s("hero-title-main")}>ONROE</span>
                <span className={s("hero-title-sub")}>AI Studio</span>
              </h1>
              <p>
                상품 이미지부터 캐릭터 시안, 웹소설 표지까지.
              </p>
              <div className={s("featured-categories")}>
                <div className={s("fc-header")}>
                  <span className={s("fc-label")}>Featured Categories</span>
                  <div className={s("fc-line")} />
                </div>
                <div className={s("fc-card")}>
                  <svg className={s("fc-wave-svg")} viewBox="0 0 900 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M 0,64 C 40,64 95,47 150,47 C 205,47 252,74 300,74 C 348,74 395,47 450,47 C 505,47 552,74 600,74 C 655,74 700,47 750,47 C 800,47 845,55 858,55" stroke="#BF8EA0" fill="none" strokeWidth="0.9" opacity="0.8" />
                  </svg>
                  <div className={s("fc-sparkle")} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <filter id="sp-glow" x="-120%" y="-120%" width="340%" height="340%">
                          <feGaussianBlur stdDeviation="1.8" result="blur" />
                          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                      </defs>
                      <path d="M7,0 L8,6 L14,7 L8,8 L7,14 L6,8 L0,7 L6,6 Z" fill="#C8688A" opacity="0.9" filter="url(#sp-glow)" />
                      <path d="M7,3 L7.6,6.4 L11,7 L7.6,7.6 L7,11 L6.4,7.6 L3,7 L6.4,6.4 Z" fill="#F2B8D0" opacity="0.85" />
                    </svg>
                  </div>
                  <HubLink href="#productroe" className={s("fc-item")}>
                    <div className={s("fc-item-head")}>
                      <span className={s("fc-num")}>01</span>
                      <span className={s("fc-arrow")}>›</span>
                    </div>
                    <div className={s("fc-icon-wrap")}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2C8 2 5 5 5 8v1h14V8c0-3-3-6-7-6z" /><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M8 9v12M16 9v12" />
                      </svg>
                    </div>
                    <div className={s("fc-name")}>ProductRoe</div>
                    <div className={s("fc-desc")}>상품의 매력을 극대화하는<br />고퀄리티 제품 이미지</div>
                  </HubLink>
                  <div className={s("fc-divider")} />
                  <HubLink href="#characterroe" className={s("fc-item")}>
                    <div className={s("fc-item-head")}>
                      <span className={s("fc-num")}>02</span>
                      <span className={s("fc-arrow")}>›</span>
                    </div>
                    <div className={s("fc-icon-wrap")}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    </div>
                    <div className={s("fc-name")}>CharacterRoe</div>
                    <div className={s("fc-desc")}>개성과 스토리를 담은<br />캐릭터 & 일러스트 시안</div>
                  </HubLink>
                  <div className={s("fc-divider")} />
                  <HubLink href="#titleroe" className={s("fc-item")}>
                    <div className={s("fc-item-head")}>
                      <span className={s("fc-num")}>03</span>
                      <span className={s("fc-arrow")}>›</span>
                    </div>
                    <div className={s("fc-icon-wrap")}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
                      </svg>
                    </div>
                    <div className={s("fc-name")}>TitleRoe</div>
                    <div className={s("fc-desc")}>웹소설부터 브랜드까지<br />시선을 사로잡는 타이틀</div>
                  </HubLink>
                </div>
              </div>
            </div>
            <div className={s("hero-mark reveal")} style={{ marginTop: "16px" }}>
              <div className={s("hero-mark-bg")}>
                <Image unoptimized src="/images/bg.png" alt="" width={800} height={800} />
              </div>
              <div className={s("hero-mark-logo")}>
                <Image unoptimized src="/hub/logo.png" alt="ONROE logo mark" width={550} height={538} />
              </div>
              <FloatCard title="Product Photo" imageSrc="/hub/portfolio/product-pedestal-hero.png" rotation={-6} delay="0s" duration="6.8s" style={{ top: "8px", left: "-7px" }} />
              <FloatCard title="AI illustration" imageSrc="/hub/roe.png" rotation={4} delay="2.2s" duration="7.4s" style={{ top: "30px", right: "-45px" }} />
              <FloatCard title="Detail View" imageSrc="/hub/portfolio/product-clean-stand.png" rotation={3} delay="4s" duration="6.2s" style={{ bottom: "32px", right: "-30px" }} />
            </div>
            <div className={s("hero-index")}>01 / 06</div>
          </section>
      
          <section id="services" className={s("section section-bordered band-02")}>
            <div className={s("section-head reveal")}>
              <div>
                <span className={s("label")}>Services</span>
                <h2>세 가지 전문 서비스</h2>
              </div>
              <p>목적에 맞는 서비스를 선택하면 필요한 비주얼을 시작할 수 있습니다.</p>
            </div>
      
            <motion.div
              className={s("service-grid")}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={STAGGER_CONTAINER_VARIANTS}
            >
              <motion.div
                className={s("service-motion-card service-motion-product")}
                variants={FADE_UP_VARIANTS}
              >
                <HubLink className={s("service-card service-card-product")} href="/productroe">
                  <span className={s("service-icon-badge")} aria-hidden="true">
                    <Camera size={22} strokeWidth={1.8} />
                  </span>
                  <div className={s("service-image")}>
                    <Image unoptimized src="/hub/portfolio/product-pedestal-hero.png" alt="ProductRoe product visual" width={768} height={1376} />
                  </div>
                  <div className={s("service-body")}>
                    <div className={s("meta")}><strong>01</strong><i></i><span>Product Visual</span></div>
                    <h3>ProductRoe</h3>
                    <div className={s("tagline")}>For Brands & Sellers</div>
                    <p>제품 사진을 상세페이지와 광고용 비주얼로 확장합니다.</p>
                    <div className={s("target")}>온라인 셀러 · 브랜드 · 쇼핑몰 운영자</div>
                  </div>
                </HubLink>
              </motion.div>
      
              <motion.div
                className={s("service-motion-card service-motion-character")}
                variants={FADE_UP_VARIANTS}
              >
                <HubLink className={s("service-card service-card-character")} href="/characterroe">
                  <span className={s("service-icon-badge")} aria-hidden="true">
                    <UserRound size={23} strokeWidth={1.8} />
                  </span>
                  <div className={s("service-image")} style={{ background: "#F0EEF8" }}>
                    <Image unoptimized src="/hub/roe.png" alt="CharacterRoe character visual" width={1124} height={490} style={{ objectPosition: "center top" }} />
                  </div>
                  <div className={s("service-body")}>
                    <div className={s("meta")}><strong>02</strong><i></i><span>Character Design</span></div>
                    <h3>CharacterRoe</h3>
                    <div className={s("tagline")}>For Creators & Planners</div>
                    <p>웹툰, 게임, 콘텐츠 캐릭터 시안을 빠르게 시각화합니다.</p>
                    <div className={s("target")}>웹툰·게임 기획자 · 1인 창작자</div>
                  </div>
                </HubLink>
              </motion.div>
      
              <motion.div
                className={s("service-motion-card service-motion-title")}
                variants={FADE_UP_VARIANTS}
              >
                <HubLink className={s("service-card service-card-title")} href="/titleroe">
                  <span className={s("service-icon-badge")} aria-hidden="true">
                    <PencilLine size={22} strokeWidth={1.8} />
                  </span>
                  <div className={s("service-image")}>
                    <Image unoptimized src="/images/titleroe-portfolio/home-title-portfolio-1.jpg" alt="TitleRoe cover illustration" width={896} height={1200} />
                  </div>
                  <div className={s("service-body")}>
                    <div className={s("meta")}><strong>03</strong><i></i><span>Cover Illustration</span></div>
                    <h3>TitleRoe</h3>
                    <div className={s("tagline")}>For Writers</div>
                    <p>장르와 무드에 맞는 웹소설 표지와 삽화를 제작합니다.</p>
                    <div className={s("target")}>웹소설 작가 · 출간 준비자</div>
                  </div>
                </HubLink>
              </motion.div>
            </motion.div>
          </section>
      
          <section className={s("detail-shell")}>
            <div className={s("section")}>
              <article id="productroe" className={s("detail detail-product reveal")}>
                <div className={s("detail-text")}>
                  <span className={s("label")}>01 · Product Visual · Track A & B</span>
                  <h2>제품을 판매 이미지로<br />바꾸는 AI 상품 비주얼</h2>
                  <p>제품 사진 한 장에서 시작해 브랜드 무드가 담긴 상품 컷, 상세페이지용 이미지, AI 모델 화보까지 제작합니다. 촬영 없이도 제품의 분위기와 사용 장면을 확장합니다.</p>
                  <div className={s("detail-feature-grid")}>
                    <div className={s("detail-feature")}><span><Camera size={26} /></span><strong>상세페이지</strong><p>판매에 최적화된 온라인 상세 이미지</p></div>
                    <div className={s("detail-feature")}><span><Sparkles size={26} /></span><strong>브랜드무드</strong><p>감성 무드와 일관된 브랜드 비주얼</p></div>
                    <div className={s("detail-feature")}><span><UserRound size={26} /></span><strong>AI 모델</strong><p>모델 비용 없이 구현하는 AI 모델 화보</p></div>
                    <div className={s("detail-feature")}><span><Layers size={26} /></span><strong>합리적 비용</strong><p>촬영 대비 효율적으로 제작 가능합니다</p></div>
                  </div>
                  <HubLink className={s("text-link")} href="/productroe">ProductRoe 의뢰하기 -&gt;</HubLink>
                </div>
                <div className={s("detail-visual")}>
                  <Image unoptimized src="/images/s1.png" alt="ProductRoe example" width={1099} height={1060} />
                </div>
              </article>
      
              <article id="characterroe" className={s("detail detail-character reveal")}>
                <div className={s("detail-text")}>
                  <span className={s("label")}>02 · Character Design</span>
                  <h2>캐릭터 콘셉트를<br />시각화하는 AI 캐릭터 제작</h2>
                  <p>웹툰, 게임, SNS 콘텐츠에 필요한 캐릭터를 성격, 세계관, 의상, 분위기 정보로 설계해 첫 시안을 제공합니다.</p>
                  <div className={s("detail-feature-grid")}>
                    <div className={s("detail-feature")}><span><UserRound size={26} /></span><strong>캐릭터 콘셉트 기획</strong><p>성격·세계관·외형 등 캐릭터 방향 설계</p></div>
                    <div className={s("detail-feature")}><span><Gamepad2 size={26} /></span><strong>시리즈형 설계</strong><p>SNS·웹툰·게임 등 확장형 시안 제공</p></div>
                    <div className={s("detail-feature")}><span><PencilLine size={26} /></span><strong>콘셉트 시안</strong><p>콘셉트 기반의 캐릭터 시안 제작</p></div>
                    <div className={s("detail-feature")}><span><UsersRound size={26} /></span><strong>1인 창작자 지원</strong><p>혼자 기획과 제작을 병행하는 창작자 지원</p></div>
                  </div>
                  <HubLink className={s("text-link")} href="/characterroe">CharacterRoe 의뢰하기 -&gt;</HubLink>
                </div>
                <div className={s("detail-visual")}>
                  <Image unoptimized src="/images/s2.png" alt="CharacterRoe example" width={1099} height={1060} />
                </div>
              </article>
      
              <article id="titleroe" className={s("detail detail-title reveal")}>
                <div className={s("detail-text")}>
                  <span className={s("label")}>03 · Cover Illustration</span>
                  <h2>작품의 첫인상을 결정하는<br />AI 웹소설 표지</h2>
                  <p>로맨스판타지, 현대로맨스, BL, 현판, 무협, 헌터물 등 장르와 독자층에 맞는 표지 이미지와 삽화, e-book·단행본 표지를 제작합니다.</p>
                  <div className={s("detail-feature-grid")}>
                    <div className={s("detail-feature")}><span><ImageIcon size={26} /></span><strong>장르 맞춤 디자인</strong><p>장르와 독자층에 최적화된 표지 디자인</p></div>
                    <div className={s("detail-feature")}><span><WandSparkles size={26} /></span><strong>웹 & 단행본</strong><p>웹소설·e-book·단행본 모두 제작 가능</p></div>
                    <div className={s("detail-feature")}><span><BookOpen size={26} /></span><strong>삽화 제작</strong><p>표지와 어울리는 삽화 작업 지원</p></div>
                    <div className={s("detail-feature")}><span><UsersRound size={26} /></span><strong>작가 맞춤 협업</strong><p>작가의 의도를 반영한 맞춤 디자인</p></div>
                  </div>
                  <HubLink className={s("text-link")} href="/titleroe">TitleRoe 의뢰하기 -&gt;</HubLink>
                </div>
                <div className={s("detail-visual")}>
                  <Image unoptimized src="/images/s3.png" alt="TitleRoe example" width={1099} height={1060} />
                </div>
              </article>
            </div>
          </section>
      
          <section id="portfolio" className={s("section band-04")}>
            <div className={s("portfolio-top reveal")}>
              <div>
                <span className={s("label")}>Portfolio</span>
                <h2>실제 작업 사례</h2>
              </div>
              <HubLink className={s("btn btn-secondary")} href="/portfolio">포트폴리오 전체 보기 -&gt;</HubLink>
            </div>
      
            <div className={s("portfolio-grid")}>
              <HubLink className={s("portfolio-item reveal")} href="/portfolio">
                <Image unoptimized src="/hub/portfolio/product-pedestal-hero.png" alt="Bold campaign portfolio" width={768} height={1376} />
                <span>PRODUCT</span>
              </HubLink>
              <HubLink className={s("portfolio-item reveal")} href="/portfolio">
                <Image unoptimized src="/hub/portfolio/product-clean-stand.png" alt="Clean commerce portfolio" width={825} height={1024} />
                <span>PRODUCT</span>
              </HubLink>
              <HubLink className={s("portfolio-item reveal")} href="/portfolio">
                <Image unoptimized src="/hub/portfolio/product-everyday-surface.png" alt="Soft lifestyle portfolio" width={848} height={1264} />
                <span>PRODUCT</span>
              </HubLink>
              <HubLink className={s("portfolio-item reveal")} href="https://titleroe-portfolio.piethesweetpie.workers.dev/">
                <Image unoptimized src="/images/titleroe-portfolio/home-title-portfolio-1.jpg" alt="TitleRoe painted romance cover portfolio" width={896} height={1200} />
                <span>TITLE</span>
              </HubLink>
              <HubLink className={s("portfolio-item reveal")} href="https://titleroe-portfolio.piethesweetpie.workers.dev/">
                <Image unoptimized src="/images/titleroe-portfolio/home-title-portfolio-2.jpg" alt="TitleRoe illustrated novel cover portfolio" width={896} height={1200} />
                <span>TITLE</span>
              </HubLink>
              <HubLink className={s("portfolio-item reveal")} href="https://titleroe-portfolio.piethesweetpie.workers.dev/">
                <Image unoptimized src="/images/titleroe-portfolio/home-title-portfolio-3.jpg" alt="TitleRoe painted character cover portfolio" width={896} height={1200} />
                <span>TITLE</span>
              </HubLink>
            </div>
          </section>
      
          <section className={s("faq-band band-05")}>
            <div className={s("section faq-grid")}>
              <div className={s("faq-side reveal")}>
                <span className={s("label")}>FAQ</span>
                <h2>자주 묻는 질문</h2>
                <p>추가 문의는 각 서비스 페이지에서.</p>
              </div>
              <div className={s("reveal")}>
                <div className={s(openFaqIndex === 0 ? "faq-item is-open" : "faq-item")}>
                  <button className={s("faq-button")} type="button" aria-expanded={openFaqIndex === 0} onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}>ONROE AI Studio에서는 어떤 작업을 의뢰할 수 있나요?<span>{openFaqIndex === 0 ? "-" : "+"}</span></button>
                  <div className={s("faq-answer")}>상품 사진을 브랜드 무드에 맞는 화보형 비주얼로 연출하거나, 모델 촬영 없이 AI 인물 비주얼을 제작할 수 있습니다. 제품 이미지, 상세페이지 컷, SNS 광고 이미지, 브랜드 캠페인용 비주얼까지 목적에 맞게 구성해드립니다.</div>
                </div>
                <div className={s(openFaqIndex === 1 ? "faq-item is-open" : "faq-item")}>
                  <button className={s("faq-button")} type="button" aria-expanded={openFaqIndex === 1} onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}>ProductRoe, CharacterRoe, TitleRoe는 어떻게 다른가요?<span>{openFaqIndex === 1 ? "-" : "+"}</span></button>
                  <div className={s("faq-answer")}>ProductRoe는 상품 중심의 제품 이미지와 브랜드 화보 제작에 적합합니다. CharacterRoe는 인물, 캐릭터, AI 모델 비주얼 제작에 어울리며, TitleRoe는 웹소설 표지나 브랜드 타이틀처럼 시선을 끄는 메인 비주얼 제작에 적합합니다.</div>
                </div>
                <div className={s(openFaqIndex === 2 ? "faq-item is-open" : "faq-item")}>
                  <button className={s("faq-button")} type="button" aria-expanded={openFaqIndex === 2} onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}>원본 사진은 꼭 필요한가요?<span>{openFaqIndex === 2 ? "-" : "+"}</span></button>
                  <div className={s("faq-answer")}>상품 작업의 경우 실제 제품 사진이나 패키지 정면컷이 있으면 결과물의 정확도가 높아집니다. 이미지가 부족한 경우에도 원하는 방향과 레퍼런스를 바탕으로 제작 가능 여부를 안내드립니다.</div>
                </div>
                <div className={s(openFaqIndex === 3 ? "faq-item is-open" : "faq-item")}>
                  <button className={s("faq-button")} type="button" aria-expanded={openFaqIndex === 3} onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}>원하는 분위기나 레퍼런스를 전달할 수 있나요?<span>{openFaqIndex === 3 ? "-" : "+"}</span></button>
                  <div className={s("faq-answer")}>가능합니다. 원하는 색감, 무드, 배경, 조명, 스타일 레퍼런스를 함께 전달해주시면 브랜드 방향에 맞춰 이미지 톤을 설계합니다. 미니멀, 럭셔리, 내추럴, 모던, 시크, 키치 등 다양한 무드로 제작할 수 있습니다.</div>
                </div>
                <div className={s(openFaqIndex === 4 ? "faq-item is-open" : "faq-item")}>
                  <button className={s("faq-button")} type="button" aria-expanded={openFaqIndex === 4} onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}>상세페이지나 광고 이미지로도 사용할 수 있나요?<span>{openFaqIndex === 4 ? "-" : "+"}</span></button>
                  <div className={s("faq-answer")}>네. 제작된 이미지는 상세페이지, 자사몰, SNS 콘텐츠, 광고 소재, 브랜드 소개 이미지 등 다양한 채널에 맞춰 활용할 수 있습니다. 사용 목적을 알려주시면 그에 맞는 비율과 구성으로 제안드립니다.</div>
                </div>
              </div>
            </div>
          </section>
      
          <section className={s("section final reveal band-06")}>
            <span className={s("label")}>Start Here</span>
            <h2>What do you<br /><span>need today?</span></h2>
            <p>판매할 이미지, 기억될 캐릭터, 클릭되는 표지.<br />필요한 비주얼부터 선택해 주세요.</p>
            <div className={s("actions")} style={{ justifyContent: "center" }}>
              <HubLink className={s("btn btn-primary")} href="/productroe">ProductRoe -&gt;</HubLink>
              <HubLink className={s("btn btn-secondary")} href="/characterroe">CharacterRoe -&gt;</HubLink>
              <HubLink className={s("btn btn-secondary")} href="/titleroe">TitleRoe -&gt;</HubLink>
            </div>
          </section>
        </main>
      
        <footer>
          <div className={s("footer-inner")}>
            <div className={s("footer-top")}>
              <div>
                <div className={s("footer-brand")}>ONROE</div>
                <div className={s("footer-sub")}>AI Studio for Brand & <HubLink href="/client">Story</HubLink></div>
              </div>
              <div className={s("footer-links")}>
                <HubLink href="/productroe">ProductRoe</HubLink>
                <HubLink href="/characterroe">CharacterRoe</HubLink>
                <HubLink href="/titleroe">TitleRoe</HubLink>
                <HubLink href="/portfolio">Portfolio</HubLink>
              </div>
            </div>
            <div className={s("footer-line")}></div>
            <div className={s("footer-bottom")}>
              <p><HubLink href="/admin">©</HubLink> 2026 ONROE</p>
              <HubLink href="mailto:onroeway@gmail.com">onroeway@gmail.com</HubLink>
            </div>
          </div>
        </footer>
    </div>
  )
}
