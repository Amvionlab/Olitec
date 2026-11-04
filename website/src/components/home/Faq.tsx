"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { faqs } from "@/content/home";
import { cn } from "@/lib/cn";
import { HomeContainer, SectionTitle } from "./primitives";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="mt-16 scroll-mt-6 xl:mt-[101px]" aria-labelledby="faq-title">
      <HomeContainer className="flex flex-col gap-10 lg:flex-row lg:items-start xl:gap-0 xl:pr-[83px]">
        <div className="lg:w-[446px] lg:shrink-0 lg:pt-[10px]">
          <SectionTitle id="faq-title" className="max-w-[398px]">
            Frequently Asked Questions
          </SectionTitle>
          <div className="relative mt-6 hidden h-[459px] lg:block xl:mt-0" aria-hidden>
            <Image src="/images/home/icons/faq-bubble-small.svg" alt="" width={98} height={104} className="absolute left-[288px] top-0 h-[104px] w-[97.16px]" />
            <Image src="/images/home/icons/faq-bubble-large.svg" alt="" width={350} height={374} className="absolute left-0 top-[85px] h-[373.68px] w-[349.12px]" />
          </div>
        </div>

        <ul className="flex-1 space-y-[18px]">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            const panelId = `${baseId}-panel-${index}`;
            return (
              <li key={index} className="rounded-[30px] bg-[rgb(230_230_230/0.4)]">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className={cn("flex w-full items-center justify-between gap-4 px-5 text-left sm:pl-[32px] sm:pr-[57px]", isOpen ? "pt-[32px]" : "py-[32px] xl:py-[33px]")}
                  >
                    <span className="whitespace-pre-wrap text-[20px] font-semibold leading-[30px] text-black sm:text-[28.164px] sm:leading-[39.116px]">
                      {`${String(index + 1).padStart(2, "0")}/  ${faq.question}`}
                    </span>
                    <span className={cn("flex size-[46px] shrink-0 items-center justify-center rounded-full transition-colors", isOpen ? "bg-black" : "bg-[#e2e5e6]")}>
                      <Image
                        src={isOpen ? "/images/home/icons/arrow-right-white.svg" : "/images/home/icons/arrow-right-faq.svg"}
                        alt=""
                        width={24}
                        height={18}
                        className={cn("h-[17.53px] w-[23.59px] transition-transform", isOpen && "rotate-90")}
                      />
                    </span>
                  </button>
                </h3>
                <div id={panelId} role="region" hidden={!isOpen} className="px-5 pb-[29px] pt-[19px] sm:pl-[94px] sm:pr-[57px]">
                  <p className="text-base font-medium leading-[25px] text-black">{faq.answer}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </HomeContainer>
    </section>
  );
}
