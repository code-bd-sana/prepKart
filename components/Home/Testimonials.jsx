import { Mail } from "lucide-react";
import { HiStar } from "react-icons/hi2";
import { MdOutlineHandshake } from "react-icons/md";

const testimonials = [
  {
    name: "Sarah M.",
    location: "Toronto, ON",
    rating: 5,
    quote: "Prepkart saved me hours every week!",
  },
  {
    name: "Jean-Pierre L.",
    location: "Montreal, QC",
    rating: 5,
    quote: "Perfect for our Montreal family on a budget.",
  },
  {
    name: "Priya K.",
    location: "Vancouver, BC",
    rating: 4,
    quote: "The AI meal plans are so personalized and delicious!",
  },
];

export default function Testimonials() {
  return (
    <section className="py-6 md:py-16 bg-[linear-gradient(to_bottom,rgba(140,198,60,0.1),rgba(74,159,216,0.1))]">
      <div className="container mx-auto px-4 max-w-[1300px]">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1E1E1E] mb-3">
            What Canadians are Saying
          </h2>
          <p className="text-base text-[#666666]">
            Join Thosands of Happy Meal Planners!
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
              <p className="text-gray-800 italic mb-6">“{item.quote}”</p>

              {/* Name + Location */}
              <p className="font-semibold">{item.name}</p>
              <p className="text-gray-500 text-sm">{item.location}</p>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
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
              Are you local farmer or Grocery Store interested in Partnering
              with PrepKART?
            </p>
            <div className="flex justify-center items-center gap-2 underline">
              <Mail className="h-5 w-5" />
              <p>info@prepkart.ca</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
