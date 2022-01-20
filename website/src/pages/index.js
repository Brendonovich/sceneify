import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import styles from "./index.module.css";
import HomepageFeatures from "../components/HomepageFeatures";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            style={{ width: "10rem" }}
            src={`${siteConfig.baseUrl}img/logo.svg`}
            alt="logo"
          />
          <h1
            style={{
              marginLeft: "2rem",
              marginTop: "0.5rem",
              fontSize: "4rem",
              fontWeight: 800,
            }}
            // className="hero__title"
          >
            {siteConfig.title}
          </h1>
        </div>
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "2rem",
            opacity: 0.7,
          }}
        >
          <i>{siteConfig.tagline}</i>
        </p>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout
      description="The easiest way to control OBS from JavaScript"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
