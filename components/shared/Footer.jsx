import { MessageCircle } from "lucide-react";
import { MdOutlineHandshake } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

const Footer = () => {
  const socialLinks = [
    { icon: FaFacebook, href: "#", label: "Facebook" },
    { icon: FaTwitter, href: "#", label: "Twitter" },
    { icon: FaInstagram, href: "#", label: "Instagram" },
    { icon: FaLinkedin, href: "#", label: "LinkedIn" },
  ];

  const footerLinks = {
    home: [
      { label: "How It Works", href: "/#howitworks" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Recipes", href: "/#recipes" },
      { label: "Partners", href: "/#partners" },
    ],
    legal: [
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
    ],
    help: [
      { name: "Support", href: "/" },
      { name: "Contact Us", href: "/" },
    ],
    partners: [{ name: "Become a Partner", href: "/partners" }],
  };

  return (
    <footer className="w-full bg-[#fafff3] py-8 md:py-10">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Logo - Takes 2 columns on lg */}
          <div className="md:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/logo1.png"
                alt="logo"
                width={180}
                height={60}
                className="cursor-pointer w-36 lg:w-44 h-auto"
                priority
              />
            </Link>
            <p className="text-gray-600 text-sm mt-3 lg:mt-4 pl-1">
              &quot;Made for real Canadian households🍁&quot;
            </p>
          </div>

          {/* Company Links */}
          <div>
            <p className="font-semibold text-gray-800 mb-4">Company</p>
            <ul className="space-y-3">
              {footerLinks.home.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-teal-600 transition-colors duration-200 text-sm inline-block hover:translate-x-1"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <p className="font-semibold text-gray-800 mb-4">Legal</p>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-teal-600 transition-colors duration-200 text-sm inline-block hover:translate-x-1"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners and Follow Us Side by Side - Takes 2 columns on lg */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="grid grid-cols-2 gap-6 lg:gap-8">
              {/* Partners Column */}
              {/* <div>
                <div className="flex items-center gap-2 mb-4">
                  <MdOutlineHandshake className="text-2xl text-[#4a9fd8]" />
                  <p className="font-semibold text-gray-800">Partners</p>
                </div>
                <a
                  href="/partners"
                  className="text-gray-600 hover:text-teal-600 transition-colors duration-200 text-sm inline-block hover:translate-x-1"
                >
                  Become a Partner
                </a>
              </div> */}
              {/* Help Links */}
              <div>
                <p className="font-semibold text-gray-800 mb-4">Help</p>
                <ul className="space-y-3">
                  {footerLinks.help.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-gray-600 hover:text-teal-600 transition-colors duration-200 text-sm inline-block hover:translate-x-1"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Follow Us Column */}
              <div>
                <p className="font-semibold text-gray-800 mb-4">Follow Us</p>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      className="h-10 w-10 rounded-full bg-white shadow-sm hover:shadow-md flex items-center justify-center text-gray-600 hover:text-teal-600 transition-all duration-300 hover:-translate-y-0.5"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 lg:my-10 border-t border-gray-200"></div>

        {/* Copyright */}
        <div className="flex justify-center items-center gap-2">
          <p className="text-gray-500 text-sm text-center sm:text-left order-2 sm:order-1">
            © 2025 Prepcart. Made for real Canadian households. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
