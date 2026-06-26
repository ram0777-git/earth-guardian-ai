"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "outline-light";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  magnetic?: boolean;
}

const variants = {
  primary: cn(
    "relative overflow-hidden text-white",
    "bg-gradient-to-r from-primary via-primary-light to-cyan bg-[length:200%_100%]",
    "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-cyan/25",
    "animate-gradient-shift hover:brightness-110"
  ),
  secondary:
    "glass text-primary hover:bg-white/80 hover:shadow-lg hover:shadow-primary/10",
  ghost: "text-primary hover:bg-primary/5",
  outline: cn(
    "border-2 border-white/20 text-white backdrop-blur-sm",
    "hover:border-cyan/50 hover:bg-white/5 hover:shadow-[0_0_24px_rgba(0,188,212,0.2)]"
  ),
  "outline-light": cn(
    "border-2 border-primary/30 text-primary backdrop-blur-sm",
    "hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10"
  ),
};

const sizes = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-6 py-3 text-base rounded-2xl",
  lg: "px-8 py-4 text-lg rounded-2xl",
};

function ButtonContent({
  children,
  variant,
  ripples,
}: {
  children: ReactNode;
  variant: ButtonProps["variant"];
  ripples: { x: number; y: number; id: number }[];
}) {
  return (
    <>
      {variant === "primary" && (
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer opacity-0 transition-opacity duration-300 hover:opacity-100" />
      )}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute animate-ripple rounded-full bg-white/30"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 8,
            height: 8,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
  magnetic = true,
  onClick,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-shadow duration-300",
    variants[variant],
    sizes[size],
    disabled && "pointer-events-none opacity-50",
    className
  );

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!magnetic || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
    ref.current.style.transform = `translate(${x}px, ${y}px) scale(1.03)`;
  };

  const onMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0, 0) scale(1)";
  };

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const id = Date.now();
      setRipples((prev) => [
        ...prev,
        { x: e.clientX - rect.left, y: e.clientY - rect.top, id },
      ]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }
    onClick?.(e as MouseEvent<HTMLButtonElement>);
  };

  if (href) {
    return (
      <motion.div whileTap={{ scale: 0.97 }} className="inline-block">
        <Link
          href={href}
          ref={ref}
          className={classes}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onClick={handleClick}
        >
          <ButtonContent variant={variant} ripples={ripples}>
            {children}
          </ButtonContent>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      className={classes}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      aria-label={rest["aria-label"]}
    >
      <ButtonContent variant={variant} ripples={ripples}>
        {children}
      </ButtonContent>
    </motion.button>
  );
}
