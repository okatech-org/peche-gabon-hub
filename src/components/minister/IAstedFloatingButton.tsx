import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IAstedButton from "./IAstedButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IAstedChat } from "./IAstedChat";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

export function IAstedFloatingButton() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const navigate = useNavigate();

  const handleButtonClick = () => {
    setIsPopupOpen(true);
  };

  const handleGoToFullPage = () => {
    setIsPopupOpen(false);
    navigate("/minister-dashboard/iasted");
  };

  return (
    <>
      <IAstedButton 
        onClick={handleButtonClick}
        size="lg"
      />

      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">iAsted - Assistant Vocal</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoToFullPage}
                  className="gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  Mode plein écran
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6 py-4">
            <IAstedChat />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
