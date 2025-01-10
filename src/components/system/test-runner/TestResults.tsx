import { Badge } from "@/components/ui/badge";
import TestResultsTable from './TestResultsTable';

interface TestResultsProps {
  results: any[];
}

const TestResults = ({ results }: TestResultsProps) => {
  if (!results.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-dashboard-text">Test Results</h3>
        <Badge 
          variant="outline" 
          className="bg-dashboard-accent3/10 text-dashboard-accent3 border-dashboard-accent3/20"
        >
          {results.length} Tests Completed
        </Badge>
      </div>
      <div className="glass-card p-4 rounded-lg border border-dashboard-cardBorder bg-dashboard-card/50">
        <TestResultsTable 
          results={results} 
          type={results[0]?.test_type || 'system'} 
        />
      </div>
    </div>
  );
};

export default TestResults;