import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative mt-20 w-full overflow-hidden bg-primary py-32">
      {/* Deep AmEx Blue base + rich gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#000] via-primary to-[#000] opacity-90" />

      {/* Cinematic pattern */}
      <div
        className="absolute inset-0 rotate-[-2deg] scale-110 transform-gpu opacity-50 mix-blend-overlay"
        style={{
          backgroundImage: `url('/patterns/amex-2.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "contrast(1.5) brightness(0.8)",
        }}
      />

      <motion.div
        className="container relative z-10 mx-auto max-w-5xl px-4"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
      >
        <div className="relative flex flex-col items-center justify-between gap-12 overflow-hidden rounded-[3rem] border border-white/20 bg-black/20 p-12 shadow-2xl md:flex-row md:p-20">
          {/* Inner pattern accent */}
          <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-[url('/patterns/amex-3.avif')] bg-cover opacity-10 mix-blend-plus-lighter" />

          {/* Left content */}
          <div className="relative z-10 space-y-6 text-center md:w-2/3 md:text-left">
            <h2 className="font-black text-4xl text-white leading-[1.1] tracking-tighter drop-shadow-md md:text-6xl">
              Ready to modernize <br className="hidden md:block" />
              your operations?
            </h2>
            <p className="mx-auto max-w-xl font-medium text-white/80 text-xl leading-relaxed drop-shadow-sm md:mx-0 md:text-2xl">
              Join the high-performance teams already using Ensemble to
              streamline their workflow.
            </p>
          </div>

          {/* Right CTA */}
          <div className="relative z-10 flex justify-center md:w-1/3 md:justify-end">
            <Link className="group" to="/teams/register">
              <div className="relative inline-flex h-20 items-center gap-4 overflow-hidden rounded-full bg-white px-10 font-black text-primary text-xl shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-white/30">
                <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10">Enroll Today</span>
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
