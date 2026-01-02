// components/common/MountReveal.jsx
import { motion } from "framer-motion";

const MountReveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.35,
      delay,
      ease: "easeOut",
    }}
  >
    {children}
  </motion.div>
);

export default MountReveal;
