import "./Home.css";

import DashboardPreview from "../../components/DashboardPreview/DashboardPreview";
import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import Features from "../../components/Features/Features";
import HowItWorks from "../../components/HowItWorks/HowItWorks";
import Pricing from "../../components/Pricing/Pricing";
import Footer from "../../components/Footer/Footer";

function Home() {
  return (
    <>
      <Navbar />

      <section id="home">
        <Hero />
      </section>

      <section id="features">
        <Features />
      </section>

      <section id="pricing">
        <Pricing />
      </section>

      <section id="about">
        <HowItWorks />
      </section>

      <DashboardPreview />

      <Footer />
    </>
  );
}

export default Home;