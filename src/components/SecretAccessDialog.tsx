import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SecretAccessDialog = ({ open, onOpenChange }: Props) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "20032021") {
      onOpenChange(false);
      setPin("");
      setError(false);
      navigate("/s-area");
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setPin(""); setError(false); }}>
      <DialogContent className="max-w-[320px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Verificação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Código"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            autoFocus
            className="text-center text-lg tracking-widest"
          />
          {error && <p className="text-destructive text-xs text-center">Acesso negado</p>}
          <Button type="submit" size="lg">Confirmar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SecretAccessDialog;
