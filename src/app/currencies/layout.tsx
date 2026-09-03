"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/currencies", label: "Валюты" },
  { href: "/currencies/rates", label: "Курсы" },
] as const;

export default function CurrenciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 pt-8">
        <nav aria-label="Раздел валют">
          <ul className="flex gap-2">
            {tabs.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "inline-block px-1 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                      active &&
                        "font-semibold text-foreground underline decoration-2 underline-offset-4",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {children}
    </>
  );
}
