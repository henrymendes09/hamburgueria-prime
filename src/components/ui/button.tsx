import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-flame text-white shadow-[0_4px_0_0_var(--color-flame-dark)] hover:brightness-105 active:translate-y-1 active:shadow-none",
        dark: "bg-ink text-paper shadow-[0_4px_0_0_#000] hover:brightness-125 active:translate-y-1 active:shadow-none",
        outline:
          "border-2 border-ink text-ink bg-transparent hover:bg-ink hover:text-paper",
        ghost: "text-ink hover:bg-ink/5",
        link: "text-flame underline-offset-4 hover:underline",
        white:
          "bg-paper text-ink shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:brightness-95 active:translate-y-1 active:shadow-none",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
