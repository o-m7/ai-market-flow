import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Always redirect to dashboard on landing
    navigate("/dashboard");
  }, [navigate]);
  
  return null;
};

export default Index;
