import { motion } from "framer-motion";
import { Container } from "../components/ui/container";
import { InRoundContent } from "./inRoundContent";

export default function InRound() {
  return (
    <Container variant="page">
      <motion.div
        layout
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        className="w-full max-w-4xl text-center space-y-6"
      >
        <InRoundContent />
      </motion.div>
    </Container>
  );
}