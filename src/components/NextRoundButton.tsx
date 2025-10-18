import { useGameStore } from "../store";
import { Button } from "./ui/button";

interface NextRoundButtonProps {
  isPlayerMode?: boolean;
}

export function NextRoundButton({ isPlayerMode = false }: NextRoundButtonProps) {
  const { serverState, serverAction } = useGameStore();

  const handleNextRound = () => {
    serverAction("nextRound");
  };

  const isLastRound = serverState.currentRound >= serverState.rounds.length;
  const buttonText = isLastRound ? "Finish Game" : "Next Round";

  return (
    <Button 
      onClick={handleNextRound} 
      size={isPlayerMode ? "default" : "lg"}
      className="bg-warm-orange hover:bg-warm-orange/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
    >
      {buttonText}
    </Button>
  );
}
