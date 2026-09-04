"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Главная" },
  { href: "/accounts", label: "Счета" },
  { href: "/debts", label: "Долги" },
  { href: "/currencies/rates", label: "Валюты" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Основная навигация"
      className="border-b border-border bg-muted/60"
    >
      <ul className="mx-auto flex max-w-3xl gap-6 px-4 py-3 text-sm">
        {links.map(({ href, label }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/currencies/rates"
                ? pathname === "/currencies" ||
                  pathname.startsWith("/currencies/")
                : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "text-muted-foreground transition-colors hover:text-foreground",
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
  );
}
