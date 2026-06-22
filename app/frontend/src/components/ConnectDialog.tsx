import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Wallet2 } from "lucide-react";

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectWallet: () => void;
}

export default function ConnectDialog({ open, onOpenChange, connectWallet }: ConnectDialogProps) {
  const handleConnect = () => {
    onOpenChange(false)
    void connectWallet()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121212] text-white">
        <DialogTitle>Connect your wallet</DialogTitle>
        <p className="text-sm text-gray-400 mt-1">
          Use Phantom or Solflare on <strong className="text-purple-300">Devnet</strong>.
        </p>
        <div className="flex flex-col gap-4 mt-4">
          <button
            onClick={handleConnect}
            className="w-full flex items-center gap-2 justify-center border border-[#2f2f35] rounded-lg px-8 py-3 bg-[#161617] text-white hover:bg-[#1f1f23] transition-all"
          >
            <Wallet2 className="h-5 w-5" />
            <span>Choose wallet</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 