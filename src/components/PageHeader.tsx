import { ArrowLeft, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  backTo?: string;
}

const PageHeader = ({ title, backTo = "/" }: Props) => {
  const navigate = useNavigate();
  const { toggleTheme, theme } = useTheme();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(backTo)} className="p-2 -ml-2 rounded-xl active:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight uppercase">{title}</h1>
      </div>
      <button 
        onClick={toggleTheme} 
        className="p-2.5 rounded-2xl bg-secondary text-secondary-foreground hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center gap-2"
        title="Trocar Tema"
      >
        <Palette className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase hidden sm:block">{theme}</span>
      </button>
    </div>
  );
};

export default PageHeader;
