"use client";

export default function HeroBanner({
  targetScrollId = "products",
  className = "",
  containerClassName = "",
}) {
  const handleScroll = () => {
    const el = document.getElementById(targetScrollId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className={`relative w-full bg-[#f4faf0] dark:bg-[#0b1120] overflow-hidden ${containerClassName}`}
    >
      <div className={`relative w-full max-w-[1440px] mx-auto ${className}`}>
        {/* Banner image wrapper with responsive 16:9 aspect ratio */}
        <div
          className="relative w-full aspect-[16/9] cursor-pointer select-none overflow-hidden"
          onClick={handleScroll}
        >
          {/* Main Hero Image */}
          <img
            src="/hero-banner.jpg"
            alt="Fresh products. Direct from farmers. Buy farm products directly from farmers and support local agriculture."
            className="w-full h-full object-cover block"
          />

          {/* Clickable button overlay over 'Explore Products' without green outline ring */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleScroll();
            }}
            className="absolute left-1/2 -translate-x-1/2 top-[66.5%] -translate-y-1/2 w-[28%] max-w-[240px] h-[11%] max-h-[52px] rounded-full cursor-pointer outline-none border-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none bg-transparent"
            aria-label="Explore Products"
          />
        </div>
      </div>
    </section>
  );
}
