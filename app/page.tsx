"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, type ReactNode } from "react"
import styles from "./page.module.css"

const styleMap = styles as Record<string, string>

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
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]")
    const scrolledClass = styleMap["is-scrolled"]
    const visibleClass = styleMap["is-visible"]
    const openClass = styleMap["is-open"]

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

    const faqButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-faq-button]"))
    const faqCleanups = faqButtons.map((button) => {
      const onClick = () => {
        const item = button.parentElement
        const isOpen = item?.classList.toggle(openClass) ?? false
        const indicator = button.querySelector("span")
        if (indicator) indicator.textContent = isOpen ? "-" : "+"
      }

      button.addEventListener("click", onClick)
      return () => button.removeEventListener("click", onClick)
    })

    return () => {
      window.removeEventListener("scroll", onScroll)
      revealObserver.disconnect()
      faqCleanups.forEach((cleanup) => cleanup())
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
              <HubLink className={s("client-link")} href="/client">Client <span aria-hidden="true">→</span></HubLink>
              <HubLink className={s("portfolio-nav-link")} href="/portfolio">Portfolio</HubLink>
            </div>
          </div>
        </nav>
      
        <main>
          <section className={s("section hero")}>
            <div className={s("hero-glow-left")} aria-hidden="true"></div>
            <div className={s("hero-glow-right")} aria-hidden="true"></div>
            <div className={s("hero-copy reveal")}>
              <div className={s("eyebrow")}>AI Visual Studio</div>
              <h1>
                <span className={s("hero-title-main")}>ONROE</span>
                <span className={s("hero-title-sub")}>AI Studio</span>
              </h1>
              <p>
                ONROE는 판매와 공개에 필요한 AI 비주얼을 목적에 맞게 설계하는 스튜디오입니다.<br />
                상품 이미지부터 캐릭터 시안, 웹소설 표지까지.
              </p>
              <div className={s("actions")}>
                <HubLink className={s("btn btn-primary")} href="/productroe">ProductRoe -&gt;</HubLink>
                <HubLink className={s("btn btn-secondary")} href="/characterroe">CharacterRoe -&gt;</HubLink>
                <HubLink className={s("btn btn-secondary")} href="/titleroe">TitleRoe -&gt;</HubLink>
              </div>
            </div>
            <div className={s("hero-mark reveal")}>
              <Image unoptimized src="/hub/logo.png" alt="ONROE logo mark" width={550} height={538} />
            </div>
            <div className={s("hero-index")}>01 / 06</div>
          </section>
      
          <section className={s("section section-bordered band-02")}>
            <div className={s("section-head reveal")}>
              <div>
                <span className={s("label")}>Services</span>
                <h2>세 가지 전문 서비스</h2>
              </div>
              <p>목적에 맞는 서비스를 선택하면 필요한 비주얼을 시작할 수 있습니다.</p>
            </div>
      
            <div className={s("service-grid")}>
              <HubLink className={s("service-card reveal")} href="/productroe">
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
      
              <HubLink className={s("service-card reveal")} href="/characterroe">
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
      
              <HubLink className={s("service-card reveal")} href="/titleroe">
                <div className={s("service-image")}>
                  <div className={s("title-placeholder")}>TITLE ROE</div>
                </div>
                <div className={s("service-body")}>
                  <div className={s("meta")}><strong>03</strong><i></i><span>Cover Illustration</span></div>
                  <h3>TitleRoe</h3>
                  <div className={s("tagline")}>For Writers</div>
                  <p>장르와 무드에 맞는 웹소설 표지와 삽화를 제작합니다.</p>
                  <div className={s("target")}>웹소설 작가 · 출간 준비자</div>
                </div>
              </HubLink>
            </div>
          </section>
      
          <section className={s("detail-shell")}>
            <div className={s("section")}>
              <article id="productroe" className={s("detail detail-product reveal")}>
                <div className={s("detail-visual")}>
                  <Image unoptimized src="/hub/portfolio/product-everyday-surface.png" alt="ProductRoe example" width={848} height={1264} />
                </div>
                <div className={s("detail-text")}>
                  <span className={s("label")}>01 · Product Visual · Track A & B</span>
                  <h2>제품을 판매 이미지로<br />바꾸는 AI 상품 비주얼</h2>
                  <p>제품 사진 한 장에서 시작해 브랜드 무드가 담긴 상품 컷, 상세페이지용 이미지, AI 모델 화보까지 제작합니다. 촬영 없이도 제품의 분위기와 사용 장면을 확장합니다.</p>
                  <div className={s("recommend")}>
                    <div className={s("recommend-title")}>이런 분께 추천합니다</div>
                    <ul>
                      <li>상세페이지용 이미지가 부족한 온라인 셀러</li>
                      <li>촬영 없이 브랜드 무드가 있는 상품컷이 필요한 브랜드</li>
                      <li>모델 비용 없이 인물 화보가 필요한 운영자</li>
                    </ul>
                  </div>
                  <div className={s("small-note")}>패키지형 제작으로 운영됩니다.</div>
                  <HubLink className={s("text-link")} href="/productroe">ProductRoe 의뢰하기 -&gt;</HubLink>
                </div>
              </article>
      
              <article id="characterroe" className={s("detail detail-character reveal")}>
                <div className={s("detail-text")}>
                  <span className={s("label")}>02 · Character Design</span>
                  <h2>캐릭터 콘셉트를<br />시각화하는 AI 캐릭터 제작</h2>
                  <p>웹툰, 게임, SNS 콘텐츠에 필요한 캐릭터를 성격, 세계관, 의상, 분위기 정보로 설계해 첫 시안을 제공합니다.</p>
                  <div className={s("recommend")}>
                    <div className={s("recommend-title")}>이런 분께 추천합니다</div>
                    <ul>
                      <li>캐릭터 콘셉트를 빠르게 잡고 싶은 웹툰·게임 기획자</li>
                      <li>시리즈성 SNS 콘텐츠용 캐릭터가 필요한 운영자</li>
                      <li>혼자 기획과 제작을 병행하는 1인 창작자</li>
                    </ul>
                  </div>
                  <HubLink className={s("text-link")} href="/characterroe">CharacterRoe 의뢰하기 -&gt;</HubLink>
                </div>
                <div className={s("detail-visual")}>
                  <Image unoptimized src="/hub/roe2.png" alt="CharacterRoe example" width={989} height={710} style={{ objectPosition: "center top" }} />
                </div>
              </article>
      
              <article id="titleroe" className={s("detail detail-title reveal")}>
                <div className={s("detail-visual")}>
                  <div className={s("title-placeholder")}>TITLE ROE</div>
                </div>
                <div className={s("detail-text")}>
                  <span className={s("label")}>03 · Cover Illustration</span>
                  <h2>작품의 첫인상을 결정하는<br />AI 웹소설 표지</h2>
                  <p>로맨스판타지, 현대로맨스, BL, 현판, 무협, 헌터물 등 장르와 독자층에 맞는 표지 이미지와 삽화, e-book·단행본 표지를 제작합니다.</p>
                  <div className={s("recommend")}>
                    <div className={s("recommend-title")}>이런 분께 추천합니다</div>
                    <ul>
                      <li>합리적 비용으로 표지를 준비하려는 웹소설 작가</li>
                      <li>장르 무드를 정확히 맞추고 싶은 출간 준비자</li>
                      <li>시리즈 통일감이 필요한 작가</li>
                    </ul>
                  </div>
                  <HubLink className={s("text-link")} href="/titleroe">TitleRoe 의뢰하기 -&gt;</HubLink>
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
              <HubLink className={s("portfolio-item reveal")} href="/portfolio">
                <Image unoptimized src="/hub/portfolio/onroestudio-cinematic-hero.png" alt="Cinematic hero portfolio" width={1024} height={572} />
                <span>PRODUCT</span>
              </HubLink>
              <HubLink className={s("portfolio-item reveal")} href="/portfolio">
                <Image unoptimized src="/hub/portfolio/onroestudio-flatlay-clean.png" alt="Flatlay clean portfolio" width={1650} height={2048} />
                <span>PRODUCT</span>
              </HubLink>
              <HubLink className={s("portfolio-item reveal")} href="/portfolio">
                <Image unoptimized src="/hub/portfolio/dasique-linen-window.png" alt="Editorial mood portfolio" width={928} height={1152} />
                <span>PRODUCT</span>
              </HubLink>
            </div>
          </section>
      
          <section className={s("faq-band band-05")}>
            <div className={s("section faq-grid")}>
              <div className={s("faq-side reveal")}>
                <span className={s("label")}>FAQ</span>
                <h2>자주 묻는<br />질문</h2>
                <p>추가 문의는 각 서비스 페이지에서.</p>
              </div>
              <div className={s("reveal")}>
                <div className={s("faq-item")}>
                  <button className={s("faq-button")} type="button" data-faq-button="">AI로 만든 이미지를 상업적으로 사용할 수 있나요?<span>+</span></button>
                  <div className={s("faq-answer")}>서비스별 사용 범위와 조건은 의뢰 전 안내드립니다. 사용 채널과 목적을 함께 남겨 주세요.</div>
                </div>
                <div className={s("faq-item")}>
                  <button className={s("faq-button")} type="button" data-faq-button="">원본 사진이 꼭 필요한가요?<span>+</span></button>
                  <div className={s("faq-answer")}>ProductRoe는 제품 원본 이미지가 있을수록 정확도가 높습니다. CharacterRoe와 TitleRoe는 설명, 레퍼런스, 분위기 정보가 더 중요합니다.</div>
                </div>
                <div className={s("faq-item")}>
                  <button className={s("faq-button")} type="button" data-faq-button="">원하는 스타일을 참고 이미지로 전달할 수 있나요?<span>+</span></button>
                  <div className={s("faq-answer")}>가능합니다. 레퍼런스 이미지나 핀터레스트 링크를 함께 전달하면 무드 설계에 반영됩니다.</div>
                </div>
                <div className={s("faq-item")}>
                  <button className={s("faq-button")} type="button" data-faq-button="">수정도 가능한가요?<span>+</span></button>
                  <div className={s("faq-answer")}>패키지별 기본 수정 범위가 포함되어 있으며, 추가 리터칭은 옵션으로 선택할 수 있습니다.</div>
                </div>
                <div className={s("faq-item")}>
                  <button className={s("faq-button")} type="button" data-faq-button="">작업물 비공개가 가능한가요?<span>+</span></button>
                  <div className={s("faq-answer")}>ProductRoe에는 포트폴리오 비공개 옵션이 있습니다. 의뢰 시 함께 선택해 주세요.</div>
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
                <div className={s("footer-sub")}>AI Studio for Brand & Story</div>
              </div>
              <div className={s("footer-links")}>
                <HubLink href="/productroe">ProductRoe</HubLink>
                <HubLink href="/characterroe">CharacterRoe</HubLink>
                <HubLink href="/titleroe">TitleRoe</HubLink>
                <HubLink href="/portfolio">Portfolio</HubLink>
                <HubLink href="/client">Client</HubLink>
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
