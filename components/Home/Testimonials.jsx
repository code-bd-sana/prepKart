import { Mail } from "lucide-react";
import { HiStar } from "react-icons/hi2";
import { MdOutlineHandshake } from "react-icons/md";

const testimonials = [
  {
    name: "Talia Renwick",
    location: "Montreal",
    rating: 5,
    quote: "PrepCart helped me stop overspending and wasting food. I save money and I'm finally cooking meals my family actually enjoys.",
  },
  {
    name: "Reese Calder",
    location: "Toronto",
    rating: 5,
    quote: "As a working professional, I don't have time to plan meals. The quick recipes and ready-made lists make my week so much easier.",
  },
  {
    name: "Keiran Sloane",
    location: "Ottawa",
    rating: 5,
    quote: "We're a household of five, and meal planning used to be chaos. PrepCart keeps everything organized — the budget tools and grocery lists are game changers.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-6 md:py-16 bg-[linear-gradient(to_bottom,rgba(140,198,60,0.1),rgba(74,159,216,0.1))]">
      <div className="container mx-auto px-4 max-w-[1300px]">
        {/* Header - Updated to match requirement */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1E1E1E] mb-3">
            Prepcart — Smart Meal Planning for Canadians
          </h2>
          <p className="text-base text-[#666666]">
            Personalized weekly meals, smart grocery lists, and budget tools designed to help Canadians cook better, waste less, and save more.
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              {/* Stars */}
              <div className="flex gap-1 text-yellow-400 mb-4">
                {Array(item.rating)
                  .fill(0)
                  .map((_, i) => (
                    <HiStar key={i} className="text-xl" />
                  ))}
              </div>

              {/* Quote */}
              <p className="text-gray-800 italic mb-6">&quot;{item.quote}&quot;</p>

              {/* Name + Location */}
              <p className="font-semibold">— {item.name}</p>
              <p className="text-gray-500 text-sm">{item.location}</p>
            </div>
          ))}
        </div>

        {/* CTA Section - Updated with exact text */}
        <div className="mt-20 text-center">
          <a
            href="#"
            className="inline-flex items-center justify-center bg-[#4a9fd8] text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-[#3a8fc8] transition-colors"
          >
            Join Canadians simplifying their week →
          </a>
        </div>

        {/* Partners Section */}
        <div
          className="mt-20 bg-white rounded-2xl px-8 md:px-12 py-5 text-center max-w-[700px] mx-auto shadow-xl"
          id="partners"
        >
          <div className="text-center">
            <MdOutlineHandshake className="inline-flex mx-auto text-[60px] bg-[#4a9fd8] text-white p-1.5 rounded-full mb-2" />
            <h3 className="text-xl md:text-2xl font-semibold mb-3">
              Become a Partner
            </h3>
            <p className="text-base md:text-sm mb-6 opacity-95">
              Are you a local farmer or grocery store interested in partnering with Prepcart?
            </p>
            <div className="flex justify-center items-center gap-2 underline">
              <Mail className="h-5 w-5" />
              <p>info@prepcart.ca</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}