import React from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

interface OptionsDisplayProps {
  options: string[];
  correctAnswer: string;
  selectedOption?: string;
  onOptionSelect?: (option: string) => void;
  isPlayerMode?: boolean;
  disabled?: boolean;
}

export function OptionsDisplay({ 
  options, 
  correctAnswer, 
  selectedOption, 
  onOptionSelect, 
  isPlayerMode = false,
  disabled = false 
}: OptionsDisplayProps) {
  const getOptionStyle = (option: string) => {
    if (disabled) {
      // Answer reveal mode
      if (option === correctAnswer) {
        return "bg-green-500 text-white border-green-500";
      } else if (selectedOption === option) {
        return "bg-red-500 text-white border-red-500";
      } else {
        return "bg-gray-100 text-gray-900";
      }
    } else {
      // Selection mode
      if (selectedOption === option) {
        return "bg-blue-600 text-white border-blue-600";
      } else {
        return "bg-gray-100 text-gray-900 hover:bg-gray-200";
      }
    }
  };

  return (
    <div className={`space-y-3 ${isPlayerMode ? "" : "space-y-4"}`}>
      {options.map((option, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            delay: index * 0.1
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => onOptionSelect?.(option)}
            variant={selectedOption === option ? "default" : "outline"}
            className={`w-full text-lg p-4 h-auto transition-colors duration-300 ${getOptionStyle(option)}`}
            disabled={disabled}
          >
            {option}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
