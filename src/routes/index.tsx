import { createFileRoute } from "@tanstack/react-router";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { IntroReveal } from "@/components/marketing/intro-reveal";
import { Hero } from "@/components/marketing/hero";
import { ChaosSection } from "@/components/marketing/chaos-section";
import { ChangeToConfidence } from "@/components/marketing/change-to-confidence";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { ScanDial } from "@/components/marketing/scan-dial";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ArchitectureSection } from "@/components/marketing/architecture-section";
import { GraphTeaser } from "@/components/marketing/graph-teaser";
import { Pricing } from "@/components/marketing/pricing";
import { CtaSection } from "@/components/marketing/cta-section";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen bg-background">
      <IntroReveal />
      <MarketingNav />
      <main>
        <Hero />
        <ChaosSection />
        <ChangeToConfidence />
        <FeatureGrid />
        <ScanDial />
        <HowItWorks />
        <ArchitectureSection />
        <GraphTeaser />
        <Pricing />
        <CtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
