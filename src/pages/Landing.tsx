import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    icon: "🎵",
    title: "Every Song Holds a Moment",
    description:
      "Save the tracks that carry you back to the people, places, and feelings you never want to lose.",
  },
  {
    icon: "📖",
    title: "The People Inside the Music",
    description:
      "Share the songs tied to the friends, family, loves, and seasons that shaped you.",
  },
  {
    icon: "🔍",
    title: "Find What Moves Others",
    description:
      "Discover memories through music, hear the tracks behind them, and find something new to carry with you.",
  },
];

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const Landing = ({ onGetStarted, onSignIn }: LandingProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Carousel */}
        <div className="w-full mb-10 overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 px-2">
                <div className="flex flex-col items-center text-center pt-8">
                  <div className="w-full aspect-square max-h-[40vh] rounded-3xl bg-accent mb-10" />
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                    {slide.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex gap-2 mb-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                selectedIndex === i
                  ? "w-6 bg-foreground"
                  : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get Started
        </button>

        <p className="text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <button
            onClick={onSignIn}
            className="font-semibold text-foreground hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default Landing;
