import { MessageCircle } from "lucide-react";
import { MdOutlineHandshake } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import {
  FaFacebook,
  FaInstagram,
  FaPinterest,
  FaTwitter,
} from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

const Footer = () => {
  const params = useParams();
  const locale = params.locale;
  const t = useTranslations("footer");

  const createGmailLink = (email, subject = "", body = "") => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodedSubject}&body=${encodedBody}`;
  };

  const socialLinks = [
    {
      icon: FaFacebook,
      href: "https://www.facebook.com/profile.php?id=61585561839977",
      label: t("social.facebook"),
    },
    {
      icon: FaInstagram,
      href: "https://www.instagram.com/prepcart1/",
      label: t("social.instagram"),
    },
    {
      icon: FaPinterest,
      href: "https://www.pinterest.com/Prepcart/",
      label: t("social.pinterest"),
    },
  ];

  const footerLinks = {
    home: [
      { label: t("links.howItWorks"), href: "/#howitworks" },
      { label: t("links.pricing"), href: "/#pricing" },
      { label: t("links.recipes"), href: "/#recipes" },
      { label: t("links.partners"), href: "/#partners" },
    ],
    legal: [
      { name: t("links.terms"), href: `/${locale}/legal-terms-policy` },
      { name: t("links.privacy"), href: `/${locale}/legal-terms-policy` },
    ],
    // help: [
    //   { name: t("links.support"), href: "/#support" },
    //   { name: t("links.contact"), href: "/#contact" },
    // ],

    help: [
      {
        name: t("links.support"),
        // Opens in Gmail Web
        href: createGmailLink(
          "info@prepcart.ca",
          "Support Request",
          "Hello Prepcart Team,",
        ),
        target: "_blank",
        rel: "noopener noreferrer",
      },
      {
        name: t("links.contact"),
        href: "mailto:info@prepcart.ca?subject=Contact Request",
      },
    ],
  };

  return (
    <footer className='w-full bg-[#fafff3] py-8 md:py-10'>
      <div className='mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8'>
        {/* Footer Content */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6'>
          {/* Logo - Takes 2 columns on lg */}
          <div className='md:col-span-2 lg:col-span-2'>
            <Link href='/' className='inline-block'>
              <Image
                src='/logo1.png'
                alt='logo'
                width={180}
                height={60}
                className='cursor-pointer w-36 lg:w-44 h-auto'
                priority
              />
            </Link>
            <p className='text-gray-600 text-sm mt-3 lg:mt-4 pl-1'>
              {t("tagline")}
            </p>
          </div>

          {/* Company Links */}
          <div>
            <p className='font-semibold text-gray-800 mb-4'>{t("company")}</p>
            <ul className='space-y-3'>
              {footerLinks.home.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className='text-gray-600 hover:text-teal-600 transition-colors duration-200 text-sm inline-block hover:translate-x-1'>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <p className='font-semibold text-gray-800 mb-4'>{t("legal")}</p>
            <ul className='space-y-3'>
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className='text-gray-600 hover:text-teal-600 transition-colors duration-200 text-sm inline-block hover:translate-x-1'>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help and Follow Us Side by Side - Takes 2 columns on lg */}
          <div className='md:col-span-2 lg:col-span-2'>
            <div className='grid grid-cols-2 gap-6 lg:gap-8'>
              {/* Help Links */}
              <div>
                <p className='font-semibold text-gray-800 mb-4'>{t("help")}</p>
                <ul className='space-y-3'>
                  {footerLinks.help.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        target={link.target || "_self"}
                        rel={link.rel || ""}
                        className='text-gray-600 hover:text-teal-600 transition-colors duration-200 text-sm inline-block hover:translate-x-1'>
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Follow Us Column */}
              <div>
                <p className='font-semibold text-gray-800 mb-4'>
                  {t("followUs")}
                </p>
                <div className='flex gap-3'>
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target='_blank'
                      className='h-10 w-10 rounded-full bg-white shadow-sm hover:shadow-md flex items-center justify-center text-gray-600 hover:text-teal-600 transition-all duration-300 hover:-translate-y-0.5'
                      aria-label={social.label}>
                      <social.icon className='h-5 w-5' />
                    </a>
                  ))}
                </div>
                <p className='text-gray-600 text-sm mt-3 lg:mt-4 pl-1'>
                  Phone:{" "}
                  <a href='tel:+14505251786' className='hover:text-teal-600'>
                    450-525-1786
                  </a>
                </p>
                <p className='text-gray-600 text-sm mt-3 lg:mt-4 pl-1 '>
                  Email:{" "}
                  <a
                    href='mailto:info@prepcart.ca'
                    className='underline hover:text-teal-600'>
                    info@prepcart.ca
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className='my-8 lg:my-10 border-t border-gray-200'></div>

        {/* Copyright */}
        <div className='flex justify-center items-center gap-2'>
          <p className='text-gray-500 text-sm text-center sm:text-left order-2 sm:order-1'>
            {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
