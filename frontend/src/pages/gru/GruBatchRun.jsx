import { useState } from "react";
import { 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Activity,
  Brain,
  Calendar,
  Hash,
  FileText,
  RefreshCw
} from "lucide-react";
import { mlApi } from "../../services/mlApi";

export default function GruBatchRun() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runBatch = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const res = await mlApi.post("/ml/run-gru-batch");
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "GRU batch execution failed");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = () => {
    if (error) return AlertCircle;
    if (result) return CheckCircle;
    return Activity;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                GRU Batch Execution
              </h1>
              <p className="text-slate-600 mt-1">
                Run Gated Recurrent Unit model batch processing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Execution Controls
              </h2>
              
              <button
                onClick={runBatch}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium text-base"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Running Batch...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run GRU Batch
                  </>
                )}
              </button>

              {/* Status Summary */}
              {(loading || result || error) && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Current Status
                  </h3>
                  
                  <div className={`p-4 rounded-lg ${
                    loading ? 'bg-blue-50' :
                    error ? 'bg-red-50' :
                    result ? 'bg-green-50' : 'bg-slate-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`w-5 h-5 mt-0.5 ${
                        loading ? 'text-blue-600' :
                        error ? 'text-red-600' :
                        result ? 'text-green-600' : 'text-slate-600'
                      }`} />
                      <div>
                        <p className={`font-medium ${
                          loading ? 'text-blue-700' :
                          error ? 'text-red-700' :
                          result ? 'text-green-700' : 'text-slate-700'
                        }`}>
                          {loading && 'Processing...'}
                          {error && 'Execution Failed'}
                          {result && 'Execution Completed'}
                        </p>
                        {error && (
                          <p className="text-sm text-red-600 mt-1">{error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Note */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  About GRU Batch
                </h4>
                <p className="text-sm text-slate-600">
                  This process runs the Gated Recurrent Unit model to analyze disengagement patterns 
                  and predict student risks. The batch processes all pending student data.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mb-4" />
                    <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Processing GRU Batch
                  </h3>
                  <p className="text-slate-600 max-w-md">
                    Analyzing student data and computing risk predictions. This may take a few moments...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-red-100 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Execution Failed
                  </h3>
                  <p className="text-slate-600 mb-4 max-w-md">{error}</p>
                  <button
                    onClick={runBatch}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {result && !loading && !error && (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Batch Execution Successful
                      </h2>
                      <p className="text-slate-600">
                        GRU model has completed processing
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results Display */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Batch Results
                      </span>
                    </div>
                    {result.timestamp && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(result.timestamp)}
                      </div>
                    )}
                  </div>

                  {/* Summary Stats if available */}
                  {result.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-slate-200">
                      {result.stats.processed && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-blue-700 mb-1">
                            <Hash className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Processed</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-700">{result.stats.processed}</p>
                        </div>
                      )}
                      {result.stats.updated && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-700 mb-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Updated</span>
                          </div>
                          <p className="text-2xl font-bold text-green-700">{result.stats.updated}</p>
                        </div>
                      )}
                      {result.stats.errors && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-yellow-700 mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Errors</span>
                          </div>
                          <p className="text-2xl font-bold text-yellow-700">{result.stats.errors}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw JSON Data */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-700">
                        Response Data
                      </h3>
                      <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>

                  {/* Additional Info */}
                  {result.message && (
                    <div className="px-6 py-4 bg-blue-50 border-t border-slate-200">
                      <div className="flex items-start gap-2">
                        <Activity className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-700">{result.message}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Clear Results
                  </button>
                  <button
                    onClick={runBatch}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Run Another Batch
                  </button>
                </div>
              </div>
            )}

            {/* Initial State */}
            {!loading && !result && !error && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <Brain className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Ready to Run GRU Batch
                  </h3>
                  <p className="text-slate-600 max-w-md mb-6">
                    Click the "Run GRU Batch" button to start processing student data 
                    with the Gated Recurrent Unit model.
                  </p>
                  <button
                    onClick={runBatch}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Play className="w-5 h-5" />
                    Start Batch Execution
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}