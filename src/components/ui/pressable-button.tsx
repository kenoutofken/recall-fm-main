import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

type PressableButtonProps = HTMLMotionProps<"button">;

const pressTransition = {
  type: "spring",
  stiffness: 560,
  damping: 20,
  mass: 0.6,
} as const;

const PressableButton = React.forwardRef<HTMLButtonElement, PressableButtonProps>(
  ({ className, type, whileTap, transition, ...props }, ref) => (
    <motion.button
      ref={ref}
      type={type ?? "button"}
      whileTap={whileTap ?? { scale: 0.94, y: 1.5 }}
      transition={transition ?? pressTransition}
      className={cn("touch-manipulation will-change-transform", className)}
      {...props}
    />
  ),
);

PressableButton.displayName = "PressableButton";

export { PressableButton };
