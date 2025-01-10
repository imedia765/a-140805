import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTestRunner = () => {
  const [testLogs, setTestLogs] = useState<string[]>(['Test runner initialized and ready']);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  const runAllTests = async () => {
    setIsRunning(true);
    setTestLogs(prev => [...prev, '🚀 Starting combined system checks...']);
    setProgress(0);
    
    try {
      const { data, error } = await supabase.rpc('run_combined_system_checks');

      if (error) {
        console.error('Test run error:', error);
        throw new Error(`Failed to run system checks: ${error.message}`);
      }

      console.log('Combined system checks results:', data);

      // Process and categorize results
      const processedResults = data.map((result: any) => ({
        ...result,
        test_name: result.metric_name || result.check_type,
        test_type: result.test_category
      }));

      setTestResults(processedResults);
      setProgress(100);
      setCurrentTest('All checks complete');
      toast.success('System checks completed successfully');
      
      return processedResults;
    } catch (error: any) {
      console.error('System checks error:', error);
      setTestLogs(prev => [...prev, `❌ Error running checks: ${error.message}`]);
      toast.error("System checks failed");
      throw error;
    } finally {
      setIsRunning(false);
    }
  };

  const runTestsMutation = useMutation({
    mutationFn: runAllTests,
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      setTestLogs(prev => [...prev, `❌ Error: ${error.message}`]);
      setProgress(0);
      setCurrentTest('Test run failed');
    }
  });

  useQuery({
    queryKey: ['test-logs'],
    queryFn: async () => {
      const channel = supabase
        .channel('test-logs')
        .on('broadcast', { event: 'test-log' }, ({ payload }) => {
          if (payload?.message) {
            setTestLogs(prev => [...prev, `📝 ${payload.message}`]);
          }
          if (payload?.progress) {
            setProgress(payload.progress);
          }
          if (payload?.currentTest) {
            setCurrentTest(payload.currentTest);
          }
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    },
    enabled: isRunning
  });

  return {
    testLogs,
    isRunning,
    progress,
    currentTest,
    testResults,
    runTestsMutation
  };
};