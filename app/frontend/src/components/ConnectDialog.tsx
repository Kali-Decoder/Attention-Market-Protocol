import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Wallet2 } from "lucide-react";

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectWallet: () => void;
}

export default function ConnectDialog({ open, onOpenChange, connectWallet }: ConnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121212] text-white">
        <DialogTitle>Login to your account</DialogTitle>
        <div className="flex flex-col gap-4 mt-4">
          <button
            onClick={connectWallet}
            className="w-full flex items-center gap-2 justify-center border rounded-lg px-8 py-2 bg-[#161617] text-white hover:bg-[#121212] transition-all"
          >
            <Wallet2 className="h-5 w-5"/>
            <span>Connect Solana Wallet</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 