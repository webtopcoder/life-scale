import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/integrations/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function MyReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      try {
        const data = await api.get<Array<{ id: string }>>("/dashboard/reports");
        if (data.length > 0) {
          navigate(`/dashboard/reports/${data[0].id}`, { replace: true });
          return;
        }
      } catch {
        /* fall through */
      }
      setEmpty(true);
      setLoading(false);
    };

    run();
  }, [user, navigate]);

  if (loading && !empty) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-0.5">My Report</h1>
        <p className="text-sm text-muted-foreground">View your completed assessment report</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">No report yet</h3>
          <p className="text-sm text-muted-foreground">Complete a test and purchase your report to see it here.</p>
          <Button size="sm" onClick={() => navigate("/dashboard/tests")}>
            Browse Tests
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
