import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  backTo?: string;
}

const PageHeader = ({ title, backTo = "/" }: Props) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 mb-6">
      <button onClick={() => navigate(backTo)} className="p-2 -ml-2 rounded-xl active:bg-secondary transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
    </div>
  );
};

export default PageHeader;
