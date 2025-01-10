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
    setTestLogs(prev => [...prev, '🚀 Starting all tests...']);
    setProgress(0);
    
    try {
      const testFunctions = [
        { name: 'System Performance', fn: 'check_system_performance', type: 'performance' },
        { name: 'Error Rates', fn: 'check_error_rates', type: 'monitoring' },
        { name: 'Resource Usage', fn: 'check_resource_usage', type: 'monitoring' },
        { name: 'API Health', fn: 'check_api_health', type: 'monitoring' },
        { name: 'User Activity', fn: 'check_user_activity', type: 'security' },
        { name: 'Security Audit', fn: 'audit_security_settings', type: 'security' },
        { name: 'Configuration Check', fn: 'validate_user_roles', type: 'system' },
        { name: 'Member Numbers', fn: 'check_member_numbers', type: 'system' },
        { name: 'Authentication Flow', fn: 'check_auth_flow', type: 'security' },
        { name: 'Critical Code Logic', fn: 'check_critical_logic', type: 'system' },
        { name: 'Role-Based Access', fn: 'check_rbac', type: 'security' },
        { name: 'Data Integrity', fn: 'check_data_integrity', type: 'system' }
      ] as const;

      const results = [];
      let completedTests = 0;

      for (const test of testFunctions) {
        setCurrentTest(`Running ${test.name}...`);
        setTestLogs(prev => [...prev, `📋 Starting ${test.name} test...`]);
        console.log(`Executing test: ${test.name}`);

        try {
          const { data, error } = await supabase.rpc(test.fn);

          if (error) {
            console.error(`Test error for ${test.name}:`, error);
            throw new Error(`${test.name} failed: ${error.message}`);
          }

          console.log(`Test results for ${test.name}:`, data);

          // Handle the response based on the test type
          const processedData = Array.isArray(data) ? data : [data];
          const formattedResults = processedData.map(item => ({
            ...item,
            test_name: test.name,
            test_type: test.type
          }));

          results.push(...formattedResults);
          
          completedTests++;
          setProgress((completedTests / testFunctions.length) * 100);
          setTestLogs(prev => [...prev, `✅ ${test.name} completed`]);
        } catch (testError: any) {
          console.error(`Test error for ${test.name}:`, testError);
          setTestLogs(prev => [...prev, `❌ ${test.name} failed: ${testError.message}`]);
          throw new Error(`${test.name} failed: ${testError.message}`);
        }
      }

      setTestResults(results);
      setProgress(100);
      setCurrentTest('All tests complete');
      toast.success('All tests completed successfully');
      
      return results;
    } catch (error: any) {
      console.error('Test run error:', error);
      setTestLogs(prev => [...prev, `❌ Error running tests: ${error.message}`]);
      toast.error("Test run failed");
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